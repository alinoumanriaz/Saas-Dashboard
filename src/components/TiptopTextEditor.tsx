'use client';

import { RichTextEditor } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { MantineProvider } from '@mantine/core';

type EditorProps = {
  height?: string;
  initialValue: any;
  onChange: (value: string) => void;
};

export default function TiptopEditor({ height, initialValue, onChange }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Subscript,
      Superscript,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: initialValue,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    // 👇 Ensure editor is mounted immediately
    immediatelyRender: true,
  });

  return (
    <MantineProvider>
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
            <RichTextEditor.BulletList />
            <RichTextEditor.OrderedList />
          </RichTextEditor.ControlsGroup>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Bold />
            <RichTextEditor.Italic />
            <RichTextEditor.Strikethrough />
            <RichTextEditor.Code />
            <RichTextEditor.Underline />
            <RichTextEditor.ClearFormatting />
          </RichTextEditor.ControlsGroup>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Link />
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
          <RichTextEditor.Control
            onClick={() => {
              const url = window.prompt('Image URL');
              if (!url) return;
              const alt = window.prompt('Alt text') || '';
              editor?.chain().focus().setImage({ src: url, alt }).run();
            }}
          >
            🖼️
          </RichTextEditor.Control>
        </RichTextEditor.Toolbar>

        <RichTextEditor.Content className={`${height} overflow-auto`} />
      </RichTextEditor>
    </MantineProvider>
  );
}