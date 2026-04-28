const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const verificarToken = require('../middlewares/authMiddleware');
const verificarRol = require('../middlewares/roleMiddleware');

// Todas las rutas requieren autenticación + rol Administrador ICA
router.use(verificarToken);
router.use(verificarRol(['Administrador ICA']));

// POST /api/usuarios - Crear usuario
router.post('/', (req, res) => usuarioController.postCrearUsuario(req, res));

// GET /api/usuarios - Listar usuarios (soporta ?rol=2)
router.get('/', (req, res) => usuarioController.getUsuarios(req, res));

// GET /api/usuarios/:id - Obtener usuario por ID
router.get('/:id', (req, res) => usuarioController.getUsuarioPorId(req, res));

// PUT /api/usuarios/:id - Actualizar usuario
router.put('/:id', (req, res) => usuarioController.putActualizarUsuario(req, res));

// DELETE /api/usuarios/:id - Eliminar usuario
router.delete('/:id', (req, res) => usuarioController.deleteUsuario(req, res));

module.exports = router;