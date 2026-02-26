// ================================
// ESTADO DE LA APP
// ================================
let currentSection = 'daily';

let tasks = {
    daily: [],
    important: [],
    forMyUser: [],
    tasks: []
};

const sectionNames = {
    daily: 'Daily',
    important: 'Important',
    forMyUser: 'For my User',
    tasks: 'Tasks'
};

// ================================
// LOCALSTORAGE
// ================================
function loadTasks() {
    const saved = localStorage.getItem('todoTasks');
    if (saved) tasks = JSON.parse(saved);
}

function saveTasks() {
    localStorage.setItem('todoTasks', JSON.stringify(tasks));
}

// ================================
// RENDERIZAR TAREAS
// ================================
function renderTasks() {
    const main = document.querySelector('.Main');
    main.innerHTML = '';

    if (tasks[currentSection].length === 0) {
        const empty = document.createElement('p');
        empty.textContent = 'No hay tareas en esta sección.';
        empty.style.color = '#999';
        empty.style.fontStyle = 'italic';
        main.appendChild(empty);
        return;
    }

    tasks[currentSection].forEach((task) => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = task.id;
        checkbox.checked = task.checked;

        checkbox.addEventListener('change', () => {
            task.checked = checkbox.checked;
            saveTasks();
            renderTasks();
        });

        const label = document.createElement('label');
        label.htmlFor = task.id;
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

    const addTask = () => {
        const name = input.value.trim();
        if (!name) {
            input.style.borderColor = '#e74c3c';
            input.focus();
            return;
        }
        tasks[currentSection].push({
            id: 'task-' + Date.now(),
            name,
            checked: false
        });
        saveTasks();
        renderTasks();
        close();
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

    const save = () => {
        const newName = input.value.trim();
        if (!newName) {
            input.style.borderColor = '#e74c3c';
            input.focus();
            return;
        }
        task.name = newName;
        saveTasks();
        renderTasks();
        close();
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
            <div class="category-list">
                ${categoryButtons}
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

    overlay.querySelectorAll('.category-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetKey = btn.dataset.key;
            tasks[currentSection] = tasks[currentSection].filter(t => t.id !== task.id);
            task.checked = false;
            tasks[targetKey].push(task);
            saveTasks();
            renderTasks();
            close();
        });
    });
}

// ================================
// INICIALIZAR
// ================================
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    renderTasks();

    const sectionMap = ['daily', 'important', 'forMyUser', 'tasks'];
    document.querySelectorAll('.middle-part a').forEach((link, index) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            currentSection = sectionMap[index];
            renderTasks();
        });
    });

    document.querySelector('.nav a:nth-child(1)').addEventListener('click', (e) => {
        e.preventDefault();
        currentSection = 'daily';
        renderTasks();
    });

    document.querySelector('.nav a:nth-child(2)').addEventListener('click', (e) => {
        e.preventDefault();
        openNewTaskModal();
    });

    document.querySelector('.nav a:nth-child(3)').addEventListener('click', (e) => {
        e.preventDefault();
        const checked = tasks[currentSection].filter(t => t.checked);
        if (checked.length === 0) {
            alert('Marca al menos una tarea para eliminarla.');
            return;
        }
        if (!window.confirm(`¿Eliminar ${checked.length} tarea(s) seleccionada(s)?`)) return;
        tasks[currentSection] = tasks[currentSection].filter(t => !t.checked);
        saveTasks();
        renderTasks();
    });

    document.querySelector('.nav a:nth-child(4)').addEventListener('click', (e) => {
        e.preventDefault();
        const checked = tasks[currentSection].filter(t => t.checked);
        if (checked.length === 0) {
            alert('Marca una tarea para configurarla.');
            return;
        }
        if (checked.length > 1) {
            alert('Selecciona solo una tarea a la vez para configurar.');
            return;
        }
        openConfigModal(checked[0]);
    });

    document.querySelector('.new-list a').addEventListener('click', (e) => {
        e.preventDefault();
        alert('Funcionalidad de nueva lista próximamente.');
    });
});
