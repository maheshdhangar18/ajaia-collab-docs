# Ajaia Docs — Lightweight Collaborative Document Editor

> **Ajaia LLC — AI-Native Full Stack Developer Assignment**  
> **Candidate:** Mahesh Dhangar ([dhanagarmahesh05@gmail.com](mailto:dhanagarmahesh05@gmail.com))

A crisp, distraction-free collaborative document workspace inspired by Google Docs and Linear. Built with clean white/slate surfaces (`#F8FAFC` slate canvas, `#FFFFFF` A4 paper cards, subtle `#E2E8F0` borders, crisp `#0F172A` typography, and `#2563EB` primary accents).

---

## ⚡ Core Capabilities

1. **Distraction-Free Rich-Text Editor**
   - Headings (H1, H2, Normal Text)
   - Formatting: Bold, Italic, Underline, Code, Blockquote
   - Lists: Bulleted and Numbered lists, Horizontal dividers, Undo/Redo
   - Centered A4-style paper canvas (`max-width: 816px`) with comfortable typography and line height.
   - Real-time word count & character count.
   - Debounced auto-save (800ms) with cloud sync indicator + explicit manual Save button.
   - One-click exports: Markdown (`.md`), Plain Text (`.txt`), HTML (`.html`), and Print/PDF.

2. **File Upload & Import Engine**
   - One-click import for `.txt` and `.md` files up to 2MB.
   - Intelligent parser converts headings, lists, quotes, and paragraphs into formatted editable TipTap documents.
   - Inline feedback and error handling for oversized or unsupported file types.

3. **Multi-User Sharing & Access Control Matrix**
   - Strict distinction between **"Owned by me"** and **"Shared with me"** documents.
   - Document owner can invite teammates, view active collaborator list, or revoke access.
   - Non-owners see clear "Shared by [Owner Name]" badges and cannot delete documents owned by others.
   - **Lightweight 1-Click Persona Switcher:** Switch between Mahesh Dhangar, Alex Chen, and Priya Patel directly from the top navigation bar to test sharing flows instantly without logging in and out.

4. **Zero-Configuration Persistence**
   - SQLite persistence powered by Node.js native `node:sqlite` (`DatabaseSync`).
   - Zero external databases or Docker containers required for reviewers.
   - Pre-seeded with realistic team documents on first launch.

---

## 👥 Seeded Reviewer Test Accounts

Switch between these accounts via the top-right account switcher in the app header:

| Name | Email | Role | Default Seeded State |
| :--- | :--- | :--- | :--- |
| **Mahesh Dhangar** *(Default)* | `mahesh@ajaia.ai` | Lead Engineer | Owns Product Spec; Collaborates on Design System & Roadmap |
| **Alex Chen** | `alex@ajaia.ai` | Product Designer | Owns Design System; Collaborator on Product Spec |
| **Priya Patel** | `priya@ajaia.ai` | Engineering Manager | Owns Q4 Roadmap; Collaborator on Product Spec |

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- Node.js v20+ or v24+
- npm v10+

### Option A: Run Backend & Frontend in Development Mode

```bash
# 1. Install & start backend (runs on http://localhost:5000)
cd server
npm install
npm run dev

# 2. In a second terminal, install & start frontend (runs on http://localhost:5173)
cd client
npm install
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser. Vite automatically proxies `/api` requests to the backend server at port 5000.

---

### Option B: Single-Server Production Mode

The backend can serve the compiled Vite static build directly from `client/dist`:

```bash
# 1. Build frontend bundle
cd client
npm install
npm run build

# 2. Start server
cd ../server
npm install
npm start
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser. The entire application runs from a single unified server!

---

## 🧪 Automated Testing

A comprehensive suite of 11 integration tests verifies API endpoints, access control permissions, document creation, updates, unauthorized deletion prevention, and file upload validations:

```bash
cd server
npm test
```

### Test Coverage Highlights:
- `GET /api/health`: Verifies server uptime and health.
- `GET /api/users`: Verifies seeded team members.
- `POST /api/documents`: Verifies document creation for active persona.
- `GET /api/documents`: Verifies segregation of "Owned" vs "Shared" workspaces.
- `PUT /api/documents/:id`: Verifies document title & rich-text content persistence.
- `POST /api/documents/:id/shares`: Verifies granting access to another user.
- `DELETE /api/documents/:id` (403): Verifies non-owners cannot delete documents.
- `POST /api/documents/import`: Verifies .txt / .md import parsing & rejection of invalid file types.
- `DELETE /api/documents/:id`: Verifies owner deletion and cascade cleanup.

---

## 📁 Repository Structure

```
.
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx   # Document dashboard ("Owned" & "Shared" sections)
│   │   │   ├── Editor.jsx      # TipTap A4 document editor view
│   │   │   ├── Header.jsx      # App logo & 1-click persona switcher
│   │   │   ├── ShareModal.jsx  # Teammate sharing dialog & revoke access
│   │   │   ├── DeleteModal.jsx # Confirmation dialog for safe deletion
│   │   │   ├── Toolbar.jsx     # TipTap formatting toolbar
│   │   │   └── Toast.jsx       # Non-intrusive alert notification provider
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Active user state & persona switcher
│   │   ├── constants/
│   │   │   └── users.js        # Seeded user personas
│   │   ├── api.js              # Relative /api client wrapper
│   │   ├── index.css           # Tailwind CSS & TipTap typography
│   │   ├── App.jsx             # Main routing & state coordinator
│   │   └── main.jsx
│   ├── tailwind.config.js      # Linear/Docs slate palette configuration
│   └── vite.config.js          # Vite config with /api proxy to localhost:5000
│
├── server/                     # Node.js + Express backend
│   ├── src/
│   │   ├── db.js               # Native SQLite database schema & seed data
│   │   ├── app.js              # Express app configuration & static serving
│   │   ├── index.js            # Server entrypoint listening on port 5000
│   │   └── routes/
│   │       ├── documents.js    # CRUD, upload import, and sharing logic
│   │       └── users.js        # Seeded user personas endpoint
│   ├── tests/
│   │   └── api.test.js         # Automated integration test suite
│   └── package.json
│
├── ARCHITECTURE.md             # Architecture note & tradeoffs
├── AI_WORKFLOW_NOTE.md         # AI acceleration & judgment note
└── SUBMISSION.md               # Assignment deliverables manifest
```

---

## 🛡️ License
Built for Ajaia LLC by Mahesh Dhangar.
