const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const {
    getAllTasks,
    createTask,
    updateTask,
    deleteTask,
    deleteCheckedTasks
} = require('../controllers/tasksController');

const VALID_SECTIONS = ['daily', 'important', 'forMyUser', 'tasks'];

const createValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('El nombre de la tarea es requerido.')
        .isLength({ max: 80 }).withMessage('El nombre no puede superar 80 caracteres.'),
    body('section')
        .isIn(VALID_SECTIONS).withMessage('Sección inválida.')
];

const updateValidation = [
    body('name')
        .optional()
        .trim()
        .notEmpty().withMessage('El nombre no puede estar vacío.')
        .isLength({ max: 80 }).withMessage('El nombre no puede superar 80 caracteres.'),
    body('section')
        .optional()
        .isIn(VALID_SECTIONS).withMessage('Sección inválida.'),
    body('checked')
        .optional()
        .isBoolean().withMessage('checked debe ser true o false.')
];

const deleteCheckedValidation = [
    body('section')
        .isIn(VALID_SECTIONS).withMessage('Sección inválida.')
];

// Todas las rutas de tareas requieren autenticación
router.use(authMiddleware);

router.get('/',              getAllTasks);
router.post('/',             createValidation,       createTask);
router.put('/:id',           updateValidation,       updateTask);
router.delete('/checked',    deleteCheckedValidation, deleteCheckedTasks);
router.delete('/:id',        deleteTask);

module.exports = router;
