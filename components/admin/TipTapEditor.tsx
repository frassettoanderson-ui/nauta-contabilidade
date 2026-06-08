'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useCallback } from 'react'
import {
  Bold, Italic, UnderlineIcon, Strikethrough,
  Heading2, Heading3, List, ListOrdered, Quote,
  Link2, ImageIcon, AlignLeft, AlignCenter, AlignRight,
  Minus, Undo, Redo, Code,
} from 'lucide-react'

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

function ToolbarBtn({ onClick, active, title, children }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150"
      style={{
        background: active ? 'rgba(11,188,212,0.18)' : 'transparent',
        color: active ? '#0BBCD4' : '#9ca3af',
        border: active ? '1px solid rgba(11,188,212,0.3)' : '1px solid transparent',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-6 mx-1" style={{ background: 'rgba(255,255,255,0.10)' }} />
}

export default function TipTapEditor({ value, onChange, placeholder = 'Escreva o conteúdo do artigo...' }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'tiptap-editor focus:outline-none',
      },
    },
  })

  // Sincroniza value externo
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  const addLink = useCallback(() => {
    if (!editor) return
    const url = window.prompt('URL do link:')
    if (url) editor.chain().focus().toggleLink({ href: url }).run()
  }, [editor])

  const addImage = useCallback(() => {
    if (!editor) return
    const url = window.prompt('URL da imagem:')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }, [editor])

  if (!editor) return null

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.03)' }}
    >
      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center gap-0.5 p-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}
      >
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} title="Desfazer"><Undo size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} title="Refazer"><Redo size={14} /></ToolbarBtn>
        <Divider />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Negrito"><Bold size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Itálico"><Italic size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Sublinhado"><UnderlineIcon size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Tachado"><Strikethrough size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Código"><Code size={14} /></ToolbarBtn>
        <Divider />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Título H2"><Heading2 size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Título H3"><Heading3 size={14} /></ToolbarBtn>
        <Divider />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista"><List size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista numerada"><ListOrdered size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Citação"><Quote size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Separador"><Minus size={14} /></ToolbarBtn>
        <Divider />
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Alinhar esquerda"><AlignLeft size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Centralizar"><AlignCenter size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Alinhar direita"><AlignRight size={14} /></ToolbarBtn>
        <Divider />
        <ToolbarBtn onClick={addLink} active={editor.isActive('link')} title="Inserir link"><Link2 size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={addImage} title="Inserir imagem"><ImageIcon size={14} /></ToolbarBtn>
      </div>

      {/* Editor area */}
      <div className="p-6 min-h-[400px]">
        <EditorContent editor={editor} />
      </div>

      <style jsx global>{`
        .tiptap-editor {
          min-height: 360px;
          color: #d1d5db;
          font-size: 0.9375rem;
          line-height: 1.8;
        }
        .tiptap-editor h2 { color: #f9fafb; font-size: 1.4rem; font-weight: 900; margin: 1.5rem 0 0.75rem; letter-spacing: -0.02em; }
        .tiptap-editor h3 { color: #f3f4f6; font-size: 1.15rem; font-weight: 800; margin: 1.25rem 0 0.5rem; }
        .tiptap-editor p { margin-bottom: 1rem; }
        .tiptap-editor strong { color: #f9fafb; font-weight: 700; }
        .tiptap-editor em { color: #e5e7eb; }
        .tiptap-editor ul, .tiptap-editor ol { padding-left: 1.5rem; margin: 1rem 0; }
        .tiptap-editor ul { list-style-type: disc; }
        .tiptap-editor ol { list-style-type: decimal; }
        .tiptap-editor li { margin-bottom: 0.4rem; }
        .tiptap-editor a { color: #0BBCD4; text-decoration: underline; }
        .tiptap-editor blockquote {
          border-left: 3px solid #0BBCD4;
          padding: 0.5rem 1rem;
          margin: 1rem 0;
          color: #9ca3af;
          font-style: italic;
          background: rgba(11,188,212,0.05);
          border-radius: 0 8px 8px 0;
        }
        .tiptap-editor code {
          background: rgba(255,255,255,0.08);
          border-radius: 5px;
          padding: 0.1em 0.35em;
          font-size: 0.875em;
          color: #0BBCD4;
          font-family: monospace;
        }
        .tiptap-editor pre {
          background: rgba(0,0,0,0.4);
          border-radius: 10px;
          padding: 1rem 1.25rem;
          overflow-x: auto;
          margin: 1rem 0;
        }
        .tiptap-editor pre code { background: none; color: #e5e7eb; padding: 0; }
        .tiptap-editor hr { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 1.5rem 0; }
        .tiptap-editor img { max-width: 100%; border-radius: 10px; margin: 1rem 0; }
        .tiptap-editor p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #4b5563;
          pointer-events: none;
          float: left;
          height: 0;
        }
      `}</style>
    </div>
  )
}
