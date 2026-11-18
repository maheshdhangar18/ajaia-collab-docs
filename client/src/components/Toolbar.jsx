import React from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo2,
  Redo2,
  Minus,
  Type,
} from 'lucide-react';

export function Toolbar({ editor }) {
  if (!editor) {
    return null;
  }

  const IconButton = ({ onClick, isActive = false, disabled = false, children, title }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`h-8 w-8 rounded-md flex items-center justify-center transition-all ${
        isActive
          ? 'bg-blue-50 text-primary-600 font-semibold shadow-xs'
          : 'text-slate-600 hover:text-ink hover:bg-slate-100'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {children}
    </button>
  );

  const Divider = () => <div className="w-[1px] h-5 bg-border mx-1 shrink-0" />;

  return (
    <div className="bg-white border-b border-border px-4 py-1.5 flex items-center gap-1 flex-wrap shadow-xs sticky top-14 z-30">
      {/* Undo / Redo */}
      <IconButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="w-4 h-4" />
      </IconButton>
      <IconButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo (Ctrl+Y)"
      >
        <Redo2 className="w-4 h-4" />
      </IconButton>

      <Divider />

      {/* Headings & Text Size */}
      <IconButton
        onClick={() => editor.chain().focus().setParagraph().run()}
        isActive={editor.isActive('paragraph')}
        title="Normal Text"
      >
        <Type className="w-4 h-4" />
      </IconButton>

      <IconButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        <Heading1 className="w-4 h-4" />
      </IconButton>

      <IconButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </IconButton>

      <Divider />

      {/* Basic Formatting: Bold, Italic, Underline */}
      <IconButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </IconButton>

      <IconButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </IconButton>

      <IconButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="w-4 h-4" />
      </IconButton>

      <Divider />

      {/* Lists: Bullet & Numbered */}
      <IconButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bulleted List"
      >
        <List className="w-4 h-4" />
      </IconButton>

      <IconButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </IconButton>

      <Divider />

      {/* Blockquote, Code Block, Horizontal Rule */}
      <IconButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Quote Block"
      >
        <Quote className="w-3.5 h-3.5" />
      </IconButton>

      <IconButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        title="Code Block"
      >
        <Code className="w-4 h-4" />
      </IconButton>

      <IconButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Divider"
      >
        <Minus className="w-4 h-4" />
      </IconButton>
    </div>
  );
}
