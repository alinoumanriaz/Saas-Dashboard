'use client'
import { RichTextEditor } from '@mantine/tiptap'
import { useEditor } from '@tiptap/react'
import TextAlign from '@tiptap/extension-text-align'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'

type EditorProps = {
  initialValue: string
  onChange: (value: string) => void
}

export default function ToastEditor({
  initialValue,
  onChange,
}: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Subscript,
      Superscript,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],

    content: initialValue,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  return (
    <RichTextEditor editor={editor}>

      <RichTextEditor.Toolbar sticky stickyOffset={0} className="bg-white z-[100]">

        {/* Undo / Redo */}
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

        {/* Lists */}
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.BulletList />
          <RichTextEditor.OrderedList />
        </RichTextEditor.ControlsGroup>

        {/* Text Formatting */}
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Bold />
          <RichTextEditor.Italic />
          <RichTextEditor.Strikethrough />
          <RichTextEditor.Code />
          <RichTextEditor.Underline />
          <RichTextEditor.ClearFormatting />
        </RichTextEditor.ControlsGroup>

        {/* Link */}
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Link />
          <RichTextEditor.Unlink />
        </RichTextEditor.ControlsGroup>

        {/* Sub/Sup */}
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

        <RichTextEditor.Control
          onClick={() => {
            const url = window.prompt('Image URL')

            if (!url) return

            const alt = window.prompt('Alt text') || ''

            editor?.chain().focus().setImage({
              src: url,
              alt,
            }).run()
          }}
        >
          🖼️
        </RichTextEditor.Control>

      </RichTextEditor.Toolbar>

      <RichTextEditor.Content 
      // className="max-h-[400px] overflow-y-auto"
      />
    </RichTextEditor>
  )
}