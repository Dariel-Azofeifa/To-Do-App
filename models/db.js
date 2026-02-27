const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    database: process.env.DB_NAME,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function initDB() {
    try {
        // Tabla de usuarios
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id         SERIAL PRIMARY KEY,
                username   VARCHAR(50)  UNIQUE NOT NULL,
                email      VARCHAR(100) UNIQUE NOT NULL,
                password   VARCHAR(255) NOT NULL,
                created_at TIMESTAMP    NOT NULL DEFAULT NOW()
            );
        `);

        // Tabla de tareas vinculada a usuarios
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id         SERIAL PRIMARY KEY,
                user_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name       VARCHAR(80)  NOT NULL,
                section    VARCHAR(20)  NOT NULL DEFAULT 'daily',
                checked    BOOLEAN      NOT NULL DEFAULT false,
                created_at TIMESTAMP    NOT NULL DEFAULT NOW()
            );
        `);

        console.log('✅ Base de datos lista');
    } catch (error) {
        console.error('❌ Error al inicializar la base de datos:', error.message);
        process.exit(1);
    }
}

module.exports = { pool, initDB };
