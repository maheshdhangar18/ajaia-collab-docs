import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { fetchDocument, updateDocument } from '../api';
import { Toolbar } from './Toolbar';
import { ShareModal } from './ShareModal';
import {
  ArrowLeft,
  Share2,
  Save,
  Check,
  RefreshCw,
  AlertCircle,
  Download,
  Users,
  ShieldCheck,
  Printer,
  FileCode,
  Lock,
} from 'lucide-react';

export function Editor({ documentId, onBack }) {
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const [documentData, setDocumentData] = useState(null);
  const [title, setTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved' | 'error'
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const debounceTimerRef = useRef(null);
  const latestContentRef = useRef('');
  const titleRef = useRef('');
  const isInitialLoadRef = useRef(true);
  const exportRef = useRef(null);

  // Sync titleRef
  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  // Close export menu on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setExportMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // TipTap Editor instance
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[750px] text-ink',
      },
    },
    onUpdate: ({ editor }) => {
      // Ignore programmatic updates during initial load
      if (isInitialLoadRef.current) {
        return;
      }

      const html = editor.getHTML();
      latestContentRef.current = html;
      setSaveStatus('unsaved');

      // Update word and character counts
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setWordCount(words);
      setCharCount(text.length);

      // Trigger debounced auto-save (800ms) with current title
      triggerAutoSave(html, titleRef.current);
    },
  });

  // Load document data
  useEffect(() => {
    loadDocument();
  }, [documentId, currentUser.email]);

  async function loadDocument() {
    setLoading(true);
    setLoadError(null);
    isInitialLoadRef.current = true;

    try {
      const data = await fetchDocument(documentId, currentUser.email);
      setDocumentData(data);
      setTitle(data.document.title);
      titleRef.current = data.document.title;
      latestContentRef.current = data.document.content;

      if (editor) {
        // Set content without triggering onUpdate transaction
        editor.commands.setContent(data.document.content || '<p></p>', false);
        const text = editor.getText();
        setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
        setCharCount(text.length);
      }

      setSaveStatus('saved');
      // Release initial load lock after a short tick
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 100);
    } catch (err) {
      console.error('Failed to load document:', err);
      setLoadError(err.message || 'Failed to load document');
      addToast({ type: 'error', message: err.message || 'Failed to load document' });
      setSaveStatus('error');
    } finally {
      setLoading(false);
    }
  }

  // Update editor content when editor becomes ready or documentId changes
  useEffect(() => {
    if (editor && documentData && !loading) {
      isInitialLoadRef.current = true;
      editor.commands.setContent(documentData.document.content || '<p></p>', false);
      const text = editor.getText();
      setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
      setCharCount(text.length);
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 100);
    }
  }, [editor, documentData?.document?.id]);

  // Debounced auto-save handler
  const triggerAutoSave = useCallback(
    (contentToSave, titleToSave) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        await performSave(contentToSave, titleToSave);
      }, 800);
    },
    [documentId, currentUser.email]
  );

  async function performSave(contentToSave, titleToSave) {
    const finalTitle = (titleToSave || titleRef.current || 'Untitled Document').trim();
    const finalContent = contentToSave !== undefined ? contentToSave : latestContentRef.current;

    setSaveStatus('saving');
    try {
      await updateDocument(
        documentId,
        {
          title: finalTitle,
          content: finalContent,
        },
        currentUser.email
      );
      setSaveStatus('saved');
    } catch (err) {
      console.error('Auto-save error:', err);
      setSaveStatus('error');
      addToast({ type: 'error', message: err.message || 'Failed to save changes.' });
    }
  }

  // Explicit save button click
  function handleManualSave() {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    performSave(latestContentRef.current, titleRef.current);
  }

  // Title update on blur or Enter
  function handleTitleBlur() {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitle('Untitled Document');
      titleRef.current = 'Untitled Document';
      performSave(latestContentRef.current, 'Untitled Document');
    } else {
      titleRef.current = trimmed;
      performSave(latestContentRef.current, trimmed);
    }
  }

  function handleTitleKeyDown(e) {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  }

  // Export handlers
  function handleExport(format) {
    setExportMenuOpen(false);
    const docName = (title || 'document').toLowerCase().replace(/\s+/g, '-');

    if (format === 'html') {
      const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Inter,sans-serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.6;color:#0F172A;}</style></head><body><h1>${title}</h1>${latestContentRef.current}</body></html>`;
      downloadBlob(fullHtml, `${docName}.html`, 'text/html');
      addToast({ type: 'success', message: 'Exported as HTML' });
    } else if (format === 'txt') {
      const text = `${title}\n\n${editor ? editor.getText() : ''}`;
      downloadBlob(text, `${docName}.txt`, 'text/plain');
      addToast({ type: 'success', message: 'Exported as Plain Text' });
    } else if (format === 'md') {
      const md = `# ${title}\n\n${editor ? editor.getText() : ''}`;
      downloadBlob(md, `${docName}.md`, 'text/markdown');
      addToast({ type: 'success', message: 'Exported as Markdown' });
    } else if (format === 'print') {
      window.print();
    }
  }

  function downloadBlob(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 text-primary-600 animate-spin" />
          <p className="text-sm font-medium text-slate-500">Opening document...</p>
        </div>
      </div>
    );
  }

  // Handle Permission / Not Found Error Screen
  if (loadError || !documentData) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-background p-4">
        <div className="bg-white border border-border rounded-xl p-8 max-w-md w-full shadow-paper text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-ink">Access Restricted</h2>
            <p className="text-xs text-slate-500 mt-1">
              {loadError || 'You do not have permission to view or edit this document.'}
            </p>
            <p className="text-[11px] text-slate-400 mt-2">
              Signed in as <strong className="text-slate-600 font-semibold">{currentUser.name}</strong> ({currentUser.email}). You can switch to the owner's account in the top-right header to test or grant access.
            </p>
          </div>
          <button
            onClick={onBack}
            className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            Back to Documents Workspace
          </button>
        </div>
      </div>
    );
  }

  const isOwner = documentData.isOwner;
  const ownerName = documentData.document?.owner_name || 'Owner';

  return (
    <div className="min-h-[calc(100vh-56px)] bg-background flex flex-col">
      {/* Sticky Top Editor Controls Container (Sub-header + Toolbar) */}
      <div className="sticky top-14 z-30 bg-white border-b border-border shadow-xs">
        {/* Top Bar: Back, Title, Save Status, Actions */}
        <div className="px-4 py-2 flex items-center justify-between gap-4">
          {/* Left: Back button & Editable Title */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg text-slate-500 hover:text-ink hover:bg-slate-100 transition-colors focus:outline-none shrink-0"
              title="Back to Dashboard"
              aria-label="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex flex-col min-w-0 max-w-xl">
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  titleRef.current = e.target.value;
                  setSaveStatus('unsaved');
                }}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                placeholder="Untitled Document"
                className="text-base font-semibold text-ink bg-transparent hover:bg-slate-50 focus:bg-white px-2 py-0.5 rounded-md border border-transparent hover:border-border focus:border-primary-500 focus:outline-none transition-all truncate"
              />
              {/* Ownership subtitle */}
              <div className="flex items-center gap-2 px-2 text-[11px] text-slate-400">
                {isOwner ? (
                  <span className="flex items-center gap-1 text-slate-500">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Owned by you</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-primary-600 font-medium">
                    <Users className="w-3 h-3" />
                    <span>Shared by {ownerName}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Save Status, Explicit Save, Share, Export */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Save Status Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 mr-1">
              {saveStatus === 'saved' && (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Saved</span>
                </>
              )}
              {saveStatus === 'saving' && (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-primary-600 animate-spin" />
                  <span className="text-primary-600 font-medium">Saving...</span>
                </>
              )}
              {saveStatus === 'unsaved' && (
                <span className="text-amber-600 font-medium">Unsaved changes</span>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center gap-1 text-rose-600 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Save failed</span>
                </div>
              )}
            </div>

            {/* Manual Save Button */}
            <button
              onClick={handleManualSave}
              disabled={saveStatus === 'saving' || saveStatus === 'saved'}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 transition-colors shadow-xs"
              title="Save changes to cloud"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              <span>Save</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium rounded-lg border border-border bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1 shadow-xs"
                title="Export document"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Export</span>
              </button>

              {exportMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-44 bg-white border border-border rounded-xl shadow-dropdown py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => handleExport('md')}
                    className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <FileCode className="w-3.5 h-3.5 text-primary-600" />
                    <span>Markdown (.md)</span>
                  </button>
                  <button
                    onClick={() => handleExport('txt')}
                    className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Plain Text (.txt)</span>
                  </button>
                  <button
                    onClick={() => handleExport('html')}
                    className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5 text-purple-600" />
                    <span>Web Page (.html)</span>
                  </button>
                  <div className="border-t border-border my-1" />
                  <button
                    onClick={() => handleExport('print')}
                    className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Print / Save as PDF</span>
                  </button>
                </div>
              )}
            </div>

            {/* Share Button (or Shared Badge) */}
            <button
              onClick={() => setShareModalOpen(true)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs ${
                isOwner
                  ? 'bg-primary-600 hover:bg-primary-700 text-white'
                  : 'bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isOwner ? 'Share' : 'Shared Access'}</span>
            </button>
          </div>
        </div>

        {/* TipTap Formatting Toolbar */}
        <Toolbar editor={editor} />
      </div>

      {/* Editor Canvas Area */}
      <main className="flex-1 py-8 px-4 sm:px-6 overflow-y-auto flex flex-col items-center">
        {/* A4 Centered Paper Canvas */}
        <div
          onClick={() => editor && editor.commands.focus()}
          className="w-full max-w-[816px] bg-paper border border-border rounded-lg shadow-paper p-8 sm:p-14 min-h-[850px] transition-all cursor-text"
        >
          <EditorContent editor={editor} />
        </div>

        {/* Footer Statistics */}
        <div className="w-full max-w-[816px] py-4 px-2 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span>{wordCount} words</span>
            <span>{charCount} characters</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Ajaia Docs</span>
            <span>•</span>
            <span>Distraction-free mode</span>
          </div>
        </div>
      </main>

      {/* Share Modal Dialog */}
      <ShareModal
        documentId={documentId}
        documentTitle={title}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        onSharesUpdated={loadDocument}
      />
    </div>
  );
}
