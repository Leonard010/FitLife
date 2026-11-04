export async function api(path, { signal, method = 'GET', body } = {}) {
  const response = await fetch(`/api${path}`, {
    method, signal, credentials: 'include',
    ...(body !== undefined ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
  });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    const error = new Error(data?.message || 'Não foi possível concluir a ação.');
    error.status = response.status;
    throw error;
  }
  return data;
}
