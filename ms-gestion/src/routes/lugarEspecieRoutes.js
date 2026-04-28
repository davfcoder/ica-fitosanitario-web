const express = require('express');
const router = express.Router();
const controller = require('../controllers/lugarEspecieController');
const verificarToken = require('../middlewares/authMiddleware');
const verificarRol = require('../middlewares/roleMiddleware');

router.use(verificarToken);

// GET proyecciones de un lugar
router.get('/:idLugar', (req, res) => controller.getLugarEspecie(req, res));

// POST crear proyección (Productor)
router.post('/', verificarRol(['Productor', 'Administrador ICA']), (req, res) => controller.postProyeccionCultivo(req, res));

// PUT actualizar proyección
router.put('/:idLugar/:idEspecie', verificarRol(['Productor', 'Administrador ICA']), (req, res) => controller.putProyeccion(req, res));

// DELETE eliminar proyección
router.delete('/:idLugar/:idEspecie', verificarRol(['Productor', 'Administrador ICA']), (req, res) => controller.deleteProyeccion(req, res));

module.exports = router;