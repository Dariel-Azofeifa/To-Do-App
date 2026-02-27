const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { pool } = require('../models/db');

// POST /api/auth/register
async function register(req, res) {
    // Revisar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
        // Verificar si el usuario o email ya existen
        const existing = await pool.query(
            'SELECT id FROM users WHERE email = $1 OR username = $2',
            [email.toLowerCase(), username.toLowerCase()]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'El usuario o email ya está registrado.' });
        }

        // Encriptar la contraseña (10 rondas de salt es el estándar)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear el usuario
        const result = await pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
            [username.toLowerCase(), email.toLowerCase(), hashedPassword]
        );

        const user = result.rows[0];

        // Generar el token
        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({ token, user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
        console.error('Error en register:', error.message);
        res.status(500).json({ error: 'Error al registrar el usuario.' });
    }
}

// POST /api/auth/login
async function login(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        // Buscar el usuario
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            // Mensaje genérico para no revelar si el email existe o no
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        const user = result.rows[0];

        // Comparar la contraseña
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        // Generar el token
        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
        console.error('Error en login:', error.message);
        res.status(500).json({ error: 'Error al iniciar sesión.' });
    }
}

// GET /api/auth/me (verificar token y devolver usuario)
async function me(req, res) {
    try {
        const result = await pool.query(
            'SELECT id, username, email FROM users WHERE id = $1',
            [req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Error en me:', error.message);
        res.status(500).json({ error: 'Error al obtener el usuario.' });
    }
}

module.exports = { register, login, me };
