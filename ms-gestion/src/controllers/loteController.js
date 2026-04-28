const loteService = require('../services/loteService');

class LoteController {

    async postCrearLote(req, res) {
        try {
            const lote = await loteService.crearLote(req.body);
            res.status(201).json({ message: 'Lote registrado exitosamente', data: lote });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async getLotes(req, res) {
        try {
            // Soporta ?lugar=1 y ?lugar=1&activos=true
            if (req.query.lugar && req.query.activos === 'true') {
                const lotes = await loteService.listarLotesActivosPorLugar(req.query.lugar);
                return res.status(200).json({ message: 'Lotes activos del lugar', data: lotes });
            }
            const lotes = await loteService.listarLotes({ id_lugar_produccion: req.query.lugar });
            res.status(200).json({ message: 'Lista de lotes', data: lotes });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async getLotePorId(req, res) {
        try {
            const lote = await loteService.obtenerLotePorId(req.params.id);
            res.status(200).json({ message: 'Lote encontrado', data: lote });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async putLote(req, res) {
        try {
            const lote = await loteService.actualizarLote(req.params.id, req.body);
            res.status(200).json({ message: 'Lote actualizado exitosamente', data: lote });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async deleteLote(req, res) {
        try {
            await loteService.eliminarLote(req.params.id);
            res.status(200).json({ message: 'Lote eliminado exitosamente' });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }
}

module.exports = new LoteController();