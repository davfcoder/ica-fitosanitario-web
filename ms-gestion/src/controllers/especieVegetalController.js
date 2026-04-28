const especieVegetalService = require('../services/especieVegetalService');

class EspecieVegetalController {

    async postEspecie(req, res) {
        try {
            const especie = await especieVegetalService.crearEspecie(req.body);
            res.status(201).json({ message: 'Especie vegetal creada exitosamente', data: especie });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async getEspecies(req, res) {
        try {
            const especies = await especieVegetalService.listarEspecies();
            res.status(200).json({ message: 'Lista de especies vegetales', data: especies });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async getEspeciePorId(req, res) {
        try {
            const especie = await especieVegetalService.obtenerEspeciePorId(req.params.id);
            res.status(200).json({ message: 'Especie encontrada', data: especie });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async putEspecie(req, res) {
        try {
            const especie = await especieVegetalService.actualizarEspecie(req.params.id, req.body);
            res.status(200).json({ message: 'Especie actualizada exitosamente', data: especie });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async deleteEspecie(req, res) {
        try {
            await especieVegetalService.eliminarEspecie(req.params.id);
            res.status(200).json({ message: 'Especie vegetal eliminada exitosamente' });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }
}

module.exports = new EspecieVegetalController();