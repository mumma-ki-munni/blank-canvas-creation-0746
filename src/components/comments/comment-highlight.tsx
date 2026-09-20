import { useEffect, useState, useCallback, useRef } from "react";
import type { Editor } from "@tiptap/react";
import type { CommentThread } from "./use-comments";
import "./comment-highlight.css";

// que (overlay), Jue (rectangle), v9 (renderer), me (compute)

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Highlight {
  threadId: string;
  rects: Rect[];
  active: boolean;
}

interface CommentHighlightLayerProps {
  editor: Editor;
  threads: CommentThread[];
  activeThreadId?: string | null;
  pendingAnchor?: { from: number; to: number } | null;
  onThreadClick: (threadId: string) => void;
}

export function CommentHighlightLayer({
  editor,
  threads,
  activeThreadId,
  pendingAnchor,
  onThreadClick,
}: CommentHighlightLayerProps) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [draftRects, setDraftRects] = useState<Rect[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);

  // me — compute rectangles relative to the overlay container
  const computeHighlights = useCallback(() => {
    if (!overlayRef.current) return;
    const containerRect = overlayRef.current.getBoundingClientRect();
    const results: Highlight[] = [];

    for (const thread of threads) {
      if (thread.anchor_type !== "range") continue;

      const anchor = thread.anchor_data as { from?: number; to?: number };
      if (anchor.from === undefined || anchor.to === undefined) continue;

      try {
        const docSize = editor.state.doc.content.size;
        if (anchor.from >= docSize || anchor.to >= docSize) continue;

        const rects = computeRectsForRange(editor, containerRect, anchor.from, anchor.to);
        if (rects.length === 0) continue;

        results.push({
          threadId: thread.id,
          rects,
          active: thread.id === activeThreadId,
        });
      } catch {
        // Position invalid (content changed)
      }
    }

    setHighlights(results);
  }, [editor, threads, activeThreadId]);

  // he — compute draft highlight for pending anchor
  const computeDraftHighlight = useCallback(() => {
    if (!pendingAnchor || !overlayRef.current) {
      setDraftRects([]);
      return;
    }

    try {
      const containerRect = overlayRef.current.getBoundingClientRect();
      const rects = computeRectsForRange(editor, containerRect, pendingAnchor.from, pendingAnchor.to);
      setDraftRects(rects);
    } catch {
      setDraftRects([]);
    }
  }, [editor, pendingAnchor]);

  // Recompute on editor transactions + scroll
  useEffect(() => {
    const recompute = () => {
      computeHighlights();
      computeDraftHighlight();
    };

    recompute();
    editor.on("transaction", recompute);

    const scrollEl = editor.view.dom.closest("[class*='overflow']");
    scrollEl?.addEventListener("scroll", recompute);

    return () => {
      editor.off("transaction", recompute);
      scrollEl?.removeEventListener("scroll", recompute);
    };
  }, [editor, computeHighlights, computeDraftHighlight]);

  return (
    // que — absolute inset-0, pointer-events:none
    // Always render so overlayRef is available for rect computation
    <div ref={overlayRef} className="comment-highlight-layer">
      {highlights.map((h) =>
        h.rects.map((rect, i) => (
          <div
            key={`${h.threadId}-${i}`}
            className="comment-highlight-rect"
            data-active={h.active || undefined}
            style={{
              width: rect.width,
              height: rect.height,
              transform: `translate(${rect.x}px, ${rect.y}px)`,
              opacity: h.active ? 1 : 0.6,
              pointerEvents: "auto",
              cursor: "pointer",
            }}
            onClick={() => onThreadClick(h.threadId)}
          />
        )),
      )}

      {draftRects.map((rect, i) => (
        <div
          key={`draft-${i}`}
          className="comment-highlight-rect"
          data-active="true"
          style={{
            width: rect.width,
            height: rect.height,
            transform: `translate(${rect.x}px, ${rect.y}px)`,
          }}
        />
      ))}
    </div>
  );
}

// Compute rectangles relative to containerRect (the overlay's positioned ancestor)
// v9 — extends 1.5px above/below ($y - 1.5, $height + 2 * 1.5)
function computeRectsForRange(
  editor: Editor,
  containerRect: DOMRect,
  from: number,
  to: number,
): Rect[] {
  const pad = 1.5;

  // Multi-line: use DOM Range.getClientRects()
  try {
    const domFrom = editor.view.domAtPos(from);
    const domTo = editor.view.domAtPos(to);

    const range = document.createRange();
    range.setStart(domFrom.node, domFrom.offset);
    range.setEnd(domTo.node, domTo.offset);

    const clientRects = range.getClientRects();
    if (clientRects.length > 0) {
      return Array.from(clientRects).map((r) => ({
        x: r.left - containerRect.left,
        y: r.top - containerRect.top - pad,
        width: r.width,
        height: r.height + pad * 2,
      }));
    }
  } catch {
    // Fall through to coordsAtPos
  }

  // Fallback: single rect
  try {
    const coordsFrom = editor.view.coordsAtPos(from);
    const coordsTo = editor.view.coordsAtPos(to);
    return [
      {
        x: coordsFrom.left - containerRect.left,
        y: coordsFrom.top - containerRect.top - pad,
        width: coordsTo.right - coordsFrom.left,
        height: coordsFrom.bottom - coordsFrom.top + pad * 2,
      },
    ];
  } catch {
    return [];
  }
}
