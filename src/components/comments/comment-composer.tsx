import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Extension } from "@tiptap/core";
import { cn } from "@/lib/utils";
import type { Json } from "@/integrations/supabase/types";
import { useState, forwardRef, useImperativeHandle } from "react";

// PreventInsertOnEnter
// Blocks both Enter and Mod-Enter from inserting newlines.
// Submit is handled externally via onKeyDown checking metaKey/ctrlKey.
const PreventInsertOnEnter = Extension.create({
  name: "preventInsertOnEnter",
  addKeyboardShortcuts() {
    return {
      Enter: () => true,
      "Mod-Enter": () => true,
    };
  },
});

export interface CommentComposerHandle {
  focus: () => void;
  getJSON: () => Json;
}

interface CommentComposerProps {
  onChange?: (text: string) => void;
  onSubmit?: (body: Json) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export const CommentComposer = forwardRef<CommentComposerHandle, CommentComposerProps>(
  function CommentComposer(
    {
      onChange,
      onSubmit,
      placeholder = "Reply...",
      autoFocus = false,
      className,
    },
    ref,
  ) {
    const [hasContent, setHasContent] = useState(false);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: false,
          blockquote: false,
          codeBlock: false,
          horizontalRule: false,
          bulletList: false,
          orderedList: false,
        }),
        Placeholder.configure({ placeholder }),
        PreventInsertOnEnter,
      ],
      autofocus: autoFocus,
      onUpdate: ({ editor }) => {
        const text = editor.getText().trim();
        setHasContent(text !== "");
        onChange?.(text);
      },
      editorProps: {
        attributes: {
          // font-size:0.875rem; & > p { max-width: 32ch }
          class: "outline-none text-sm [&>p]:max-w-[32ch]",
        },
      },
    });

    useImperativeHandle(ref, () => ({
      focus: () => editor?.commands.focus(),
      getJSON: () => (editor ? editor.getJSON() : {}) as Json,
    }));

    const handleSubmit = () => {
      if (!editor || editor.isEmpty) return;
      onSubmit?.(editor.getJSON() as Json);
      editor.commands.clearContent();
      setHasContent(false);
    };

    return (
      // bg:white, border:1px solid grey[5], border-radius:4px, margin:4px, padding:0.5rem
      // hover: border-color form/border/2, focus-within: border-color form/focus/border
      <div
        className={cn(
          "m-1 rounded bg-background p-2",
          "border border-border",
          "transition-all duration-150",
          "hover:border-muted-foreground/30",
          "focus-within:border-ring",
          className,
        )}
        onKeyDown={(e) => {
          // Mod+Enter submits (metaKey || ctrlKey)
          e.stopPropagation();
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && hasContent) {
            handleSubmit();
          }
        }}
      >
        <EditorContent editor={editor} />
      </div>
    );
  },
);
