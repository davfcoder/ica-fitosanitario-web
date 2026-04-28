const express = require('express');
const router = express.Router();
const controller = require('../controllers/especieVegetalController');
const verificarToken = require('../middlewares/authMiddleware');
const verificarRol = require('../middlewares/roleMiddleware');

router.use(verificarToken);

// GET /api/especies-vegetales - Listar (todos los roles autenticados)
router.get('/', (req, res) => controller.getEspecies(req, res));
router.get('/:id', (req, res) => controller.getEspeciePorId(req, res));

// CUD solo Administrador ICA
router.post('/', verificarRol(['Administrador ICA']), (req, res) => controller.postEspecie(req, res));
router.put('/:id', verificarRol(['Administrador ICA']), (req, res) => controller.putEspecie(req, res));
router.delete('/:id', verificarRol(['Administrador ICA']), (req, res) => controller.deleteEspecie(req, res));

module.exports = router;