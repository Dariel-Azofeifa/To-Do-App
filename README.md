# To-Do Dariel v2 — Con Autenticación JWT

## Estructura del proyecto
```
todo-dariel/
├── server.js                        → Punto de entrada del backend
├── package.json
├── .env.example                     → Variables de entorno (copia como .env)
│
├── models/
│   └── db.js                        → Conexión y setup de PostgreSQL
│
├── middleware/
│   └── auth.js                      → Validación del token JWT
│
├── controllers/
│   ├── authController.js            → Lógica de registro y login
│   └── tasksController.js           → Lógica CRUD de tareas
│
├── routes/
│   ├── auth.js                      → Rutas de autenticación
│   └── tasks.js                     → Rutas de tareas (protegidas)
│
└── frontend/
    ├── login.html + login.css + login.js   → Página de login/registro
    ├── index.html                          → App principal
    ├── styles.css                          → Estilos de la app
    └── app.js                              → Lógica del frontend
```

---

## Setup paso a paso

### 1. Instalar dependencias
```bash
npm install
```

### 2. Crear la base de datos en PostgreSQL
```sql
CREATE DATABASE todo_db;
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
```
Llena el `.env` con tus datos:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=todo_db
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
PORT=3000
JWT_SECRET=una_clave_larga_y_aleatoria_aqui
JWT_EXPIRES_IN=7d
```

> ⚠️ El JWT_SECRET debe ser una cadena larga y aleatoria. Nunca la compartas ni la subas a GitHub.

### 4. Iniciar el servidor
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

Las tablas se crean automáticamente al iniciar el servidor.

### 5. Abrir el frontend
Abre `login.html` en tu navegador.

---

## Endpoints de la API

### Auth
| Método | Ruta                  | Descripción                  | Auth |
|--------|-----------------------|------------------------------|------|
| POST   | /api/auth/register    | Crear cuenta                 | No   |
| POST   | /api/auth/login       | Iniciar sesión               | No   |
| GET    | /api/auth/me          | Obtener usuario actual       | Sí   |

### Tasks (todas requieren token)
| Método | Ruta                  | Descripción                              |
|--------|-----------------------|------------------------------------------|
| GET    | /api/tasks            | Traer todas las tareas del usuario       |
| POST   | /api/tasks            | Crear una tarea                          |
| PUT    | /api/tasks/:id        | Actualizar nombre, sección o checked     |
| DELETE | /api/tasks/checked    | Eliminar tareas marcadas de una sección  |
| DELETE | /api/tasks/:id        | Eliminar una tarea por id                |

### Formato del token
Todas las rutas protegidas requieren el header:
```
Authorization: Bearer <token>
```
