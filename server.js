const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const { initDB }    = require('./models/db');
const authRoutes    = require('./routes/auth');
const tasksRoutes   = require('./routes/tasks');

const app  = express();
const PORT = process.env.PORT || 3000;

// ================================
// MIDDLEWARES
// ================================
app.use(cors());
app.use(express.json());

// Middleware global de manejo de errores inesperados
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
});

// ================================
// RUTAS
// ================================
app.use('/api/auth',  authRoutes);
app.use('/api/tasks', tasksRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor funcionando' });
});

// Ruta 404 para endpoints que no existen
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada.' });
});

// ================================
// INICIAR SERVIDOR
// ================================
async function start() {
    await initDB();
    app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
}

start();
