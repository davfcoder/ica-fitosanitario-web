const express = require('express');
const router = express.Router();
const controller = require('../controllers/solicitudInspeccionController');
const verificarToken = require('../middlewares/authMiddleware');
const verificarRol = require('../middlewares/roleMiddleware');

router.use(verificarToken);

// GET
router.get('/', (req, res) => controller.getSolicitudes(req, res));
router.get('/contadores', (req, res) => controller.getContadores(req, res));
router.get('/:id', (req, res) => controller.getSolicitudPorId(req, res));

// POST - Productor solicita
router.post('/', verificarRol(['Productor']), (req, res) => controller.postCrearSolicitud(req, res));

// PATCH - Admin asigna
router.patch('/:id/asignar', verificarRol(['Administrador ICA']), (req, res) => controller.patchAsignarAsistente(req, res));

// PATCH - Asistente inicia/completa
router.patch('/:id/iniciar', verificarRol(['Asistente Técnico']), (req, res) => controller.patchIniciar(req, res));
router.patch('/:id/completar', verificarRol(['Asistente Técnico']), (req, res) => controller.patchCompletar(req, res));

module.exports = router;