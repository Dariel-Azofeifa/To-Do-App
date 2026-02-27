// ================================
// CONFIGURACIÓN
// ================================
const API_URL = 'http://localhost:3000/api/tasks';

let currentSection = 'daily';
let tasks = {
    daily: [],
    important: [],
    forMyUser: [],
    tasks: []
};

const sectionNames = {
    daily:      'Daily',
    important:  'Important',
    forMyUser:  'For my User',
    tasks:      'Tasks'
};

// ================================
// AUTH - TOKEN Y SESIÓN
// ================================
function getToken() {
    return localStorage.getItem('token');
}

function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Headers con token para cada petición
function authHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    };
}

// Manejo centralizado de respuestas — detecta token expirado
async function handleResponse(res) {
    const data = await res.json();

    if (res.status === 401) {
        // Token expirado o inválido → cerrar sesión
        showToast(data.expired
            ? 'Tu sesión expiró. Inicia sesión nuevamente.'
            : 'Sesión inválida.', 'error'
        );
        setTimeout(logout, 1500);
        throw new Error('Unauthorized');
    }

    if (!res.ok) {
        const msg = data.errors
            ? data.errors.map(e => e.msg).join(', ')
            : data.error || 'Error desconocido.';
        throw new Error(msg);
    }

    return data;
}

// ================================
// TOAST - NOTIFICACIONES
// ================================
function showToast(message, type = 'error') {
    // Elimina toast anterior si existe
    document.querySelector('.toast')?.remove();

    const toast = document.createElement('div');
    toast.classList.add('toast', type);
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('visible'));

    setTimeout(() => {
        toast.classList.remove('visible');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, 3500);
}

// ================================
// API
// ================================
async function fetchTasks() {
    try {
        const res = await fetch(API_URL, { headers: authHeaders() });
        tasks = await handleResponse(res);
    } catch (error) {
        if (error.message !== 'Unauthorized') {
            showToast('No se pudieron cargar las tareas.');
        }
    }
}

async function apiCreateTask(name, section) {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ name, section })
    });
    return handleResponse(res);
}

async function apiUpdateTask(id, fields) {
    const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(fields)
    });
    return handleResponse(res);
}

async function apiDeleteTask(id) {
    const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
    });
    return handleResponse(res);
}

async function apiDeleteChecked(section) {
    const res = await fetch(`${API_URL}/checked`, {
        method: 'DELETE',
        headers: authHeaders(),
        body: JSON.stringify({ section })
    });
    return handleResponse(res);
}

// ================================
// RENDERIZAR TAREAS
// ================================
function renderTasks() {
    const main = document.querySelector('.Main');
    main.innerHTML = '';

    const currentTasks = tasks[currentSection] || [];

    if (currentTasks.length === 0) {
        const empty = document.createElement('p');
        empty.textContent = 'No hay tareas en esta sección.';
        empty.style.color = '#999';
        empty.style.fontStyle = 'italic';
        main.appendChild(empty);
        return;
    }

    currentTasks.forEach((task) => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `task-${task.id}`;
        checkbox.checked = task.checked;

        checkbox.addEventListener('change', async () => {
            task.checked = checkbox.checked;
            try {
                await apiUpdateTask(task.id, { checked: task.checked });
            } catch (error) {
                showToast(error.message);
                task.checked = !task.checked; // revertir si falla
            }
            renderTasks();
        });

        const label = document.createElement('label');
        label.htmlFor = `task-${task.id}`;
        label.textContent = task.name;

        main.appendChild(checkbox);
        main.appendChild(label);
    });
}

