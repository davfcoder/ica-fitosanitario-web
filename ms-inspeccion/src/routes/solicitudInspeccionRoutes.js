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

// PATCH - Admin asigna/cancela
router.patch('/:id/asignar', verificarRol(['Administrador ICA']), (req, res) => controller.patchAsignarAsistente(req, res));
router.patch('/:id/cancelar', verificarRol(['Administrador ICA']), (req, res) => controller.patchCancelar(req, res));

// PATCH - Asistente inicia/completa/inconclusa
router.patch('/:id/iniciar', verificarRol(['Asistente Técnico']), (req, res) => controller.patchIniciar(req, res));
router.patch('/:id/completar', verificarRol(['Asistente Técnico']), (req, res) => controller.patchCompletar(req, res));
router.patch('/:id/inconclusa', verificarRol(['Asistente Técnico']), (req, res) => controller.patchInconclusa(req, res));
router.patch('/:id/reasignar', verificarRol(['Administrador ICA']), (req, res) => controller.patchReasignar(req, res));

module.exports = router;