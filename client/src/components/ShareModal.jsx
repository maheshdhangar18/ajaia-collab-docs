import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { fetchDocumentShares, shareDocument, revokeShare } from '../api';
import { X, Users, UserPlus, Trash2, Shield, Copy, Check } from 'lucide-react';

export function ShareModal({ documentId, documentTitle, isOpen, onClose, onSharesUpdated }) {
  const { currentUser, users } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [shareData, setShareData] = useState({ owner: null, shares: [], isOwner: false });
  const [selectedEmail, setSelectedEmail] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Load current shares
  useEffect(() => {
    if (isOpen && documentId) {
      loadShares();
    }
  }, [isOpen, documentId, currentUser.email]);

  async function loadShares() {
    setLoading(true);
    try {
      const data = await fetchDocumentShares(documentId, currentUser.email);
      setShareData(data);
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Failed to load document shares' });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddShare(e) {
    e?.preventDefault();
    if (!selectedEmail.trim()) {
      addToast({ type: 'error', message: 'Please select or enter a teammate email' });
      return;
    }

    setSubmitting(true);
    try {
      await shareDocument(documentId, selectedEmail.trim(), currentUser.email);
      addToast({ type: 'success', message: `Access granted to ${selectedEmail}` });
      setSelectedEmail('');
      await loadShares();
      if (onSharesUpdated) onSharesUpdated();
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Failed to grant access' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(email) {
    try {
      await revokeShare(documentId, email, currentUser.email);
      addToast({ type: 'info', message: `Revoked access for ${email}` });
      await loadShares();
      if (onSharesUpdated) onSharesUpdated();
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Failed to revoke access' });
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    addToast({ type: 'success', message: 'Document link copied to clipboard' });
    setTimeout(() => setCopiedLink(false), 2000);
  }

  if (!isOpen) return null;

  // Filter candidates who don't already have access and are not the owner
  const availableTeammates = users.filter((u) => {
    const isOwner = shareData.owner && u.email.toLowerCase() === shareData.owner.email.toLowerCase();
    const isAlreadyShared = shareData.shares.some(
      (s) => s.email.toLowerCase() === u.email.toLowerCase()
    );
    return !isOwner && !isAlreadyShared;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-xl border border-border shadow-dropdown max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-primary-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink">Share Document</h2>
              <p className="text-xs text-slate-500 truncate max-w-[260px]">
                {documentTitle || 'Untitled Document'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Owner can grant access */}
          {shareData.isOwner ? (
            <form onSubmit={handleAddShare} className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Grant Access to Teammate
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select
                    value={selectedEmail}
                    onChange={(e) => setSelectedEmail(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border bg-white text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 appearance-none pr-8 cursor-pointer shadow-sm"
                  >
                    <option value="">Select a teammate from Ajaia...</option>
                    {availableTeammates.map((teammate) => (
                      <option key={teammate.id} value={teammate.email}>
                        {teammate.name} ({teammate.email}) - {teammate.role}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !selectedEmail}
                  className="h-9 px-3.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Sharing...' : 'Add'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                You have collaborator access. Only the document owner can invite new members.
              </span>
            </div>
          )}

          {/* People with Access List */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
              People With Access
            </h3>

            {loading ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Loading access list...
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {/* Document Owner */}
                {shareData.owner && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-slate-50/50">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-[11px] font-bold">
                        {shareData.owner.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-ink">
                            {shareData.owner.name}
                          </span>
                          {shareData.isOwner && (
                            <span className="text-[10px] text-primary-600 font-semibold bg-primary-50 px-1.5 py-0.2 rounded border border-primary-200">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {shareData.owner.email}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-border">
                      Owner
                    </span>
                  </div>
                )}

                {/* Collaborators */}
                {shareData.shares.map((share) => (
                  <div
                    key={share.email}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-[11px] font-bold">
                        {share.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-ink">
                            {share.name}
                          </span>
                          {share.email.toLowerCase() === currentUser.email.toLowerCase() && (
                            <span className="text-[10px] text-primary-600 font-semibold bg-primary-50 px-1.5 py-0.2 rounded border border-primary-200">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {share.email}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Editor
                      </span>
                      {shareData.isOwner && (
                        <button
                          onClick={() => handleRevoke(share.email)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Revoke access"
                          aria-label={`Revoke access for ${share.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {shareData.shares.length === 0 && (
                  <div className="py-3 text-center text-xs text-slate-400 bg-slate-50/60 rounded-lg border border-dashed border-border">
                    This document has not been shared with any teammates yet.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-border flex items-center justify-between">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-ink font-medium px-2.5 py-1.5 rounded-lg border border-border bg-white hover:bg-slate-50 transition-colors shadow-sm"
          >
            {copiedLink ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Document Link'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-100 border border-border text-ink rounded-lg text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
