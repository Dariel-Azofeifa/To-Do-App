const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    // El token viene en el header: Authorization: Bearer <token>
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Token requerido.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, username, email }
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Sesión expirada. Inicia sesión nuevamente.', expired: true });
        }
        return res.status(401).json({ error: 'Token inválido.' });
    }
}

module.exports = authMiddleware;
