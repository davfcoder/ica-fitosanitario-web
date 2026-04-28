const express = require('express');
const router = express.Router();
const controller = require('../controllers/variedadEspecieController');
const verificarToken = require('../middlewares/authMiddleware');
const verificarRol = require('../middlewares/roleMiddleware');

router.use(verificarToken);

// GET (todos los roles autenticados) - soporta ?especie=1
router.get('/', (req, res) => controller.getVariedades(req, res));
router.get('/:id', (req, res) => controller.getVariedadPorId(req, res));

// CUD solo Administrador ICA
router.post('/', verificarRol(['Administrador ICA']), (req, res) => controller.postVariedad(req, res));
router.put('/:id', verificarRol(['Administrador ICA']), (req, res) => controller.putVariedad(req, res));
router.delete('/:id', verificarRol(['Administrador ICA']), (req, res) => controller.deleteVariedad(req, res));

module.exports = router;