// ================================
// MODAL - NUEVA TAREA
// ================================
function openNewTaskModal() {
    const overlay = document.createElement('div');
    overlay.classList.add('modal-overlay');

    overlay.innerHTML = `
        <div class="modal">
            <h2>Nueva tarea</h2>
            <input type="text" id="task-input" placeholder="Nombre de la tarea..." maxlength="80" />
            <span class="modal-field-error" id="modal-task-error"></span>
            <div class="modal-buttons">
                <button class="btn-cancel">Cancelar</button>
                <button class="btn-add">Agregar</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('active'));

    const input = overlay.querySelector('#task-input');
    input.focus();

    const close = () => {
        overlay.classList.remove('active');
        overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
    };

    const addTask = async () => {
        const name = input.value.trim();
        if (!name) {
            input.style.borderColor = '#e74c3c';
            overlay.querySelector('#modal-task-error').textContent = 'El nombre no puede estar vacío.';
            input.focus();
            return;
        }

        overlay.querySelector('.btn-add').disabled = true;
        overlay.querySelector('.btn-add').textContent = 'Agregando...';

        try {
            const newTask = await apiCreateTask(name, currentSection);
            tasks[currentSection].push(newTask);
            renderTasks();
            close();
            showToast('Tarea agregada.', 'success');
        } catch (error) {
            if (error.message !== 'Unauthorized') {
                overlay.querySelector('#modal-task-error').textContent = error.message;
                overlay.querySelector('.btn-add').disabled = false;
                overlay.querySelector('.btn-add').textContent = 'Agregar';
            }
        }
    };

    overlay.querySelector('.btn-cancel').addEventListener('click', close);
    overlay.querySelector('.btn-add').addEventListener('click', addTask);

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addTask();
        if (e.key === 'Escape') close();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });
}

// ================================
// MODAL - CONFIG TASK
// ================================
function openConfigModal(task) {
    const overlay = document.createElement('div');
    overlay.classList.add('modal-overlay');

    overlay.innerHTML = `
        <div class="modal">
            <h2>Configurar tarea</h2>
            <p style="color: #666; font-size: 14px;">"${task.name}"</p>
            <div class="config-modal-options">
                <button class="config-option" id="opt-rename">✏️ Renombrar tarea</button>
                <button class="config-option" id="opt-move">📁 Cambiar categoría</button>
            </div>
            <div class="modal-buttons">
                <button class="btn-cancel">Cancelar</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('active'));

    const close = () => {
        overlay.classList.remove('active');
        overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
    };

    overlay.querySelector('.btn-cancel').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    overlay.querySelector('#opt-rename').addEventListener('click', () => {
        close();
        openRenameModal(task);
    });

    overlay.querySelector('#opt-move').addEventListener('click', () => {
        close();
        openMoveCategoryModal(task);
    });
}

function openRenameModal(task) {
    const overlay = document.createElement('div');
    overlay.classList.add('modal-overlay');

    overlay.innerHTML = `
        <div class="modal">
            <h2>Renombrar tarea</h2>
            <input type="text" id="rename-input" value="${task.name}" maxlength="80" />
            <span class="modal-field-error" id="modal-rename-error"></span>
            <div class="modal-buttons">
                <button class="btn-cancel">Cancelar</button>
                <button class="btn-add">Guardar</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('active'));

    const input = overlay.querySelector('#rename-input');
    input.focus();
    input.select();

    const close = () => {
        overlay.classList.remove('active');
        overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
    };

    const save = async () => {
        const newName = input.value.trim();
        if (!newName) {
            input.style.borderColor = '#e74c3c';
            overlay.querySelector('#modal-rename-error').textContent = 'El nombre no puede estar vacío.';
            input.focus();
            return;
        }

        overlay.querySelector('.btn-add').disabled = true;
        overlay.querySelector('.btn-add').textContent = 'Guardando...';

        try {
            await apiUpdateTask(task.id, { name: newName });
            task.name = newName;
            renderTasks();
            close();
            showToast('Tarea renombrada.', 'success');
        } catch (error) {
            if (error.message !== 'Unauthorized') {
                overlay.querySelector('#modal-rename-error').textContent = error.message;
                overlay.querySelector('.btn-add').disabled = false;
                overlay.querySelector('.btn-add').textContent = 'Guardar';
            }
        }
    };

    overlay.querySelector('.btn-cancel').addEventListener('click', close);
    overlay.querySelector('.btn-add').addEventListener('click', save);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') save();
        if (e.key === 'Escape') close();
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
}

function openMoveCategoryModal(task) {
    const overlay = document.createElement('div');
    overlay.classList.add('modal-overlay');

    const availableKeys = Object.keys(sectionNames).filter(k => k !== currentSection);
    const categoryButtons = availableKeys.map(key => `
        <button class="category-option" data-key="${key}">${sectionNames[key]}</button>
    `).join('');

    overlay.innerHTML = `
        <div class="modal">
            <h2>Mover a categoría</h2>
            <p style="color: #666; font-size: 14px;">"${task.name}"</p>
            <div class="category-list">${categoryButtons}</div>
            <div class="modal-buttons">
                <button class="btn-cancel">Cancelar</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('active'));

    const close = () => {
        overlay.classList.remove('active');
        overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
    };

    overlay.querySelector('.btn-cancel').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    overlay.querySelectorAll('.category-option').forEach(btn => {
        btn.addEventListener('click', async () => {
            const targetKey = btn.dataset.key;
            btn.disabled = true;
            btn.textContent = 'Moviendo...';

            try {
                await apiUpdateTask(task.id, { section: targetKey, checked: false });
                tasks[currentSection] = tasks[currentSection].filter(t => t.id !== task.id);
                task.section  = targetKey;
                task.checked  = false;
                tasks[targetKey].push(task);
                renderTasks();
                close();
                showToast(`Tarea movida a ${sectionNames[targetKey]}.`, 'success');
            } catch (error) {
                if (error.message !== 'Unauthorized') {
                    showToast(error.message);
                    btn.disabled = false;
                    btn.textContent = sectionNames[targetKey];
                }
            }
        });
    });
}

