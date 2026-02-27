const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const { register, login, me } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

const registerValidation = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('El username debe tener entre 3 y 50 caracteres.')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('El username solo puede tener letras, números y guiones bajos.'),
    body('email')
        .isEmail()
        .withMessage('El email no es válido.')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres.')
];

const loginValidation = [
    body('email')
        .isEmail()
        .withMessage('El email no es válido.')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('La contraseña es requerida.')
];

router.post('/register', registerValidation, register);
router.post('/login',    loginValidation,    login);
router.get('/me',        authMiddleware,     me);

module.exports = router;
