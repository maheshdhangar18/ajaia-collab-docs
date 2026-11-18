import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path in server/data/ajaia_docs.db
const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.join(dataDir, 'ajaia_docs.db');
export const db = new DatabaseSync(dbPath);

// Initialize schema
export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      owner_email TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS document_shares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id TEXT NOT NULL,
      shared_with_email TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(document_id, shared_with_email),
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );
  `);

  // Seed sample docs if empty
  const countRow = db.prepare('SELECT COUNT(*) as count FROM documents').get();
  if (countRow.count === 0) {
    seedDatabase();
  }
}

function seedDatabase() {
  const now = Date.now();
  const insertDoc = db.prepare(`
    INSERT INTO documents (id, title, content, owner_email, owner_name, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertShare = db.prepare(`
    INSERT INTO document_shares (document_id, shared_with_email, created_at)
    VALUES (?, ?, ?)
  `);

  // 1. Doc owned by Mahesh Dhangar
  const doc1Id = 'doc-prod-spec-01';
  insertDoc.run(
    doc1Id,
    'Product Spec: Ajaia Docs Collaborative Workspace',
    `<h1>Product Spec: Ajaia Docs Collaborative Workspace</h1>
<p><strong>Author:</strong> Mahesh Dhangar (Lead Engineer)</p>
<p><strong>Status:</strong> Active Draft</p>
<hr>
<h2>1. Problem Overview</h2>
<p>Modern remote teams require lightweight, distraction-free document workspaces with seamless permission sharing and effortless file handling.</p>
<h2>2. Core Functional Pillars</h2>
<ul>
  <li><strong>Instant Document Creation:</strong> Zero-friction blank drafts and one-click format imports.</li>
  <li><strong>Distraction-Free Rich Text:</strong> Clean typography inspired by Google Docs and Linear.</li>
  <li><strong>Reliable Sharing Matrix:</strong> Clear separation between owned drafts and team shares.</li>
</ul>
<h2>3. Upcoming Milestones</h2>
<ol>
  <li>Finalize TipTap rich-text canvas and A4 centered layout.</li>
  <li>Deploy backend SQLite persistence with instant auto-save.</li>
  <li>Verify end-to-end import flow for .txt and .md files.</li>
</ol>`,
    'mahesh@ajaia.ai',
    'Mahesh Dhangar',
    now - 3600000 * 5,
    now - 3600000 * 2
  );
  insertShare.run(doc1Id, 'alex@ajaia.ai', now - 3600000 * 4);
  insertShare.run(doc1Id, 'priya@ajaia.ai', now - 3600000 * 3);

  // 2. Doc owned by Alex Chen, shared with Mahesh
  const doc2Id = 'doc-design-sys-02';
  insertDoc.run(
    doc2Id,
    'Design System Guidelines & Visual Language',
    `<h1>Design System Guidelines &amp; Visual Language</h1>
<p><strong>Owner:</strong> Alex Chen (Product Designer)</p>
<p>Welcome to our unified aesthetic standard for Ajaia internal tools.</p>
<h2>Color Palette &amp; Surfaces</h2>
<ul>
  <li><strong>Canvas Background:</strong> <code>#F8FAFC</code> (Slate 50)</li>
  <li><strong>Paper / Cards:</strong> <code>#FFFFFF</code> (Clean white)</li>
  <li><strong>Borders:</strong> <code>#E2E8F0</code> (Subtle Slate 200)</li>
  <li><strong>Typography:</strong> <code>#0F172A</code> (Deep Slate 900)</li>
  <li><strong>Primary Accent:</strong> <code>#2563EB</code> (Subtle Royal Blue)</li>
</ul>
<blockquote>"Simplicity is the prerequisite for reliability." — Edsger W. Dijkstra</blockquote>`,
    'alex@ajaia.ai',
    'Alex Chen',
    now - 3600000 * 24,
    now - 3600000 * 12
  );
  insertShare.run(doc2Id, 'mahesh@ajaia.ai', now - 3600000 * 10);

  // 3. Doc owned by Priya Patel, shared with Mahesh
  const doc3Id = 'doc-q4-roadmap-03';
  insertDoc.run(
    doc3Id,
    'Q4 Engineering Milestones & Sprint Commitments',
    `<h1>Q4 Engineering Milestones &amp; Sprint Commitments</h1>
<p><strong>Manager:</strong> Priya Patel</p>
<h2>Key Priorities</h2>
<ol>
  <li>Ship the lightweight document editor prototype to internal beta.</li>
  <li>Verify end-to-end multi-tenant sharing with seeded personas.</li>
  <li>Conduct performance benchmarks on auto-save latency and file imports.</li>
</ol>`,
    'priya@ajaia.ai',
    'Priya Patel',
    now - 3600000 * 48,
    now - 3600000 * 20
  );
  insertShare.run(doc3Id, 'mahesh@ajaia.ai', now - 3600000 * 18);
}
