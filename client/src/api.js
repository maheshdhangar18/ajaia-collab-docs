const API_BASE = '/api';

/**
 * Helper to build headers with active user email
 */
function getHeaders(userEmail, extra = {}) {
  const headers = { ...extra };
  if (userEmail) {
    headers['x-user-email'] = userEmail;
  }
  return headers;
}

export async function fetchDocuments(userEmail) {
  const res = await fetch(`${API_BASE}/documents`, {
    headers: getHeaders(userEmail),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch documents');
  }
  return res.json();
}

export async function fetchDocument(id, userEmail) {
  const res = await fetch(`${API_BASE}/documents/${id}`, {
    headers: getHeaders(userEmail),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch document');
  }
  return res.json();
}

export async function createDocument({ title = 'Untitled Document', content = '' }, userEmail) {
  const res = await fetch(`${API_BASE}/documents`, {
    method: 'POST',
    headers: getHeaders(userEmail, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ title, content }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create document');
  }
  return res.json();
}

export async function updateDocument(id, { title, content }, userEmail) {
  const res = await fetch(`${API_BASE}/documents/${id}`, {
    method: 'PUT',
    headers: getHeaders(userEmail, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ title, content }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to update document');
  }
  return res.json();
}

export async function deleteDocument(id, userEmail) {
  const res = await fetch(`${API_BASE}/documents/${id}`, {
    method: 'DELETE',
    headers: getHeaders(userEmail),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to delete document');
  }
  return res.json();
}

export async function importDocument(file, userEmail) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/documents/import`, {
    method: 'POST',
    headers: getHeaders(userEmail), // Content-Type is set automatically by fetch for FormData
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to import document');
  }
  return res.json();
}

export async function fetchDocumentShares(id, userEmail) {
  const res = await fetch(`${API_BASE}/documents/${id}/shares`, {
    headers: getHeaders(userEmail),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch shares');
  }
  return res.json();
}

export async function shareDocument(id, email, userEmail) {
  const res = await fetch(`${API_BASE}/documents/${id}/shares`, {
    method: 'POST',
    headers: getHeaders(userEmail, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to share document');
  }
  return res.json();
}

export async function revokeShare(id, email, userEmail) {
  const res = await fetch(`${API_BASE}/documents/${id}/shares/${encodeURIComponent(email)}`, {
    method: 'DELETE',
    headers: getHeaders(userEmail),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to revoke access');
  }
  return res.json();
}
