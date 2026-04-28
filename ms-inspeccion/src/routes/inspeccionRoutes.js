const express = require('express');
const router = express.Router();
const controller = require('../controllers/inspeccionController');
const verificarToken = require('../middlewares/authMiddleware');
const verificarRol = require('../middlewares/roleMiddleware');

router.use(verificarToken);

// POST - Asistente registra inspección
router.post('/', verificarRol(['Asistente Técnico']), (req, res) => controller.postCrearInspeccion(req, res));

// GET - Consultas
router.get('/estadisticas', (req, res) => controller.getEstadisticas(req, res));
router.get('/reporte', (req, res) => controller.getReporte(req, res));
router.get('/solicitud/:idSolicitud', (req, res) => controller.getInspeccionesPorSolicitud(req, res));
router.get('/lote/:idLote', (req, res) => controller.getInspeccionesPorLote(req, res));
router.get('/:id', (req, res) => controller.getInspeccionPorId(req, res));

module.exports = router;