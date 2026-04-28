const express = require('express');
const router = express.Router();
const controller = require('../controllers/predioController');
const verificarToken = require('../middlewares/authMiddleware');
const verificarRol = require('../middlewares/roleMiddleware');

router.use(verificarToken);

// GET - Listar predios (Admin y Productor pueden consultar)
router.get('/', (req, res) => controller.getPredios(req, res));
router.get('/:id', (req, res) => controller.getPredioPorId(req, res));

// CUD solo Administrador ICA
router.post('/', verificarRol(['Administrador ICA']), (req, res) => controller.postCrearPredio(req, res));
router.put('/:id', verificarRol(['Administrador ICA']), (req, res) => controller.putPredio(req, res));
router.delete('/:id', verificarRol(['Administrador ICA']), (req, res) => controller.deletePredio(req, res));

module.exports = router;