import { apiFetch } from './http';

export async function getProjects() {
  const data = await apiFetch('/projects');
  return data.data;
}

export async function createProject(project) {
  return apiFetch('/projects', { method: 'POST', body: JSON.stringify(project) });
}

export async function updateProject(id, project) {
  return apiFetch(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(project) });
}

export async function deleteProject(id) {
  return apiFetch(`/projects/${id}`, { method: 'DELETE' });
}

export async function getProjectBoard(id) {
  const data = await apiFetch(`/projects/${id}/board`);
  return data.data;
}

export async function createStage(projectId, name) {
  return apiFetch(`/projects/${projectId}/stages`, { method: 'POST', body: JSON.stringify({ name }) });
}

export async function updateStage(stageId, name) {
  return apiFetch(`/projects/stages/${stageId}`, { method: 'PUT', body: JSON.stringify({ name }) });
}

export async function deleteStage(stageId) {
  return apiFetch(`/projects/stages/${stageId}`, { method: 'DELETE' });
}

export async function toggleFoldStage(stageId, fold) {
  return apiFetch(`/projects/stages/${stageId}/fold`, { method: 'POST', body: JSON.stringify({ fold }) });
}

export async function archiveStageTasks(stageId, active) {
  return apiFetch(`/projects/stages/${stageId}/archive-tasks`, { method: 'POST', body: JSON.stringify({ active }) });
}

export async function createTask(task) {
  return apiFetch('/projects/tasks', { method: 'POST', body: JSON.stringify(task) });
}

export async function getTaskDetail(taskId) {
  const data = await apiFetch(`/projects/tasks/${taskId}`);
  return data.data;
}

export async function updateTask(taskId, task) {
  return apiFetch(`/projects/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(task) });
}

export async function deleteTask(taskId) {
  return apiFetch(`/projects/tasks/${taskId}`, { method: 'DELETE' });
}

export async function toggleTaskPriority(taskId) {
  return apiFetch(`/projects/tasks/${taskId}/toggle-priority`, { method: 'POST' });
}

export async function duplicateTask(taskId) {
  return apiFetch(`/projects/tasks/${taskId}/duplicate`, { method: 'POST' });
}

export async function getTaskMessages(taskId) {
  const data = await apiFetch(`/projects/tasks/${taskId}/messages`);
  return data.data;
}

export async function postTaskMessage(taskId, body) {
  return apiFetch(`/projects/tasks/${taskId}/messages`, { method: 'POST', body: JSON.stringify({ body }) });
}