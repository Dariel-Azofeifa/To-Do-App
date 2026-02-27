const { validationResult } = require('express-validator');
const { pool } = require('../models/db');

const VALID_SECTIONS = ['daily', 'important', 'forMyUser', 'tasks'];

// GET /api/tasks
async function getAllTasks(req, res) {
    try {
        const result = await pool.query(
            'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at ASC',
            [req.user.id]
        );

        const grouped = {
            daily: [],
            important: [],
            forMyUser: [],
            tasks: []
        };

        result.rows.forEach(task => {
            if (grouped[task.section] !== undefined) {
                grouped[task.section].push(task);
            }
        });

        res.json(grouped);
    } catch (error) {
        console.error('Error en getAllTasks:', error.message);
        res.status(500).json({ error: 'Error al obtener las tareas.' });
    }
}

// POST /api/tasks
async function createTask(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, section } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO tasks (user_id, name, section) VALUES ($1, $2, $3) RETURNING *',
            [req.user.id, name.trim(), section]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error en createTask:', error.message);
        res.status(500).json({ error: 'Error al crear la tarea.' });
    }
}

// PUT /api/tasks/:id
async function updateTask(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, section, checked } = req.body;

    try {
        // Verificar que la tarea pertenece al usuario antes de modificarla
        const owner = await pool.query(
            'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );

        if (owner.rows.length === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada.' });
        }

        const result = await pool.query(`
            UPDATE tasks
            SET
                name    = COALESCE($1, name),
                section = COALESCE($2, section),
                checked = COALESCE($3, checked)
            WHERE id = $4 AND user_id = $5
            RETURNING *
        `, [
            name ? name.trim() : null,
            section || null,
            checked !== undefined ? checked : null,
            id,
            req.user.id
        ]);

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error en updateTask:', error.message);
        res.status(500).json({ error: 'Error al actualizar la tarea.' });
    }
}

// DELETE /api/tasks/checked
async function deleteCheckedTasks(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { section } = req.body;

    try {
        const result = await pool.query(
            'DELETE FROM tasks WHERE user_id = $1 AND section = $2 AND checked = true RETURNING *',
            [req.user.id, section]
        );
        res.json({ message: `${result.rowCount} tarea(s) eliminada(s).`, deleted: result.rows });
    } catch (error) {
        console.error('Error en deleteCheckedTasks:', error.message);
        res.status(500).json({ error: 'Error al eliminar las tareas.' });
    }
}

// DELETE /api/tasks/:id
async function deleteTask(req, res) {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada.' });
        }

        res.json({ message: 'Tarea eliminada.', task: result.rows[0] });
    } catch (error) {
        console.error('Error en deleteTask:', error.message);
        res.status(500).json({ error: 'Error al eliminar la tarea.' });
    }
}

module.exports = { getAllTasks, createTask, updateTask, deleteTask, deleteCheckedTasks };
