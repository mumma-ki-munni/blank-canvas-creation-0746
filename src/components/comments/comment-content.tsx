import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

import type { Json } from "@/integrations/supabase/types";

// Source: r9in editor-context-provider
// Read-only tiptap renderer for comment bodies
interface CommentContentProps {
  content: Json;
}

export function CommentContent({ content }: CommentContentProps) {
  // Confirmed via console.log: typeof content === "object", value is {type:"doc", content:[...]}
  // Cast is safe — Supabase jsonb always returns a plain object for this column.
  const tiptapContent = content as Record<string, unknown>;

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
    ],
    content: tiptapContent,
    editable: false,
  });

  useEffect(() => {
    if (editor && tiptapContent) {
      editor.commands.setContent(tiptapContent);
    }
  }, [editor, tiptapContent]);

  return (
    <div className="text-sm [word-break:break-word]">
      <EditorContent editor={editor} />
    </div>
  );
}
