const express = require('express');
const router = express.Router();
const controller = require('../controllers/notificacionController');
const verificarToken = require('../middlewares/authMiddleware');

// Endpoint interno (sin JWT, validado por header secreto)
router.post('/internal', (req, res) => controller.postCrearInterno(req, res));

// Endpoints públicos (con JWT)
router.use(verificarToken);
router.get('/', (req, res) => controller.getMisNotificaciones(req, res));
router.patch('/marcar-todas-leidas', (req, res) => controller.patchMarcarTodasLeidas(req, res));
router.delete('/limpiar', (req, res) => controller.deleteTodas(req, res));
router.patch('/:id/leida', (req, res) => controller.patchMarcarLeida(req, res));
router.delete('/:id', (req, res) => controller.deleteUna(req, res));

module.exports = router;