const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verificarToken = require('../middlewares/authMiddleware');

// POST /api/auth/login - Público
router.post('/login', (req, res) => authController.postLogin(req, res));

// GET /api/auth/perfil - Protegido (requiere token)
router.get('/perfil', verificarToken, (req, res) => authController.getPerfil(req, res));

module.exports = router;