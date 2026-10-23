export async function api(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('cv_token');
  const res = await fetch('/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: 'Bearer ' + token }) },
    body: body && JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/auth/login')) { localStorage.removeItem('cv_token'); location.reload(); }
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}