// ================================
// INICIALIZAR
// ================================
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar sesión antes de cargar nada
    if (!getToken()) {
        window.location.href = 'login.html';
        return;
    }

    // Mostrar nombre de usuario en el sidebar
    const user = getUser();
    if (user) {
        document.querySelector('.name a').textContent = `${user.username}`;
    }

    await fetchTasks();
    renderTasks();

    // Sidebar: cambio de sección
    const sectionMap = ['daily', 'important', 'forMyUser', 'tasks'];
    document.querySelectorAll('.middle-part a').forEach((link, index) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            currentSection = sectionMap[index];
            renderTasks();
        });
    });

    // Home
    document.querySelector('.nav a:nth-child(1)').addEventListener('click', (e) => {
        e.preventDefault();
        currentSection = 'daily';
        renderTasks();
    });

    // New Task
    document.querySelector('.nav a:nth-child(2)').addEventListener('click', (e) => {
        e.preventDefault();
        openNewTaskModal();
    });

    // Delete Task
    document.querySelector('.nav a:nth-child(3)').addEventListener('click', async (e) => {
        e.preventDefault();
        const checked = (tasks[currentSection] || []).filter(t => t.checked);
        if (checked.length === 0) {
            showToast('Marca al menos una tarea para eliminarla.');
            return;
        }
        if (!window.confirm(`¿Eliminar ${checked.length} tarea(s) seleccionada(s)?`)) return;

        try {
            await apiDeleteChecked(currentSection);
            tasks[currentSection] = tasks[currentSection].filter(t => !t.checked);
            renderTasks();
            showToast(`${checked.length} tarea(s) eliminada(s).`, 'success');
        } catch (error) {
            if (error.message !== 'Unauthorized') showToast(error.message);
        }
    });

    // Config Task
    document.querySelector('.nav a:nth-child(4)').addEventListener('click', (e) => {
        e.preventDefault();
        const checked = (tasks[currentSection] || []).filter(t => t.checked);
        if (checked.length === 0) {
            showToast('Marca una tarea para configurarla.');
            return;
        }
        if (checked.length > 1) {
            showToast('Selecciona solo una tarea a la vez para configurar.');
            return;
        }
        openConfigModal(checked[0]);
    });

    // New List
    document.querySelector('.new-list a').addEventListener('click', (e) => {
        e.preventDefault();
        showToast('Funcionalidad próximamente.', 'success');
    });

    // Logout
    document.querySelector('.name a').addEventListener('click', (e) => {
        e.preventDefault();
        if (window.confirm('¿Cerrar sesión?')) logout();
    });
});
