import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Editor } from './components/Editor';

function AppContent() {
  const [currentDocId, setCurrentDocId] = useState(() => {
    // Check hash for initial route (e.g., #/doc/:id)
    const hash = window.location.hash;
    const match = hash.match(/^#\/doc\/(.+)$/);
    return match ? match[1] : null;
  });

  // Keep URL hash in sync with current view
  useEffect(() => {
    if (currentDocId) {
      window.location.hash = `#/doc/${currentDocId}`;
    } else {
      window.location.hash = '#/';
    }
  }, [currentDocId]);

  // Listen to popstate / hashchange for browser back/forward buttons
  useEffect(() => {
    function handleHashChange() {
      const hash = window.location.hash;
      const match = hash.match(/^#\/doc\/(.+)$/);
      if (match) {
        setCurrentDocId(match[1]);
      } else {
        setCurrentDocId(null);
      }
    }
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="min-h-screen bg-background text-ink flex flex-col font-sans">
      <Header
        onLogoClick={() => setCurrentDocId(null)}
        isEditing={Boolean(currentDocId)}
      />

      <main className="flex-1">
        {currentDocId ? (
          <Editor
            documentId={currentDocId}
            onBack={() => setCurrentDocId(null)}
          />
        ) : (
          <Dashboard onOpenDocument={(id) => setCurrentDocId(id)} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
