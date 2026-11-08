
'use client';

import { RichTextEditor } from '@mantine/tiptap';
import { MantineProvider } from '@mantine/core';
import { useEditor } from '@tiptap/react';
import { CiViewTable } from "react-icons/ci";
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { TableKit } from '@tiptap/extension-table';
import { CiImageOn } from "react-icons/ci";
import { useState } from 'react';
import { LuArrowDown, LuArrowLeft, LuArrowRight, LuArrowUp, LuColumns2, LuMerge, LuRows2, LuSplit, LuTableProperties, LuTrash2 } from 'react-icons/lu';


type EditorProps = {
  height?: string;
  initialValue?: string;
  onChange: (value: string) => void;
};

export default function TiptopTextEditor({
  height = 'h-[400px]',
  initialValue,
  onChange,
}: EditorProps) {
  const [showTableControls, setShowTableControls] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Subscript,
      Superscript,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TableKit,
    ],
    content: initialValue,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  const insertTable = () => {
    setShowTableControls(true);
    editor
      .chain()
      .focus()
      .insertTable({
        rows: 3,
        cols: 3,
        withHeaderRow: true,
      })
      .run();
  };

  const removeAllTables = () => {
    const { state, view } = editor;
    const tablePositions: number[] = [];

    state.doc.descendants((node, pos) => {
      if (node.type.name === 'table') {
        tablePositions.push(pos);
      }
    });

    if (!tablePositions.length) return;

    const transaction = state.tr;

    tablePositions
      .reverse()
      .forEach((pos) => {
        const node = transaction.doc.nodeAt(pos);
        if (node) {
          transaction.delete(pos, pos + node.nodeSize);
        }
      });

    view.dispatch(transaction);
    setShowTableControls(false);
  };

  // const tableControls = [
  //   {
  //     label: 'Add Row Above',
  //     action: () => editor.chain().focus().addRowBefore().run(),
  //   },
  //   {
  //     label: 'Add Row Below',
  //     action: () => editor.chain().focus().addRowAfter().run(),
  //   },
  //   {
  //     label: 'Delete Row',
  //     action: () => editor.chain().focus().deleteRow().run(),
  //   },
  //   {
  //     label: 'Add Column Before',
  //     action: () => editor.chain().focus().addColumnBefore().run(),
  //   },
  //   {
  //     label: 'Add Column After',
  //     action: () => editor.chain().focus().addColumnAfter().run(),
  //   },
  //   {
  //     label: 'Delete Column',
  //     action: () => editor.chain().focus().deleteColumn().run(),
  //   },
  //   {
  //     label: 'Toggle Header Row',
  //     action: () => editor.chain().focus().toggleHeaderRow().run(),
  //   },
  //   {
  //     label: 'Merge Cells',
  //     action: () => editor.chain().focus().mergeCells().run(),
  //   },
  //   {
  //     label: 'Split Cell',
  //     action: () => editor.chain().focus().splitCell().run(),
  //   },
  //   {
  //     label: 'Delete Table',
  //     action: () => editor.chain().focus().deleteTable().run(),
  //   },
  //   {
  //     label: 'Next Cell',
  //     action: () => editor.chain().focus().goToNextCell().run(),
  //   },
  //   {
  //     label: 'Previous Cell',
  //     action: () => editor.chain().focus().goToPreviousCell().run(),
  //   },
  // ];

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
  return (
    <MantineProvider>
      <RichTextEditor editor={editor}>
        <RichTextEditor.Toolbar
          sticky
          stickyOffset={0}
          className="bg-white z-10"
        >
          {/* History */}
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Undo />
            <RichTextEditor.Redo />
          </RichTextEditor.ControlsGroup>

          {/* Headings */}
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.H1 />
            <RichTextEditor.H2 />
            <RichTextEditor.H3 />
            <RichTextEditor.H4 />
          </RichTextEditor.ControlsGroup>

          {/* Text Formatting */}
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Bold />
            <RichTextEditor.Italic />
            <RichTextEditor.Strikethrough />
            <RichTextEditor.Underline />
            <RichTextEditor.Code />
            <RichTextEditor.ClearFormatting />
          </RichTextEditor.ControlsGroup>

          {/* Lists */}
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.BulletList />
            <RichTextEditor.OrderedList />
          </RichTextEditor.ControlsGroup>

          {/* Links */}
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Link />
            <RichTextEditor.Unlink />
          </RichTextEditor.ControlsGroup>

          {/* Script */}
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Subscript />
            <RichTextEditor.Superscript />
          </RichTextEditor.ControlsGroup>

          {/* Alignment */}
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
                const url = window.prompt('Image URL');
                if (!url) return;

                const alt = window.prompt('Alt text') || '';

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
            ><CiViewTable />
            </RichTextEditor.Control>
          </RichTextEditor.ControlsGroup>

          {
            showTableControls && (
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
            )
          }



          {/* Table Operations */}
          {
            showTableControls && (
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
            )
          }



        </RichTextEditor.Toolbar>

        <RichTextEditor.Content
          className={`${height} bg-white overflow-auto tiptap-content`}
        />
      </RichTextEditor>
    </MantineProvider>
  );
}
