const API_URL = 'http://localhost:3000/api/auth';

// ================================
// TABS
// ================================
const tabLogin    = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const formLogin   = document.getElementById('form-login');
const formRegister= document.getElementById('form-register');

tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    formLogin.classList.add('active');
    formRegister.classList.remove('active');
    clearMessage();
    clearErrors();
});

tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    formRegister.classList.add('active');
    formLogin.classList.remove('active');
    clearMessage();
    clearErrors();
});

// ================================
// MENSAJES Y ERRORES
// ================================
function showMessage(text, type = 'error') {
    const msg = document.getElementById('auth-message');
    msg.textContent = text;
    msg.className = `auth-message ${type}`;
}

function clearMessage() {
    const msg = document.getElementById('auth-message');
    msg.textContent = '';
    msg.className = 'auth-message';
}

function showFieldError(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function clearErrors() {
    document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
    document.querySelectorAll('input').forEach(el => el.classList.remove('invalid'));
}

function setLoading(btn, loading) {
    btn.disabled = loading;
    btn.textContent = loading ? 'Cargando...' : btn.dataset.label;
}

// ================================
// LOGIN
// ================================
const btnLogin = document.getElementById('btn-login');
btnLogin.dataset.label = 'Entrar';

document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessage();
    clearErrors();

    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    setLoading(btnLogin, true);

    try {
        const res  = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            // Errores de validación campo por campo
            if (data.errors) {
                data.errors.forEach(err => {
                    if (err.path === 'email')    showFieldError('err-login-email',    err.msg);
                    if (err.path === 'password') showFieldError('err-login-password', err.msg);
                });
            } else {
                showMessage(data.error || 'Error al iniciar sesión.');
            }
            return;
        }

        // Guardar token y redirigir
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = 'index.html';

    } catch (error) {
        showMessage('No se pudo conectar con el servidor.');
    } finally {
        setLoading(btnLogin, false);
    }
});

// ================================
// REGISTER
// ================================
const btnRegister = document.getElementById('btn-register');
btnRegister.dataset.label = 'Crear cuenta';

document.getElementById('form-register').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessage();
    clearErrors();

    const username = document.getElementById('reg-username').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    setLoading(btnRegister, true);

    try {
        const res  = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            if (data.errors) {
                data.errors.forEach(err => {
                    if (err.path === 'username') showFieldError('err-reg-username', err.msg);
                    if (err.path === 'email')    showFieldError('err-reg-email',    err.msg);
                    if (err.path === 'password') showFieldError('err-reg-password', err.msg);
                });
            } else {
                showMessage(data.error || 'Error al registrarse.');
            }
            return;
        }

        // Registro exitoso — guardar y redirigir
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        showMessage('¡Cuenta creada! Redirigiendo...', 'success');
        setTimeout(() => window.location.href = 'index.html', 1000);

    } catch (error) {
        showMessage('No se pudo conectar con el servidor.');
    } finally {
        setLoading(btnRegister, false);
    }
});

// ================================
// SI YA HAY SESIÓN, REDIRIGIR
// ================================
if (localStorage.getItem('token')) {
    window.location.href = 'index.html';
}
