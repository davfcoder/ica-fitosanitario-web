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

module.exports = router;