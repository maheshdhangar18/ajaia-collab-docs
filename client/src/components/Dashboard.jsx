import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { fetchDocuments, createDocument, deleteDocument, importDocument } from '../api';
import { ShareModal } from './ShareModal';
import { DeleteModal } from './DeleteModal';
import {
  Plus,
  UploadCloud,
  Search,
  FileText,
  Share2,
  Trash2,
  Users,
  Shield,
  Clock,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export function Dashboard({ onOpenDocument }) {
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const [documents, setDocuments] = useState({ owned: [], shared: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Modals state
  const [activeShareDoc, setActiveShareDoc] = useState(null);
  const [activeDeleteDoc, setActiveDeleteDoc] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef(null);

  // Load documents when active user changes
  useEffect(() => {
    loadDocs();
  }, [currentUser.email]);

  async function loadDocs() {
    setLoading(true);
    try {
      const data = await fetchDocuments(currentUser.email);
      setDocuments(data);
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Failed to load documents' });
    } finally {
      setLoading(false);
    }
  }

  // Create new blank document
  async function handleCreateBlank() {
    setIsCreating(true);
    try {
      const { document } = await createDocument(
        {
          title: 'Untitled Document',
          content: '<h1>Untitled Document</h1><p>Start writing your thoughts here...</p>',
        },
        currentUser.email
      );
      addToast({ type: 'success', message: 'New document created' });
      onOpenDocument(document.id);
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Failed to create document' });
      setIsCreating(false);
    }
  }

  // File import (.txt / .md up to 2MB)
  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so re-selecting same file triggers change
    e.target.value = '';

    // Frontend validations
    const fileName = file.name.toLowerCase();
    const isTxtOrMd = fileName.endsWith('.txt') || fileName.endsWith('.md');
    if (!isTxtOrMd) {
      addToast({
        type: 'error',
        message: 'Invalid file format. Please upload a .txt or .md file.',
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      addToast({
        type: 'error',
        message: 'File size exceeds the 2MB limit. Please upload a smaller file.',
      });
      return;
    }

    setIsImporting(true);
    try {
      const { document, message } = await importDocument(file, currentUser.email);
      addToast({ type: 'success', message: message || 'Document imported successfully' });
      await loadDocs();
      onOpenDocument(document.id);
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Failed to import file' });
    } finally {
      setIsImporting(false);
    }
  }

  // Confirm delete
  async function handleConfirmDelete() {
    if (!activeDeleteDoc) return;
    setIsDeleting(true);
    try {
      await deleteDocument(activeDeleteDoc.id, currentUser.email);
      addToast({ type: 'info', message: `Deleted "${activeDeleteDoc.title}"` });
      setActiveDeleteDoc(null);
      await loadDocs();
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Failed to delete document' });
    } finally {
      setIsDeleting(false);
    }
  }

  // Helper to format relative time
  function formatRelativeTime(timestamp) {
    if (!timestamp) return 'Recently';
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  // Filter docs by search query
  const filteredOwned = documents.owned.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredShared = documents.shared.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Welcome & Workspace Context */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Documents Workspace
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Signed in as{' '}
            <strong className="text-slate-700 font-semibold">{currentUser.name}</strong> ({currentUser.email})
          </p>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-white text-xs text-ink placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-xs"
          />
        </div>
      </div>

      {/* Action Bar: + Blank Document & Import */}
      <div className="bg-white border border-border rounded-xl p-5 shadow-paper flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-ink flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary-600" />
            <span>Create or Import Work</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Start a fresh collaborative draft or import notes from your local machine.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".txt,.md"
            className="hidden"
          />

          {/* Import Button */}
          <div className="flex flex-col">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="h-9 px-4 rounded-lg border border-border bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4 text-slate-500" />
              <span>{isImporting ? 'Importing...' : 'Import (.txt / .md)'}</span>
            </button>
            <span className="text-[10px] text-slate-400 mt-1 text-center sm:text-left">
              Supports .txt &amp; .md (up to 2MB)
            </span>
          </div>

          {/* + Blank Document */}
          <div className="flex flex-col">
            <button
              onClick={handleCreateBlank}
              disabled={isCreating}
              className="h-9 px-4 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isCreating ? 'Creating...' : '+ Blank Document'}</span>
            </button>
            <span className="text-[10px] text-transparent mt-1 select-none">
              Spacer
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: Owned by me */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-ink">Owned by me</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {filteredOwned.length}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-32 bg-slate-100 animate-pulse rounded-xl border border-slate-200"
              />
            ))}
          </div>
        ) : filteredOwned.length === 0 ? (
          <div className="bg-white border border-border border-dashed rounded-xl p-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">No owned documents found</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {searchQuery
                  ? `No documents matching "${searchQuery}"`
                  : 'Get started by creating a blank document or importing a file.'}
              </p>
            </div>
            <button
              onClick={handleCreateBlank}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border text-primary-600 hover:bg-primary-50 rounded-lg text-xs font-semibold transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Document</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOwned.map((doc) => (
              <div
                key={doc.id}
                className="bg-white border border-border rounded-xl p-4 shadow-paper hover:shadow-paper-elevated transition-all flex flex-col justify-between group relative"
              >
                <div>
                  {/* Card Header: Icon + Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-primary-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Owner Badge */}
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        You
                      </span>

                      {/* Shared Count Pill */}
                      {doc.shared_count > 0 ? (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-primary-700 border border-blue-200 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>Shared with {doc.shared_count}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
                          Private
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Click to Open */}
                  <button
                    onClick={() => onOpenDocument(doc.id)}
                    className="text-left w-full focus:outline-none group-hover:text-primary-600 transition-colors"
                  >
                    <h3 className="text-sm font-semibold text-ink line-clamp-1 group-hover:text-primary-600 transition-colors">
                      {doc.title}
                    </h3>
                  </button>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Updated {formatRelativeTime(doc.updated_at)}</span>
                  </div>
                </div>

                {/* Card Actions: Open, Share, Delete */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/80">
                  <button
                    onClick={() => onOpenDocument(doc.id)}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
                  >
                    <span>Open Editor</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveShareDoc(doc)}
                      className="p-1.5 rounded-md text-slate-500 hover:text-primary-600 hover:bg-slate-100 transition-colors"
                      title="Share document"
                      aria-label="Share document"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setActiveDeleteDoc(doc)}
                      className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete document"
                      aria-label="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 2: Shared with me */}
      <section className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-ink">Shared with me</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {filteredShared.length}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="h-32 bg-slate-100 animate-pulse rounded-xl border border-slate-200"
              />
            ))}
          </div>
        ) : filteredShared.length === 0 ? (
          <div className="bg-white border border-border border-dashed rounded-xl p-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-ink">No shared documents</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Teammates haven't shared any documents with{' '}
              <strong className="text-slate-700 font-semibold">{currentUser.name}</strong> yet. Use the top account switcher to switch to Alex or Priya and share a document with this account!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredShared.map((doc) => (
              <div
                key={doc.id}
                className="bg-white border border-border rounded-xl p-4 shadow-paper hover:shadow-paper-elevated transition-all flex flex-col justify-between group relative"
              >
                <div>
                  {/* Card Header: Shared By Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>

                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                      <Shield className="w-3 h-3 text-primary-600" />
                      <span>Shared by {doc.owner_name}</span>
                    </span>
                  </div>

                  {/* Title & Click to Open */}
                  <button
                    onClick={() => onOpenDocument(doc.id)}
                    className="text-left w-full focus:outline-none group-hover:text-primary-600 transition-colors"
                  >
                    <h3 className="text-sm font-semibold text-ink line-clamp-1 group-hover:text-primary-600 transition-colors">
                      {doc.title}
                    </h3>
                  </button>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Updated {formatRelativeTime(doc.updated_at)}</span>
                  </div>
                </div>

                {/* Card Actions: Open, View Shares (No Delete button!) */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/80">
                  <button
                    onClick={() => onOpenDocument(doc.id)}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
                  >
                    <span>View &amp; Edit</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => setActiveShareDoc(doc)}
                    className="p-1.5 rounded-md text-slate-500 hover:text-primary-600 hover:bg-slate-100 transition-colors"
                    title="View access details"
                    aria-label="View access details"
                  >
                    <Users className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Share Modal */}
      {activeShareDoc && (
        <ShareModal
          documentId={activeShareDoc.id}
          documentTitle={activeShareDoc.title}
          isOpen={Boolean(activeShareDoc)}
          onClose={() => setActiveShareDoc(null)}
          onSharesUpdated={loadDocs}
        />
      )}

      {/* Delete Confirmation Modal */}
      {activeDeleteDoc && (
        <DeleteModal
          isOpen={Boolean(activeDeleteDoc)}
          documentTitle={activeDeleteDoc.title}
          isDeleting={isDeleting}
          onClose={() => setActiveDeleteDoc(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
