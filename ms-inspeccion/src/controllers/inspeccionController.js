const inspeccionService = require('../services/inspeccionService');

class InspeccionController {

    async postCrearInspeccion(req, res) {
        try {
            const inspeccion = await inspeccionService.registrarInspeccion(req.body, req.usuario);
            res.status(201).json({ message: 'Inspección fitosanitaria registrada exitosamente', data: inspeccion });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async getInspeccionPorId(req, res) {
        try {
            const inspeccion = await inspeccionService.obtenerInspeccionPorId(req.params.id);
            res.status(200).json({ message: 'Inspección encontrada', data: inspeccion });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async getInspeccionesPorSolicitud(req, res) {
        try {
            const inspecciones = await inspeccionService.listarInspeccionesPorSolicitud(req.params.idSolicitud);
            res.status(200).json({ message: 'Inspecciones de la solicitud', data: inspecciones });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async getInspeccionesPorLote(req, res) {
        try {
            const inspecciones = await inspeccionService.listarInspeccionesPorLote(req.params.idLote);
            res.status(200).json({ message: 'Inspecciones del lote', data: inspecciones });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async getReporte(req, res) {
        try {
            const reporte = await inspeccionService.generarReporte(req.query, req.usuario);
            res.status(200).json({ message: 'Reporte generado exitosamente', data: reporte });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async getEstadisticas(req, res) {
        try {
            const stats = await inspeccionService.obtenerEstadisticas();
            res.status(200).json({ message: 'Estadísticas obtenidas', data: stats });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }
}

module.exports = new InspeccionController();