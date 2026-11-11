'use client';

import { RichTextEditor, Link } from '@mantine/tiptap';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/tiptap/styles.css';
import { useEditor } from '@tiptap/react';
import { CiViewTable, CiImageOn } from 'react-icons/ci';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { TableKit } from '@tiptap/extension-table';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LuArrowDown,
  LuArrowLeft,
  LuArrowRight,
  LuArrowUp,
  LuColumns2,
  LuLink,
  LuMerge,
  LuRows2,
  LuSplit,
  LuTableProperties,
  LuTrash2,
} from 'react-icons/lu';

type EditorProps = {
  height?: string;
  initialValue?: string;
  onChange: (value: string) => void;
};

/** Normalize a user-typed URL: trim, add https:// if missing, reject invalid. */
function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    new URL(withProtocol);
    return withProtocol;
  } catch {
    return null;
  }
}

export default function TiptopTextEditor({
  height = 'h-[400px]',
  initialValue,
  onChange,
}: EditorProps) {
  const [showTableControls, setShowTableControls] = useState(false);

  /* ------------------------------------------------------------------ */
  /* Link handler — must be defined before useEditor so we can wire it  */
  /* ------------------------------------------------------------------ */
  const editorRef = useRef<any>(null);

  const handleLink = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;

    const attrs = editor.getAttributes('link');
    const previousUrl: string = attrs.href ?? '';
    const previousText = hasSelection
      ? editor.state.doc.textBetween(from, to, ' ')
      : '';

    /* 1. URL */
    const rawUrl = window.prompt(
      'Link URL\n\nLeave empty to remove the link.',
      previousUrl
    );
    if (rawUrl === null) return;

    if (rawUrl.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    const url = normalizeUrl(rawUrl);
    if (!url) {
      window.alert('That doesn\u2019t look like a valid URL.');
      return;
    }

    /* 2. Text (only when nothing was selected) */
    let text = previousText;
    if (!hasSelection) {
      const inputText = window.prompt(
        'Link text (leave empty to use the URL)',
        previousText || url
      );
      if (inputText === null) return;
      text = inputText.trim() || url;
    }

    /* 3. Target */
    const openNewTab = window.confirm(
      'Open this link in a new tab?\n\nOK = new tab, Cancel = same tab'
    );

    /* 4. rel */
    const addNofollow = window.confirm(
      'Add rel="nofollow" to this link?\n\nOK = yes, Cancel = no'
    );

    const relParts = [
      openNewTab ? 'noopener noreferrer' : '',
      addNofollow ? 'nofollow' : '',
    ].filter(Boolean);

    const linkAttrs: Record<string, any> = {
      href: url,
      target: openNewTab ? '_blank' : null,
      rel: relParts.length ? relParts.join(' ') : null,
    };

    if (hasSelection) {
      editor.chain().focus().extendMarkRange('link').setLink(linkAttrs).run();
    } else {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text,
          marks: [{ type: 'link', attrs: linkAttrs }],
        })
        .run();
    }
  }, []);

  /* Ref to always point to latest handleLink for handleKeyDown */
  const handleLinkRef = useRef(handleLink);
  useEffect(() => {
    handleLinkRef.current = handleLink;
  }, [handleLink]);

  /* ------------------------------------------------------------------ */
  /* Editor                                                              */
  /* ------------------------------------------------------------------ */
  const editor = useEditor({
    extensions: [
      // Disable StarterKit's built-in link so we can configure our own
      StarterKit.configure({ link: false }),

      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
        },
      }),

      Image.configure({ inline: false, allowBase64: true }),
      Subscript,
      Superscript,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TableKit,
    ],
    content: initialValue ?? '',
    immediatelyRender: false,
    // Required for Mantine toolbar controls to reflect selection state
    shouldRerenderOnTransaction: true,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      handleKeyDown: (_view, event) => {
        if (
          (event.metaKey || event.ctrlKey) &&
          event.key.toLowerCase() === 'k'
        ) {
          event.preventDefault();
          handleLinkRef.current();
          return true;
        }
        return false;
      },
    },
  });

  /* Keep editorRef in sync */
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  /* ------------------------------------------------------------------ */
  /* Sync external initialValue changes (fixes edit-mode empty content) */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!editor) return;
    const next = initialValue ?? '';
    if (!next) return;
    if (next !== editor.getHTML() && next !== '<p></p>') {
      editor.commands.setContent(next, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue, editor]);

  if (!editor) return null;

  /* ------------------------------------------------------------------ */
  /* Table actions                                                       */
  /* ------------------------------------------------------------------ */
  const insertTable = () => {
    setShowTableControls(true);
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  const removeAllTables = () => {
    // Repeatedly delete the last table until none remain — safe for nesting.
    for (let guard = 0; guard < 100; guard++) {
      const positions: number[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'table') positions.push(pos);
      });
      if (!positions.length) break;

      const last = positions[positions.length - 1];
      // Place the cursor inside the last table, then delete it
      editor.chain().focus().setTextSelection(last + 1).deleteTable().run();

      // Safety: if for some reason deleteTable didn't work, bail out
      const stillThere = editor.state.doc.nodeAt(last);
      if (stillThere?.type.name === 'table') break;
    }
    setShowTableControls(false);
  };

  const tableControls = [
    { label: 'Add Row Above', icon: <LuArrowUp />, action: () => editor.chain().focus().addRowBefore().run() },
    { label: 'Add Row Below', icon: <LuArrowDown />, action: () => editor.chain().focus().addRowAfter().run() },
    { label: 'Delete Row', icon: <LuRows2 />, action: () => editor.chain().focus().deleteRow().run() },
    { label: 'Add Column Before', icon: <LuArrowLeft />, action: () => editor.chain().focus().addColumnBefore().run() },
    { label: 'Add Column After', icon: <LuArrowRight />, action: () => editor.chain().focus().addColumnAfter().run() },
    { label: 'Delete Column', icon: <LuColumns2 />, action: () => editor.chain().focus().deleteColumn().run() },
    { label: 'Toggle Header Row', icon: <LuTableProperties />, action: () => editor.chain().focus().toggleHeaderRow().run() },
    { label: 'Merge Cells', icon: <LuMerge />, action: () => editor.chain().focus().mergeCells().run() },
    { label: 'Split Cell', icon: <LuSplit />, action: () => editor.chain().focus().splitCell().run() },
    { label: 'Delete Table', icon: <LuTrash2 />, danger: true, action: () => editor.chain().focus().deleteTable().run() },
    { label: 'Next Cell', icon: <LuArrowDown />, action: () => editor.chain().focus().goToNextCell().run() },
    { label: 'Previous Cell', icon: <LuArrowUp />, action: () => editor.chain().focus().goToPreviousCell().run() },
  ];

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */
  return (
    <MantineProvider>
      {/*
        NOTE: Inline <style> here is duplicated per editor instance.
        For production, move these rules to a global stylesheet.
      */}
      <style>{`
        .tiptap-content a,
        .ProseMirror a {
          color: #2563eb;
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: color .15s ease;
        }
        .tiptap-content a:hover,
        .ProseMirror a:hover {
          color: #1d4ed8;
        }
      `}</style>

      <RichTextEditor editor={editor}>
        <RichTextEditor.Toolbar sticky stickyOffset={0} className="bg-white z-10">
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Undo />
            <RichTextEditor.Redo />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.H1 />
            <RichTextEditor.H2 />
            <RichTextEditor.H3 />
            <RichTextEditor.H4 />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Bold />
            <RichTextEditor.Italic />
            <RichTextEditor.Strikethrough />
            <RichTextEditor.Underline />
            <RichTextEditor.Code />
            <RichTextEditor.ClearFormatting />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.BulletList />
            <RichTextEditor.OrderedList />
          </RichTextEditor.ControlsGroup>

          {/* Link: custom Control that works inside Dialog focus traps */}
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Control
              onClick={handleLink}
              aria-label="Insert or edit link"
              title="Insert / edit link (Ctrl+K)"
            >
              <LuLink size={12} />
            </RichTextEditor.Control>
            <RichTextEditor.Unlink />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Subscript />
            <RichTextEditor.Superscript />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.AlignLeft />
            <RichTextEditor.AlignCenter />
            <RichTextEditor.AlignJustify />
            <RichTextEditor.AlignRight />
          </RichTextEditor.ControlsGroup>

          {/* Insert Image */}
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Control
              onClick={() => {
                const raw = window.prompt('Image URL');
                if (raw === null) return;
                const url = normalizeUrl(raw);
                if (!url) {
                  window.alert('That doesn\u2019t look like a valid image URL.');
                  return;
                }
                const alt = window.prompt('Alt text (optional)') ?? '';
                editor.chain().focus().setImage({ src: url, alt }).run();
              }}
              aria-label="Insert image"
              title="Insert image"
            >
              <CiImageOn />
            </RichTextEditor.Control>
          </RichTextEditor.ControlsGroup>

          {/* Insert Table */}
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Control
              onClick={insertTable}
              aria-label="Insert table"
              title="Insert 3 x 3 table"
            >
              <CiViewTable />
            </RichTextEditor.Control>
          </RichTextEditor.ControlsGroup>

          {showTableControls && (
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Control
                onClick={removeAllTables}
                aria-label="Remove all tables"
                title="Remove all tables"
              >
                <span className="text-[11px] px-2 font-medium text-red-600">
                  Remove All Tables
                </span>
              </RichTextEditor.Control>
            </RichTextEditor.ControlsGroup>
          )}

          {showTableControls && (
            <RichTextEditor.ControlsGroup>
              {tableControls.map((control) => (
                <RichTextEditor.Control
                  key={control.label}
                  onClick={control.action}
                  aria-label={control.label}
                  title={control.label}
                  className={`
                    w-8! h-8! min-w-8! p-0! text-xs
                    flex items-center justify-center
                    rounded-md transition-colors
                    ${control.danger
                      ? 'text-red-500 hover:bg-red-50!'
                      : 'text-gray-600 hover:bg-blue-50! hover:text-blue-600!'
                    }
                  `}
                >
                  {control.icon}
                </RichTextEditor.Control>
              ))}
            </RichTextEditor.ControlsGroup>
          )}
        </RichTextEditor.Toolbar>

        <RichTextEditor.Content
          className={`${height} bg-white overflow-auto tiptap-content`}
        />
      </RichTextEditor>
    </MantineProvider>
  );
}