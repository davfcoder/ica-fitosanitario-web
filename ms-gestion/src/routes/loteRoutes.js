const express = require('express');
const router = express.Router();
const controller = require('../controllers/loteController');
const verificarToken = require('../middlewares/authMiddleware');
const verificarRol = require('../middlewares/roleMiddleware');

router.use(verificarToken);

// GET - Todos los roles autenticados
router.get('/', (req, res) => controller.getLotes(req, res));
router.get('/:id', (req, res) => controller.getLotePorId(req, res));

// CUD - Productor y Admin
// Solo Productor puede crear, editar y eliminar
router.post('/', verificarRol(['Productor']), (req, res) => controller.postCrearLote(req, res));
router.put('/:id', verificarRol(['Productor']), (req, res) => controller.putLote(req, res));
router.delete('/:id', verificarRol(['Productor']), (req, res) => controller.deleteLote(req, res));

module.exports = router;