# AI-Native Workflow Note

**Candidate:** Mahesh Dhangar ([dhanagarmahesh05@gmail.com](mailto:dhanagarmahesh05@gmail.com))  
**Assignment:** Ajaia LLC — AI-Native Full Stack Developer Assignment  
**Model & Assistant:** Antigravity AI Assistant powered by Google DeepMind (Gemini 3.8 Flash High)

---

## 1. Which AI Tools Were Used

- **Antigravity Agentic IDE Environment**: Used for project scaffolding, intelligent code generation, file manipulation, and iterative terminal test execution.
- **Gemini 3.8 Flash (High)**: Leveraged for high-reasoning code generation, edge-case analysis in SQLite foreign keys, and TipTap toolbar schema binding.

---

## 2. Where AI Materially Sped Up My Work

1. **TipTap Schema & Toolbar Boilerplate**:
   - Setting up TipTap extensions (`StarterKit`, `Underline`, heading levels, active-state detection) can require repetitive boilerplate. The AI agent generated cleanly typed React button wrappers with active status indicators in minutes.
2. **Markdown-to-HTML In-Memory Parser**:
   - The AI generated a regex-based streaming parser in `server/src/routes/documents.js` that translates markdown headings (`#`, `##`), bullet points, blockquotes, and ordered lists directly into TipTap-compatible HTML without pulling in a bulky third-party markdown compiler.
3. **Automated Test Matrix Generation**:
   - The AI generated an 11-step integration test suite using Node's native test runner and Supertest. This immediately caught port-binding issues and confirmed that unauthorized users were properly rejected when trying to delete someone else's document.
4. **Cohesive Design System Tokens**:
   - The AI accurately translated the visual design spec into Tailwind utilities (`#F8FAFC` background, `#FFFFFF` A4 canvas, `#E2E8F0` borders, `#0F172A` text, `#2563EB` primary) across every modal, card, and button.

---

## 3. What AI-Generated Output I Changed or Rejected

1. **Rejected Heavy External Database & ORM (Prisma / Supabase / Postgres)**:
   - *AI Initial Tendency:* Code assistants often default to suggesting Prisma with Docker or Postgres, which requires database connection strings, migration files, and external processes.
   - *Engineering Judgment:* For an evaluation assignment, requiring reviewers to run Docker or configure database credentials creates unnecessary friction. I directed the implementation to use Node.js's built-in `node:sqlite` (`DatabaseSync`). This provides relational integrity and persistence while guaranteeing that `npm test` and `npm start` work out-of-the-box on any machine.
2. **Rejected Bloated State Management (Redux Toolkit / Zustand)**:
   - *AI Initial Tendency:* Suggesting a complex global store for document state and user sessions.
   - *Engineering Judgment:* The scope only required active persona state and document cache. A lightweight React Context (`AuthContext`) combined with URL hash routing (`window.location.hash`) kept the frontend codebase lean, readable, and easy to audit.
3. **Corrected Test Runner Process Hanging**:
   - *Initial Issue:* Supertest initially hung during `npm test` because `server/src/index.js` immediately invoked `app.listen(PORT)`.
   - *Architectural Fix:* Decoupled `server/src/app.js` (Express configuration) from `server/src/index.js` (network listener), allowing Supertest to bind ephemeral ports and cleanly exit after all 11 tests passed.
4. **Strict Permission Enforcement**:
   - *Refinement:* Ensured that the backend does not rely solely on the frontend to hide delete buttons. Added database-level checks returning `403 Forbidden` if an active user attempts to delete a document they do not own.

---

## 4. How Correctness, UX Quality, and Reliability Were Verified

- **Automated Integration Testing**:
  - Ran 11 automated test cases verifying CRUD operations, share invitations, collaborator listings, permission denial on unauthorized deletion, and file upload validation. All 11 tests passed in under 500ms.
- **Production Build Verification**:
  - Ran `npm run build` with Vite to ensure zero build errors, zero broken imports, and that all CSS classes and TipTap modules bundled cleanly into production assets.
- **UX & Edge Case Verification**:
  - Tested 1-click account switching between Mahesh Dhangar, Alex Chen, and Priya Patel.
  - Verified that documents created by Mahesh appear in "Owned by me" for Mahesh, and in "Shared with me" for Alex after being shared.
  - Verified that invalid file uploads (e.g., non-txt/md or >2MB files) display informative toast alerts.
  - Verified that deleting a document prompts a confirmation modal to prevent accidental data loss.
