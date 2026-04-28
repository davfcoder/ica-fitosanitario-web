const plagaService = require('../services/plagaService');

class PlagaController {

    async postPlaga(req, res) {
        try {
            const plaga = await plagaService.crearPlaga(req.body);
            res.status(201).json({ message: 'Plaga creada exitosamente', data: plaga });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async getPlagas(req, res) {
        try {
            // Soporta filtro ?especie=1 para plagas de una especie
            if (req.query.especie) {
                const plagas = await plagaService.obtenerPlagasPorEspecie(req.query.especie);
                return res.status(200).json({ message: 'Plagas de la especie', data: plagas });
            }
            const plagas = await plagaService.listarPlagas();
            res.status(200).json({ message: 'Lista de plagas', data: plagas });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async getPlagaPorId(req, res) {
        try {
            const plaga = await plagaService.obtenerPlagaPorId(req.params.id);
            res.status(200).json({ message: 'Plaga encontrada', data: plaga });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async putPlaga(req, res) {
        try {
            const plaga = await plagaService.actualizarPlaga(req.params.id, req.body);
            res.status(200).json({ message: 'Plaga actualizada exitosamente', data: plaga });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async deletePlaga(req, res) {
        try {
            await plagaService.eliminarPlaga(req.params.id);
            res.status(200).json({ message: 'Plaga eliminada exitosamente' });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    // Asociar plaga con especie
    async postAsociarEspecie(req, res) {
        try {
            const resultado = await plagaService.asociarConEspecie(req.params.id, req.body.id_especie);
            res.status(201).json({ message: resultado.message });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    // Desasociar plaga de especie
    async deleteAsociarEspecie(req, res) {
        try {
            const resultado = await plagaService.desasociarDeEspecie(req.params.id, req.params.idEspecie);
            res.status(200).json({ message: resultado.message });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }
}

module.exports = new PlagaController();