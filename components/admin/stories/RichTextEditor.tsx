"use client";

import {
  useEditor,
  EditorContent,
} from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";

type RichTextEditorProps = {
  value: string;
  onChange: (
    value: string,
  ) => void;
};

export default function RichTextEditor({
  value,
  onChange,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,

    extensions: [
      StarterKit,

      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),

      TextAlign.configure({
        types: [
          "heading",
          "paragraph",
        ],
      }),
    ],

    content: value,

    editorProps: {
      attributes: {
        class:
          "min-h-[260px] px-4 py-4 text-[15px] leading-7 text-black outline-none",
      },
    },

    onUpdate({
      editor,
    }) {
      onChange(
        editor.getHTML(),
      );
    },
  });

  if (!editor) {
    return null;
  }

  function addLink() {
    if (!editor) {
      return;
    }

    const previousUrl =
      editor
        .getAttributes(
          "link",
        )
        .href ?? "";

    const url =
      window.prompt(
        "Enter link URL",
        previousUrl,
      );

    if (url === null) {
      return;
    }

    if (!url.trim()) {
      editor
        .chain()
        .focus()
        .extendMarkRange(
          "link",
        )
        .unsetLink()
        .run();

      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange(
        "link",
      )
      .setLink({
        href: url.trim(),
      })
      .run();
  }

  return (
    <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
      <div className="flex flex-wrap gap-2 border-b border-black/10 bg-neutral-50 p-3">
        <ToolbarButton
          label="B"
          active={editor.isActive(
            "bold",
          )}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBold()
              .run()
          }
        />

        <ToolbarButton
          label="I"
          active={editor.isActive(
            "italic",
          )}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleItalic()
              .run()
          }
        />

        <ToolbarButton
          label="P"
          active={editor.isActive(
            "paragraph",
          )}
          onClick={() =>
            editor
              .chain()
              .focus()
              .setParagraph()
              .run()
          }
        />

        <ToolbarButton
          label="H2"
          active={editor.isActive(
            "heading",
            {
              level: 2,
            },
          )}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({
                level: 2,
              })
              .run()
          }
        />

        <ToolbarButton
          label="H3"
          active={editor.isActive(
            "heading",
            {
              level: 3,
            },
          )}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({
                level: 3,
              })
              .run()
          }
        />

        <ToolbarDivider />

        <ToolbarButton
          label="• List"
          active={editor.isActive(
            "bulletList",
          )}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBulletList()
              .run()
          }
        />

        <ToolbarButton
          label="1. List"
          active={editor.isActive(
            "orderedList",
          )}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleOrderedList()
              .run()
          }
        />

        <ToolbarButton
          label="Quote"
          active={editor.isActive(
            "blockquote",
          )}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBlockquote()
              .run()
          }
        />

        <ToolbarDivider />

        <ToolbarButton
          label="Link"
          active={editor.isActive(
            "link",
          )}
          onClick={
            addLink
          }
        />

        <ToolbarButton
          label="Unlink"
          onClick={() =>
            editor
              .chain()
              .focus()
              .unsetLink()
              .run()
          }
        />

        <ToolbarDivider />

        <ToolbarButton
          label="Left"
          active={editor.isActive(
            {
              textAlign:
                "left",
            },
          )}
          onClick={() =>
            editor
              .chain()
              .focus()
              .setTextAlign(
                "left",
              )
              .run()
          }
        />

        <ToolbarButton
          label="Centre"
          active={editor.isActive(
            {
              textAlign:
                "center",
            },
          )}
          onClick={() =>
            editor
              .chain()
              .focus()
              .setTextAlign(
                "center",
              )
              .run()
          }
        />

        <ToolbarButton
          label="Right"
          active={editor.isActive(
            {
              textAlign:
                "right",
            },
          )}
          onClick={() =>
            editor
              .chain()
              .focus()
              .setTextAlign(
                "right",
              )
              .run()
          }
        />

        <ToolbarDivider />

        <ToolbarButton
          label="Undo"
          disabled={
            !editor.can()
              .undo()
          }
          onClick={() =>
            editor
              .chain()
              .focus()
              .undo()
              .run()
          }
        />

        <ToolbarButton
          label="Redo"
          disabled={
            !editor.can()
              .redo()
          }
          onClick={() =>
            editor
              .chain()
              .focus()
              .redo()
              .run()
          }
        />
      </div>

      <EditorContent
        editor={editor}
      />
    </div>
  );
}

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "rounded-md border px-3 py-2 text-xs font-black transition",
        active
          ? "border-red-600 bg-red-600 text-white"
          : "border-black/10 bg-white text-black hover:bg-black hover:text-white",
        disabled
          ? "cursor-not-allowed opacity-30"
          : "",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function ToolbarDivider() {
  return (
    <div className="mx-1 h-8 w-px bg-black/10" />
  );
}
