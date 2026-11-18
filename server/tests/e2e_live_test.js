import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:5000';

test('E2E Live Server Verification on http://localhost:5000', async (t) => {
  // 1. Static frontend HTML delivery
  await t.test('1. Root / should serve Vite production HTML bundle', async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('<title>Ajaia Docs - Collaborative Document Editor</title>'), 'HTML title missing');
    assert.ok(html.includes('id="root"'), 'Root div missing');
    assert.ok(html.includes('/assets/index-'), 'Asset script tag missing');
  });

  // 2. Health Check
  await t.test('2. GET /api/health returns ok status', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'ok');
    assert.equal(data.service, 'Ajaia Docs API');
  });

  // 3. User Personas
  await t.test('3. GET /api/users returns all 3 seeded accounts', async () => {
    const res = await fetch(`${BASE_URL}/api/users`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.users.length, 3);
    const emails = data.users.map(u => u.email);
    assert.ok(emails.includes('mahesh@ajaia.ai'));
    assert.ok(emails.includes('alex@ajaia.ai'));
    assert.ok(emails.includes('priya@ajaia.ai'));
  });

  // 4. Document segregation for Mahesh (Owner)
  let maheshDocId = null;
  await t.test('4. GET /api/documents for Mahesh Dhangar shows owned & shared docs', async () => {
    const res = await fetch(`${BASE_URL}/api/documents`, {
      headers: { 'x-user-email': 'mahesh@ajaia.ai' },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.owned));
    assert.ok(Array.isArray(data.shared));
    assert.ok(data.owned.length > 0, 'Mahesh should own at least 1 document');
    assert.ok(data.shared.length > 0, 'Mahesh should have shared documents from teammates');
    maheshDocId = data.owned[0].id;
  });

  // 5. Document segregation for Alex Chen
  await t.test('5. GET /api/documents for Alex Chen shows different owned & shared docs', async () => {
    const res = await fetch(`${BASE_URL}/api/documents`, {
      headers: { 'x-user-email': 'alex@ajaia.ai' },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.owned.some(d => d.owner_email === 'alex@ajaia.ai'), 'Alex should own their docs');
    assert.ok(data.shared.some(d => d.id === 'doc-prod-spec-01'), 'Alex should see Mahesh Product Spec in shared section');
  });

  // 6. Create new blank document
  let newDocId = null;
  await t.test('6. POST /api/documents creates a new draft for active user', async () => {
    const res = await fetch(`${BASE_URL}/api/documents`, {
      method: 'POST',
      headers: {
        'x-user-email': 'mahesh@ajaia.ai',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Q1 Vision & Architecture Blueprint',
        content: '<h1>Q1 Vision</h1><p>Our goal is to build the fastest collaborative editor.</p>',
      }),
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.document.title, 'Q1 Vision & Architecture Blueprint');
    assert.equal(data.document.owner_email, 'mahesh@ajaia.ai');
    newDocId = data.document.id;
  });

  // 7. Auto-save & Update document
  await t.test('7. PUT /api/documents/:id updates title and rich-text content', async () => {
    const res = await fetch(`${BASE_URL}/api/documents/${newDocId}`, {
      method: 'PUT',
      headers: {
        'x-user-email': 'mahesh@ajaia.ai',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Q1 Vision & Architecture Blueprint (Final)',
        content: '<h1>Q1 Vision</h1><p>Our goal is to build the fastest collaborative editor.</p><ul><li>Zero-latency auto-save</li><li>Clean slate UI</li></ul>',
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.document.title, 'Q1 Vision & Architecture Blueprint (Final)');
    assert.ok(data.document.content.includes('Zero-latency auto-save'));
  });

  // 8. Permission Check: Alex cannot read before being shared
  await t.test('8. GET /api/documents/:id rejects unshared collaborator with 403', async () => {
    const res = await fetch(`${BASE_URL}/api/documents/${newDocId}`, {
      headers: { 'x-user-email': 'alex@ajaia.ai' },
    });
    assert.equal(res.status, 403);
    const data = await res.json();
    assert.match(data.message, /do not have access/i);
  });

  // 9. Grant sharing access
  await t.test('9. POST /api/documents/:id/shares grants access to Alex', async () => {
    const res = await fetch(`${BASE_URL}/api/documents/${newDocId}/shares`, {
      method: 'POST',
      headers: {
        'x-user-email': 'mahesh@ajaia.ai',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'alex@ajaia.ai' }),
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
  });

  // 10. Verify Alex now has access
  await t.test('10. GET /api/documents/:id allows Alex access after sharing', async () => {
    const res = await fetch(`${BASE_URL}/api/documents/${newDocId}`, {
      headers: { 'x-user-email': 'alex@ajaia.ai' },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.document.id, newDocId);
    assert.equal(data.isOwner, false);
  });

  // 11. Security: Collaborator CANNOT delete document
  await t.test('11. DELETE /api/documents/:id blocks collaborator deletion with 403 Forbidden', async () => {
    const res = await fetch(`${BASE_URL}/api/documents/${newDocId}`, {
      method: 'DELETE',
      headers: { 'x-user-email': 'alex@ajaia.ai' },
    });
    assert.equal(res.status, 403);
    const data = await res.json();
    assert.match(data.message, /only the document owner/i);
  });

  // 12. File upload & Import engine: .md import
  let importedDocId = null;
  await t.test('12. POST /api/documents/import parses .md file into rich-text HTML', async () => {
    const mdContent = '# High-Scale System Design\n\n## Core Principles\n- Keep it simple\n- Avoid premature optimization\n\n> "Good code is its own best documentation."\n\n1. Measure first\n2. Iterate rapidly';
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    
    let body = `--${boundary}\r\n`;
    body += 'Content-Disposition: form-data; name="file"; filename="system-design-notes.md"\r\n';
    body += 'Content-Type: text/markdown\r\n\r\n';
    body += mdContent + '\r\n';
    body += `--${boundary}--\r\n`;

    const res = await fetch(`${BASE_URL}/api/documents/import`, {
      method: 'POST',
      headers: {
        'x-user-email': 'mahesh@ajaia.ai',
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: Buffer.from(body),
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data.document);
    assert.equal(data.document.title, 'System Design Notes');
    assert.ok(data.document.content.includes('<h1>High-Scale System Design</h1>'));
    assert.ok(data.document.content.includes('<h2>Core Principles</h2>'));
    assert.ok(data.document.content.includes('<li>Keep it simple</li>'));
    assert.ok(data.document.content.includes('<blockquote>'));
    importedDocId = data.document.id;
  });

  // 13. File upload validation: reject unsupported file
  await t.test('13. POST /api/documents/import rejects invalid file format (.pdf)', async () => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    let body = `--${boundary}\r\n`;
    body += 'Content-Disposition: form-data; name="file"; filename="document.pdf"\r\n';
    body += 'Content-Type: application/pdf\r\n\r\n';
    body += 'fake pdf content\r\n';
    body += `--${boundary}--\r\n`;

    const res = await fetch(`${BASE_URL}/api/documents/import`, {
      method: 'POST',
      headers: {
        'x-user-email': 'mahesh@ajaia.ai',
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: Buffer.from(body),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.message, /only \.txt and \.md files are supported/i);
  });

  // 14. Owner deletes document successfully
  await t.test('14. DELETE /api/documents/:id allows owner to delete', async () => {
    const res = await fetch(`${BASE_URL}/api/documents/${newDocId}`, {
      method: 'DELETE',
      headers: { 'x-user-email': 'mahesh@ajaia.ai' },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);

    // Verify it is gone
    const checkRes = await fetch(`${BASE_URL}/api/documents/${newDocId}`, {
      headers: { 'x-user-email': 'mahesh@ajaia.ai' },
    });
    assert.equal(checkRes.status, 404);
  });

  // 15. Cleanup imported doc
  await t.test('15. Cleanup imported doc', async () => {
    if (importedDocId) {
      await fetch(`${BASE_URL}/api/documents/${importedDocId}`, {
        method: 'DELETE',
        headers: { 'x-user-email': 'mahesh@ajaia.ai' },
      });
    }
  });
});
