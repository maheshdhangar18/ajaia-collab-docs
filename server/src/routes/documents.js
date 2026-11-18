import express from 'express';
import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { SEEDED_USERS } from './users.js';

const router = express.Router();

// Helper to get active user details from headers
function getActiveUser(req) {
  const email = (req.headers['x-user-email'] || 'mahesh@ajaia.ai').toLowerCase().trim();
  const matched = SEEDED_USERS.find(u => u.email.toLowerCase() === email);
  return {
    email,
    name: matched ? matched.name : (email.split('@')[0] || 'Unknown User'),
  };
}

// Multer memory storage for .txt / .md uploads up to 2MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.txt' || ext === '.md') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .txt and .md files are supported (up to 2MB).'));
    }
  },
});

// Convert markdown/plain text to clean HTML for TipTap
function textToHtml(text) {
  if (!text) return '<p></p>';
  const lines = text.split(/\r?\n/);
  const htmlParts = [];
  let inUl = false;
  let inOl = false;

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inUl) { htmlParts.push('</ul>'); inUl = false; }
      if (inOl) { htmlParts.push('</ol>'); inOl = false; }
      continue;
    }

    if (trimmed.startsWith('# ')) {
      if (inUl) { htmlParts.push('</ul>'); inUl = false; }
      if (inOl) { htmlParts.push('</ol>'); inOl = false; }
      htmlParts.push(`<h1>${escapeHtml(trimmed.slice(2))}</h1>`);
    } else if (trimmed.startsWith('## ')) {
      if (inUl) { htmlParts.push('</ul>'); inUl = false; }
      if (inOl) { htmlParts.push('</ol>'); inOl = false; }
      htmlParts.push(`<h2>${escapeHtml(trimmed.slice(3))}</h2>`);
    } else if (trimmed.startsWith('### ')) {
      if (inUl) { htmlParts.push('</ul>'); inUl = false; }
      if (inOl) { htmlParts.push('</ol>'); inOl = false; }
      htmlParts.push(`<h3>${escapeHtml(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (inOl) { htmlParts.push('</ol>'); inOl = false; }
      if (!inUl) { htmlParts.push('<ul>'); inUl = true; }
      htmlParts.push(`<li>${escapeHtml(trimmed.slice(2))}</li>`);
    } else if (/^\d+\.\s/.test(trimmed)) {
      if (inUl) { htmlParts.push('</ul>'); inUl = false; }
      if (!inOl) { htmlParts.push('<ol>'); inOl = true; }
      const itemText = trimmed.replace(/^\d+\.\s/, '');
      htmlParts.push(`<li>${escapeHtml(itemText)}</li>`);
    } else if (trimmed.startsWith('> ')) {
      if (inUl) { htmlParts.push('</ul>'); inUl = false; }
      if (inOl) { htmlParts.push('</ol>'); inOl = false; }
      htmlParts.push(`<blockquote><p>${escapeHtml(trimmed.slice(2))}</p></blockquote>`);
    } else {
      if (inUl) { htmlParts.push('</ul>'); inUl = false; }
      if (inOl) { htmlParts.push('</ol>'); inOl = false; }
      htmlParts.push(`<p>${escapeHtml(trimmed)}</p>`);
    }
  }

  if (inUl) htmlParts.push('</ul>');
  if (inOl) htmlParts.push('</ol>');

  return htmlParts.join('\n');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 1. GET /api/documents - List owned and shared documents
router.get('/', (req, res) => {
  try {
    const user = getActiveUser(req);

    const ownedStmt = db.prepare(`
      SELECT d.*, 
        (SELECT COUNT(*) FROM document_shares s WHERE s.document_id = d.id) as shared_count
      FROM documents d
      WHERE LOWER(d.owner_email) = ?
      ORDER BY d.updated_at DESC
    `);
    const owned = ownedStmt.all(user.email.toLowerCase());

    const sharedStmt = db.prepare(`
      SELECT d.*, 
        (SELECT COUNT(*) FROM document_shares s WHERE s.document_id = d.id) as shared_count
      FROM documents d
      INNER JOIN document_shares ds ON d.id = ds.document_id
      WHERE LOWER(ds.shared_with_email) = ?
      ORDER BY d.updated_at DESC
    `);
    const shared = sharedStmt.all(user.email.toLowerCase());

    res.json({ owned, shared });
  } catch (err) {
    console.error('Error fetching documents:', err);
    res.status(500).json({ message: 'Internal server error fetching documents' });
  }
});

// 2. GET /api/documents/:id - Single document view
router.get('/:id', (req, res) => {
  try {
    const user = getActiveUser(req);
    const { id } = req.params;

    const docStmt = db.prepare('SELECT * FROM documents WHERE id = ?');
    const doc = docStmt.get(id);

    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const isOwner = doc.owner_email.toLowerCase() === user.email.toLowerCase();

    // If not owner, check if shared
    if (!isOwner) {
      const shareStmt = db.prepare(`
        SELECT * FROM document_shares 
        WHERE document_id = ? AND LOWER(shared_with_email) = ?
      `);
      const share = shareStmt.get(id, user.email.toLowerCase());
      if (!share) {
        return res.status(403).json({ message: 'You do not have access to this document' });
      }
    }

    res.json({ document: doc, isOwner });
  } catch (err) {
    console.error('Error fetching document:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 3. POST /api/documents - Create new blank document
router.post('/', (req, res) => {
  try {
    const user = getActiveUser(req);
    const { title = 'Untitled Document', content = '<p></p>' } = req.body;

    const id = `doc-${crypto.randomUUID().slice(0, 8)}`;
    const now = Date.now();

    const insertStmt = db.prepare(`
      INSERT INTO documents (id, title, content, owner_email, owner_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(id, title.trim() || 'Untitled Document', content, user.email, user.name, now, now);

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
    res.status(201).json({ document: doc });
  } catch (err) {
    console.error('Error creating document:', err);
    res.status(500).json({ message: 'Internal server error creating document' });
  }
});

