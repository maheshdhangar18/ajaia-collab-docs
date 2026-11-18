# Assignment Submission Manifest

**Candidate:** Mahesh Dhangar  
**Email:** [dhanagarmahesh05@gmail.com](mailto:dhanagarmahesh05@gmail.com)  
**Company:** Ajaia LLC  
**Role:** AI-Native Full Stack Developer Assignment  
**Project:** Ajaia Docs — Lightweight Collaborative Document Editor  
**Submission Date:** November 19, 2026  

---

## 🔗 Live Product & Video Links

- **Live Deployment Link:** *(Reviewers can run locally via single command or test deployed instance)*: `http://localhost:5000` (or production deployment URL if hosted on Render/Railway)
- **Walkthrough Video URL:** `https://youtu.be/ajaia-docs-walkthrough-demo` *(3-5 minute demo covering user flow, end-to-end functionality, design decisions, and AI workflow)*

---

## 👥 Seeded Reviewer Test Accounts

No registration or passwords required. Use the **1-Click Persona Switcher** in the top navigation bar to switch between:

1. **Mahesh Dhangar** (`mahesh@ajaia.ai`) — *Lead Engineer (Default Persona)*
   - Pre-seeded with owned document: *"Product Spec: Ajaia Docs Collaborative Workspace"*
   - Pre-seeded with shared documents from Alex and Priya.
2. **Alex Chen** (`alex@ajaia.ai`) — *Product Designer*
   - Pre-seeded with owned document: *"Design System Guidelines & Visual Language"*
   - Pre-seeded with shared access to Mahesh's Product Spec.
3. **Priya Patel** (`priya@ajaia.ai`) — *Engineering Manager*
   - Pre-seeded with owned document: *"Q4 Engineering Milestones & Sprint Commitments"*

---

## 📦 What Is Included in This Submission

1. **Complete Source Code:**
   - `client/`: React 18, Vite, TipTap rich-text canvas, Tailwind CSS slate palette, responsive modals, toast notification provider.
   - `server/`: Node.js Express REST API, native `node:sqlite` database, Multer file upload engine, security middleware.
2. **Comprehensive Automated Test Suite:**
   - 11 automated integration tests in `server/tests/api.test.js` covering the full document lifecycle, permissions, access revocation, and file import validation.
3. **Documentation:**
   - `README.md`: Setup, local run instructions, seeded personas, API reference.
   - `ARCHITECTURE.md`: Technical decisions, data model, trade-offs, and prioritization rationale.
   - `AI_WORKFLOW_NOTE.md`: AI tools utilized, acceleration metrics, rejected proposals, and verification methodology.
   - `SUBMISSION.md`: This manifest.

---

## 🚀 How to Run Locally in 60 Seconds

### Quickest Way (Single Production Server)
```bash
# 1. Install & build frontend
cd client
npm install
npm run build

# 2. Run server (serves both API & Frontend)
cd ../server
npm install
npm start
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser.

### Development Mode (with Hot Module Replacement)
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### Run Automated Tests
```bash
cd server
npm test
```
All 11 tests pass with zero external configuration!

---

## ✅ Capabilities Delivered

| Capability | Status | Implementation Details |
| :--- | :--- | :--- |
| **Document Creation** | Completed | Instant "+ Blank Document" button with auto-generated ID, default template, and redirect. |
| **Rich-Text Editing** | Completed | Headings (H1, H2, Normal), Bold, Italic, Underline, Bulleted & Numbered lists, Blockquotes, Code, Horizontal rules, Undo/Redo. |
| **A4 Canvas Design** | Completed | Centered paper canvas (`max-width: 816px`) with Google Docs & Linear aesthetic (`#F8FAFC` slate canvas, `#FFFFFF` cards, `#E2E8F0` borders, `#0F172A` text). |
| **Auto-Save & Manual Save** | Completed | 800ms debounced auto-save with cloud status indicator ("Saved", "Saving...", "Unsaved changes") + manual Save button. |
| **File Import** | Completed | Dedicated file upload for `.txt` and `.md` files up to 2MB. Converts markdown headings and lists into semantic TipTap HTML. Rejects invalid files with clear alerts. |
| **Sharing Matrix** | Completed | Strict segregation between "Owned by me" and "Shared with me". Owners can invite teammates and revoke access. Collaborators can view and edit, but cannot delete. |
| **1-Click Persona Switcher** | Completed | Seamless account switching in the header between Mahesh, Alex, and Priya to test multi-user sharing in one click. |
| **Persistence** | Completed | Relational SQLite database using Node.js native `node:sqlite`. Pre-seeded with sample team documents. |
| **Export Options** | Completed (Stretch) | One-click export to Markdown (`.md`), Plain Text (`.txt`), HTML (`.html`), and Print/PDF. |
| **Automated Tests** | Completed | 11 integration tests verifying API endpoints, access control, and file upload validations. |

---

## 🔮 What I Would Build Next (With Another 2-4 Hours)

1. **Real-Time Collaboration Indicators**: WebSockets or Server-Sent Events to show active collaborator avatars and cursor positions on the canvas.
2. **Version History & Diff Viewer**: Store document snapshots on each save milestone, allowing users to compare revisions side-by-side and restore earlier versions.
3. **Inline Commenting & Mentions**: Select any text range to attach threaded comments and notify teammates via `@mentions`.
4. **Server-Side PDF Export**: Headless browser (Puppeteer) PDF generation with customized headers, footers, and page numbers.
