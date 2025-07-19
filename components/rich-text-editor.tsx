"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { Button } from '@/components/ui/button'
import { Bold, Italic, List, ListOrdered, Quote, Undo, Redo, Link as LinkIcon, Image as ImageIcon } from 'lucide-react'
import { useState } from 'react'
import { Input } from './ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  editable?: boolean
}

export function RichTextEditor({ content, onChange, editable = true }: RichTextEditorProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Properly configure bullet and ordered lists
        bulletList: {
          keepMarks: true,
          keepAttributes: true,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: true,
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-md max-w-full my-2',
        },
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    // Add editor styles to remove the focus outline
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none',
      },
    },
  })

  if (!editor) {
    return null
  }

  const addLink = () => {
    if (linkUrl) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run()
      setLinkUrl('')
      setLinkDialogOpen(false)
    }
  }

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run()
      setImageUrl('')
      setImageDialogOpen(false)
    }
  }

  if (!editable) {
    return (
      <div className="prose dark:prose-invert max-w-none">
        <EditorContent editor={editor} />
      </div>
    )
  }

  return (
    <div className="border rounded-md">
      {editable && (
        <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50 dark:bg-gray-900 rounded-t-md">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-700' : ''}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-700' : ''}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-700' : ''}
            type="button"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-700' : ''}
            type="button"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? 'bg-gray-200 dark:bg-gray-700' : ''}
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLinkDialogOpen(true)}
            className={editor.isActive('link') ? 'bg-gray-200 dark:bg-gray-700' : ''}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setImageDialogOpen(true)}
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <div className="border-r mx-1 h-6"></div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="p-3">
        <style jsx global>{`
          .ProseMirror {
            min-height: 100px;
            outline: none !important;
          }
          .ProseMirror:focus {
            outline: none !important;
            box-shadow: none !important;
          }
          .ProseMirror ul {
            list-style-type: disc;
            padding-left: 1.5em;
          }
          .ProseMirror ol {
            list-style-type: decimal;
            padding-left: 1.5em;
          }
          .ProseMirror p {
            margin-bottom: 0.5em;
          }
          .ProseMirror blockquote {
            border-left: 3px solid #ddd;
            padding-left: 1em;
            font-style: italic;
          }
        `}</style>
        <EditorContent editor={editor} />
      </div>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Link</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input 
              placeholder="Enter URL" 
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addLink();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button type="button" onClick={addLink}>Add Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Image</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input 
              placeholder="Enter image URL" 
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addImage();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button type="button" onClick={addImage}>Add Image</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function RichTextRenderer({ content }: { content: string }) {
  return (
    <div 
      className="prose dark:prose-invert max-w-none"
      style={{
        // Ensure lists are properly displayed in the renderer
        '--tw-prose-bullets': 'var(--tw-prose-body)',
        '--tw-prose-counters': 'var(--tw-prose-body)'
      }}
      dangerouslySetInnerHTML={{ __html: content }} 
    />
  )
}