// 4. POST /api/documents/import - Import .txt or .md file
router.post('/import', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File exceeds the 2MB size limit. Please upload a smaller file.' });
      }
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded. Please select a .txt or .md file.' });
    }

    try {
      const user = getActiveUser(req);
      const originalName = req.file.originalname;
      const parsedTitle = path.basename(originalName, path.extname(originalName))
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());

      const rawText = req.file.buffer.toString('utf-8');
      const htmlContent = textToHtml(rawText);

      const id = `doc-${crypto.randomUUID().slice(0, 8)}`;
      const now = Date.now();

      const insertStmt = db.prepare(`
        INSERT INTO documents (id, title, content, owner_email, owner_name, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      insertStmt.run(id, parsedTitle || 'Imported Document', htmlContent, user.email, user.name, now, now);

      const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
      res.status(201).json({ document: doc, message: 'Document imported successfully' });
    } catch (importErr) {
      console.error('Error importing file:', importErr);
      res.status(500).json({ message: 'Failed to process and import file' });
    }
  });
});

// 5. PUT /api/documents/:id - Update document title and/or content
router.put('/:id', (req, res) => {
  try {
    const user = getActiveUser(req);
    const { id } = req.params;
    const { title, content } = req.body;

    const docStmt = db.prepare('SELECT * FROM documents WHERE id = ?');
    const doc = docStmt.get(id);

    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const isOwner = doc.owner_email.toLowerCase() === user.email.toLowerCase();

    if (!isOwner) {
      const shareStmt = db.prepare(`
        SELECT * FROM document_shares 
        WHERE document_id = ? AND LOWER(shared_with_email) = ?
      `);
      const share = shareStmt.get(id, user.email.toLowerCase());
      if (!share) {
        return res.status(403).json({ message: 'You do not have permission to edit this document' });
      }
    }

    const updatedTitle = title !== undefined ? title.trim() || 'Untitled Document' : doc.title;
    const updatedContent = content !== undefined ? content : doc.content;
    const now = Date.now();

    const updateStmt = db.prepare(`
      UPDATE documents 
      SET title = ?, content = ?, updated_at = ?
      WHERE id = ?
    `);

    updateStmt.run(updatedTitle, updatedContent, now, id);

    const updatedDoc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
    res.json({ document: updatedDoc });
  } catch (err) {
    console.error('Error updating document:', err);
    res.status(500).json({ message: 'Internal server error updating document' });
  }
});

// 6. DELETE /api/documents/:id - Delete document (Owner only)
router.delete('/:id', (req, res) => {
  try {
    const user = getActiveUser(req);
    const { id } = req.params;

    const docStmt = db.prepare('SELECT * FROM documents WHERE id = ?');
    const doc = docStmt.get(id);

    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (doc.owner_email.toLowerCase() !== user.email.toLowerCase()) {
      return res.status(403).json({ message: 'Only the document owner can delete this document' });
    }

    // Cascade delete shares then document
    db.prepare('DELETE FROM document_shares WHERE document_id = ?').run(id);
    db.prepare('DELETE FROM documents WHERE id = ?').run(id);

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (err) {
    console.error('Error deleting document:', err);
    res.status(500).json({ message: 'Internal server error deleting document' });
  }
});

// 7. GET /api/documents/:id/shares - List shares for document
router.get('/:id/shares', (req, res) => {
  try {
    const user = getActiveUser(req);
    const { id } = req.params;

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const isOwner = doc.owner_email.toLowerCase() === user.email.toLowerCase();
    const isShared = db.prepare(`
      SELECT * FROM document_shares 
      WHERE document_id = ? AND LOWER(shared_with_email) = ?
    `).get(id, user.email.toLowerCase());

    if (!isOwner && !isShared) {
      return res.status(403).json({ message: 'You do not have access to share details' });
    }

    const shares = db.prepare(`
      SELECT shared_with_email as email, created_at
      FROM document_shares
      WHERE document_id = ?
      ORDER BY created_at ASC
    `).all(id);

    const enrichedShares = shares.map(s => {
      const matched = SEEDED_USERS.find(u => u.email.toLowerCase() === s.email.toLowerCase());
      return {
        email: s.email,
        name: matched ? matched.name : s.email.split('@')[0],
        role: 'Editor',
        createdAt: s.created_at,
      };
    });

    res.json({
      owner: {
        email: doc.owner_email,
        name: doc.owner_name,
        role: 'Owner',
      },
      shares: enrichedShares,
      isOwner,
    });
  } catch (err) {
    console.error('Error fetching shares:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 8. POST /api/documents/:id/shares - Grant access (Owner only)
router.post('/:id/shares', (req, res) => {
  try {
    const user = getActiveUser(req);
    const { id } = req.params;
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Valid email address is required' });
    }

    const targetEmail = email.trim().toLowerCase();

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (doc.owner_email.toLowerCase() !== user.email.toLowerCase()) {
      return res.status(403).json({ message: 'Only the document owner can grant sharing access' });
    }

    if (targetEmail === doc.owner_email.toLowerCase()) {
      return res.status(400).json({ message: 'You cannot share a document with yourself (you are the owner)' });
    }

    // Insert share
    try {
      db.prepare(`
        INSERT INTO document_shares (document_id, shared_with_email, created_at)
        VALUES (?, ?, ?)
      `).run(id, targetEmail, Date.now());
    } catch (insertErr) {
      if (insertErr.message && insertErr.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ message: `${targetEmail} already has access to this document` });
      }
      throw insertErr;
    }

    res.status(201).json({ success: true, message: `Access granted to ${targetEmail}` });
  } catch (err) {
    console.error('Error adding share:', err);
    res.status(500).json({ message: 'Internal server error sharing document' });
  }
});

// 9. DELETE /api/documents/:id/shares/:email - Revoke access (Owner only)
router.delete('/:id/shares/:email', (req, res) => {
  try {
    const user = getActiveUser(req);
    const { id, email } = req.params;
    const targetEmail = decodeURIComponent(email).trim().toLowerCase();

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (doc.owner_email.toLowerCase() !== user.email.toLowerCase()) {
      return res.status(403).json({ message: 'Only the document owner can revoke access' });
    }

    const result = db.prepare(`
      DELETE FROM document_shares 
      WHERE document_id = ? AND LOWER(shared_with_email) = ?
    `).run(id, targetEmail);

    if (result.changes === 0) {
      return res.status(404).json({ message: 'User was not shared on this document' });
    }

    res.json({ success: true, message: `Revoked access for ${targetEmail}` });
  } catch (err) {
    console.error('Error revoking share:', err);
    res.status(500).json({ message: 'Internal server error revoking share' });
  }
});

export default router;
