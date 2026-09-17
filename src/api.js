const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!response.ok) {
    throw new Error(`API request failed (${response.status})`)
  }
  return response.json()
}

export const getProjects = () => request('/api/projects')
export const getActivities = () => request('/api/activities')
export const getLibrary = () => request('/api/library')
export const getPrompts = () => request('/api/prompts')
export const createPrompt = (body) => request('/api/prompts', {
  method: 'POST',
  body: JSON.stringify({ body }),
})
export const createProject = (payload) => request('/api/projects', {
  method: 'POST',
  body: JSON.stringify(payload),
})
export const updateProject = (id, progress) => request(`/api/projects/${id}`, {
  method: 'PATCH',
  body: JSON.stringify({ progress }),
})
