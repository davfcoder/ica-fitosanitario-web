const express = require('express');
const router = express.Router();
const controller = require('../controllers/plagaController');
const verificarToken = require('../middlewares/authMiddleware');
const verificarRol = require('../middlewares/roleMiddleware');

router.use(verificarToken);

// GET (todos los roles) - soporta ?especie=1
router.get('/', (req, res) => controller.getPlagas(req, res));
router.get('/:id', (req, res) => controller.getPlagaPorId(req, res));

// CUD solo Administrador ICA
router.post('/', verificarRol(['Administrador ICA']), (req, res) => controller.postPlaga(req, res));
router.put('/:id', verificarRol(['Administrador ICA']), (req, res) => controller.putPlaga(req, res));
router.delete('/:id', verificarRol(['Administrador ICA']), (req, res) => controller.deletePlaga(req, res));

// Asociar/Desasociar plaga con especie vegetal
router.post('/:id/especies', verificarRol(['Administrador ICA']), (req, res) => controller.postAsociarEspecie(req, res));
router.delete('/:id/especies/:idEspecie', verificarRol(['Administrador ICA']), (req, res) => controller.deleteAsociarEspecie(req, res));

module.exports = router;