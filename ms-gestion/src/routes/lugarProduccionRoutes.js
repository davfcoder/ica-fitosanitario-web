const express = require('express');
const router = express.Router();
const controller = require('../controllers/lugarProduccionController');
const verificarToken = require('../middlewares/authMiddleware');
const verificarRol = require('../middlewares/roleMiddleware');

router.use(verificarToken);

// GET - Todos los roles autenticados
router.get('/', (req, res) => controller.getLugares(req, res));
router.get('/:id', (req, res) => controller.getLugarPorId(req, res));
router.get('/:id/area', (req, res) => controller.getAreaTotal(req, res));

// POST - Productor crea solicitud
router.post('/', verificarRol(['Productor']), (req, res) => controller.postCrearLugar(req, res));

// PUT - Productor corrige solicitud devuelta
router.put('/:id', verificarRol(['Productor']), (req, res) => controller.putCorregirSolicitud(req, res));

// PATCH - Admin aprueba/rechaza/devuelve
router.patch('/:id/aprobar', verificarRol(['Administrador ICA']), (req, res) => controller.patchAprobar(req, res));
router.patch('/:id/rechazar', verificarRol(['Administrador ICA']), (req, res) => controller.patchRechazar(req, res));
router.patch('/:id/devolver', verificarRol(['Administrador ICA']), (req, res) => controller.patchDevolver(req, res));

// DELETE - Admin elimina
router.delete('/:id', verificarRol(['Administrador ICA']), (req, res) => controller.deleteLugar(req, res));


// Productor solicita edición/cancelación de lugar aprobado
router.patch('/:id/solicitar-edicion', verificarRol(['Productor']), (req, res) => controller.patchSolicitarEdicion(req, res));
router.patch('/:id/solicitar-cancelacion', verificarRol(['Productor']), (req, res) => controller.patchSolicitarCancelacion(req, res));

// Admin aprueba/rechaza cambios solicitados
router.patch('/:id/aprobar-cambio', verificarRol(['Administrador ICA']), (req, res) => controller.patchAprobarCambio(req, res));
router.patch('/:id/rechazar-cambio', verificarRol(['Administrador ICA']), (req, res) => controller.patchRechazarCambio(req, res));

module.exports = router;