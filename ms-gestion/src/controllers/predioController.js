const predioService = require('../services/predioService');

class PredioController {

    async postCrearPredio(req, res) {
        try {
            const predio = await predioService.crearPredio(req.body);
            res.status(201).json({ message: 'Predio registrado exitosamente', data: predio });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async getPredios(req, res) {
        try {
            if (req.query.disponibles === 'true') {
                const predios = await predioService.listarPrediosDisponibles();
                return res.status(200).json({ message: 'Predios disponibles', data: predios });
            }
            if (req.query.lugar) {
                const predios = await predioService.obtenerPrediosPorLugar(req.query.lugar);
                return res.status(200).json({ message: 'Predios del lugar de producción', data: predios });
            }
            const predios = await predioService.listarPredios();
            res.status(200).json({ message: 'Lista de predios', data: predios });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async getPredioPorId(req, res) {
        try {
            const predio = await predioService.obtenerPredioPorId(req.params.id);
            res.status(200).json({ message: 'Predio encontrado', data: predio });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async putPredio(req, res) {
        try {
            const predio = await predioService.actualizarPredio(req.params.id, req.body);
            res.status(200).json({ message: 'Predio actualizado exitosamente', data: predio });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async deletePredio(req, res) {
        try {
            await predioService.eliminarPredio(req.params.id);
            res.status(200).json({ message: 'Predio eliminado exitosamente' });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }
}

module.exports = new PredioController();