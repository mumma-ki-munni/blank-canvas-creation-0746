import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Editor, Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, ReactRenderer } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import tippy, { type Instance } from "tippy.js";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/base/icon";
import { ChatMentionList, type MentionUser } from "./chat-mention-list";
import type { Json } from "@/integrations/supabase/types";

// ku — Enter submits, no newlines
const SendOnEnter = Extension.create({
  name: "sendOnEnter",
  addOptions() {
    return { send: () => {} };
  },
  addKeyboardShortcuts() {
    return {
      Enter: () => {
        (this.options.send as () => void)();
        return true;
      },
    };
  },
});

interface ChatInputProps {
  onSend: (body: Json) => void;
  placeholder?: string;
  triggerFocus?: boolean;
  onChange?: (text: string) => void;
  mentionUsers?: MentionUser[];
  className?: string;
}

export function ChatInput({
  onSend,
  placeholder = "Write something...",
  triggerFocus = false,
  onChange,
  mentionUsers,
  className,
}: ChatInputProps) {
  const [hasText, setHasText] = useState(false);

  // Refs for callbacks to break useMemo dependency chain.
  // Without this, editor gets destroyed/recreated when parent re-renders.
  const onSendRef = useRef(onSend);
  onSendRef.current = onSend;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const mentionUsersRef = useRef(mentionUsers);
  mentionUsersRef.current = mentionUsers;

  // Mention extension — stable, reads users from ref at query time
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mentionExtension = useMemo(() => {
    return Mention.configure({
      HTMLAttributes: { class: "mention" },
      suggestion: {
        items: ({ query }: { query: string }) =>
          (mentionUsersRef.current ?? [])
            .filter((u) => u.name.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 8),
        render: () => {
          let component: ReactRenderer<any>;
          let popup: Instance[];
          return {
            onStart: (props: any) => {
              component = new ReactRenderer(ChatMentionList, {
                props,
                editor: props.editor,
              });
              popup = tippy("body", {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
              });
            },
            onUpdate: (props: any) => {
              component.updateProps(props);
              popup[0]?.setProps({ getReferenceClientRect: props.clientRect });
            },
            onKeyDown: (props: any) => {
              if (props.event.key === "Escape") {
                popup[0]?.hide();
                return true;
              }
              return component.ref?.onKeyDown(props) ?? false;
            },
            onExit: () => {
              popup[0]?.destroy();
              component.destroy();
            },
          };
        },
      },
    });
  }, []);

  // Editor via useEffect — survives React strict mode double-mount.
  // useMemo + separate cleanup effect breaks because strict mode
  // runs cleanup between the two mounts, destroying the editor permanently.
  const [editor, setEditor] = useState<Editor | null>(null);

  useEffect(() => {
    const e = new Editor({
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
        mentionExtension,
        SendOnEnter.configure({
          send: () => {
            if (e.isEmpty) return;
            onSendRef.current(e.getJSON() as Json);
            e.commands.clearContent();
            setHasText(false);
            onChangeRef.current?.("");
          },
        }),
      ],
      onUpdate: ({ editor: ed }) => {
        const text = ed.getText().trim();
        setHasText(text !== "");
        onChangeRef.current?.(text);
      },
    });
    setEditor(e);
    return () => e.destroy();
  }, [placeholder]);

  // triggerFocus prop
  useEffect(() => {
    if (triggerFocus && editor && !editor.isDestroyed) {
      editor.commands.focus();
    }
  }, [editor, triggerFocus]);

  const handleSendClick = useCallback(() => {
    if (!editor || editor.isDestroyed || editor.isEmpty) return;
    onSendRef.current(editor.getJSON() as Json);
    editor.commands.clearContent();
    setHasText(false);
    onChangeRef.current?.("");
  }, [editor]);

  return (
    // border-radius:10px, border:1px solid border/default,
    //           padding-right:6px, hover/focus border/strong
    <div
      className={cn(
        "flex items-center rounded-[10px] border pr-1.5 text-sm max-[768px]:text-base",
        "transition-[border] duration-150 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
        "hover:border-border",
        "focus-within:border-border",
        className,
      )}
    >
      {/* flex:1, max-height:180px, overflow:auto,
          .ProseMirror padding:0.5rem 0.875rem, bg:transparent */}
      <div className="max-h-[180px] min-w-0 flex-1 overflow-auto [&_.ProseMirror]:bg-transparent [&_.ProseMirror]:px-3.5 [&_.ProseMirror]:py-2 [&_.ProseMirror]:outline-none">
        <EditorContent editor={editor} />
      </div>
      {/* I variant:transparent, iconId:send--filled, size:small */}
      <button
        type="button"
        onClick={handleSendClick}
        disabled={!hasText}
        className={cn(
          "flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded",
          "text-muted-foreground hover:text-foreground",
          "disabled:cursor-not-allowed disabled:opacity-30",
        )}
        aria-label="Send"
      >
        <Icon name="send" size={18} />
      </button>
    </div>
  );
}
