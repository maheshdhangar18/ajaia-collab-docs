import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

test('Ajaia Docs API Suite', async (t) => {
  await t.test('GET /api/health should return ok status', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });

  await t.test('GET /api/users should return seeded team members', async () => {
    const res = await request(app).get('/api/users');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.users));
    assert.ok(res.body.users.some(u => u.email === 'mahesh@ajaia.ai'));
    assert.ok(res.body.users.some(u => u.email === 'alex@ajaia.ai'));
    assert.ok(res.body.users.some(u => u.email === 'priya@ajaia.ai'));
  });

  let createdDocId = null;

  await t.test('POST /api/documents should create a new document for active user', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('x-user-email', 'mahesh@ajaia.ai')
      .send({
        title: 'Sprint Retrospective & Learnings',
        content: '<p>Initial thoughts on velocity and blockers.</p>',
      });

    assert.equal(res.status, 201);
    assert.ok(res.body.document);
    assert.equal(res.body.document.title, 'Sprint Retrospective & Learnings');
    assert.equal(res.body.document.owner_email, 'mahesh@ajaia.ai');
    createdDocId = res.body.document.id;
  });

  await t.test('GET /api/documents should return owned and shared sections', async () => {
    const res = await request(app)
      .get('/api/documents')
      .set('x-user-email', 'mahesh@ajaia.ai');

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.owned));
    assert.ok(Array.isArray(res.body.shared));
    assert.ok(res.body.owned.some(d => d.id === createdDocId));
  });

  await t.test('PUT /api/documents/:id should allow owner to update title and content', async () => {
    const res = await request(app)
      .put(`/api/documents/${createdDocId}`)
      .set('x-user-email', 'mahesh@ajaia.ai')
      .send({
        title: 'Sprint Retrospective (Updated Title)',
        content: '<p>Updated content with action items.</p>',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.document.title, 'Sprint Retrospective (Updated Title)');
  });

  await t.test('POST /api/documents/:id/shares should allow owner to share with teammate', async () => {
    const res = await request(app)
      .post(`/api/documents/${createdDocId}/shares`)
      .set('x-user-email', 'mahesh@ajaia.ai')
      .send({ email: 'alex@ajaia.ai' });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
  });

  await t.test('GET /api/documents should now show the document in Alex\'s shared list', async () => {
    const res = await request(app)
      .get('/api/documents')
      .set('x-user-email', 'alex@ajaia.ai');

    assert.equal(res.status, 200);
    assert.ok(res.body.shared.some(d => d.id === createdDocId));
  });

  await t.test('DELETE /api/documents/:id should reject deletion by non-owner', async () => {
    const res = await request(app)
      .delete(`/api/documents/${createdDocId}`)
      .set('x-user-email', 'alex@ajaia.ai'); // Alex is only collaborator

    assert.equal(res.status, 403);
    assert.match(res.body.message, /only the document owner/i);
  });

  await t.test('POST /api/documents/import should accept valid .txt or .md and reject unsupported files', async () => {
    // 1. Rejected extension (.pdf)
    const badRes = await request(app)
      .post('/api/documents/import')
      .set('x-user-email', 'mahesh@ajaia.ai')
      .attach('file', Buffer.from('dummy content'), 'test.pdf');

    assert.equal(badRes.status, 400);
    assert.match(badRes.body.message, /only \.txt and \.md/i);

    // 2. Successful markdown import
    const mdContent = '# Technical Architecture\n- Scalable backend\n- Instant sync';
    const goodRes = await request(app)
      .post('/api/documents/import')
      .set('x-user-email', 'mahesh@ajaia.ai')
      .attach('file', Buffer.from(mdContent), 'architecture-notes.md');

    assert.equal(goodRes.status, 201);
    assert.ok(goodRes.body.document);
    assert.equal(goodRes.body.document.title, 'Architecture Notes');
    assert.ok(goodRes.body.document.content.includes('Technical Architecture'));
  });

  await t.test('DELETE /api/documents/:id should allow owner to delete document', async () => {
    const res = await request(app)
      .delete(`/api/documents/${createdDocId}`)
      .set('x-user-email', 'mahesh@ajaia.ai');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    // Verify it is gone
    const getRes = await request(app)
      .get(`/api/documents/${createdDocId}`)
      .set('x-user-email', 'mahesh@ajaia.ai');
    assert.equal(getRes.status, 404);
  });
});
