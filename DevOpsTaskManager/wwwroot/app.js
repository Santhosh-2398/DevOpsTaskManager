const list = document.getElementById('tasks');
const message = document.getElementById('message');

async function api(path, options = {}) {
  const response = await fetch(path, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Request failed (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
}

async function loadTasks() {
  const tasks = await api('/api/tasks');
  list.replaceChildren();
  document.getElementById('total').textContent = tasks.length;
  document.getElementById('completed').textContent = tasks.filter(t => t.isCompleted).length;
  document.getElementById('pending').textContent = tasks.filter(t => !t.isCompleted).length;
  document.getElementById('count-label').textContent = `${tasks.length} task${tasks.length === 1 ? '' : 's'}`;
  document.getElementById('empty').hidden = tasks.length > 0;

  tasks.forEach(task => {
    const li = document.createElement('li');
    if (task.isCompleted) li.classList.add('done');
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = task.isCompleted;
    check.setAttribute('aria-label', `Toggle ${task.title}`);
    check.addEventListener('change', () => act(`/api/tasks/${task.id}/toggle`, 'PUT'));
    const label = document.createElement('label');
    label.textContent = task.title;
    const remove = document.createElement('button');
    remove.textContent = 'Delete';
    remove.setAttribute('aria-label', `Delete ${task.title}`);
    remove.addEventListener('click', () => act(`/api/tasks/${task.id}`, 'DELETE'));
    li.append(check, label, remove);
    list.append(li);
  });
}

async function act(path, method, body) {
  try {
    message.textContent = '';
    await api(path, { method, headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
    await loadTasks();
  } catch (error) { message.textContent = error.message; }
}

document.getElementById('task-form').addEventListener('submit', async event => {
  event.preventDefault();
  const field = document.getElementById('title');
  const title = field.value.trim();
  if (!title) return;
  await act('/api/tasks', 'POST', { title });
  if (!message.textContent) field.value = '';
});

loadTasks().catch(error => { message.textContent = error.message; });
