const solicitudService = require('../services/solicitudInspeccionService');

class SolicitudInspeccionController {

    async postCrearSolicitud(req, res) {
        try {
            const solicitud = await solicitudService.crearSolicitud(req.body, req.usuario);
            res.status(201).json({ message: 'Solicitud de inspección creada exitosamente', data: solicitud });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async getSolicitudes(req, res) {
        try {
            if (req.query.estado === 'pendiente') {
                const solicitudes = await solicitudService.listarPendientes();
                return res.status(200).json({ message: 'Solicitudes pendientes', data: solicitudes });
            }
            const solicitudes = await solicitudService.listarSolicitudes(req.usuario);
            res.status(200).json({ message: 'Lista de solicitudes', data: solicitudes });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async getSolicitudPorId(req, res) {
        try {
            const solicitud = await solicitudService.obtenerSolicitudPorId(req.params.id);
            res.status(200).json({ message: 'Solicitud encontrada', data: solicitud });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async patchAsignarAsistente(req, res) {
        try {
            const solicitud = await solicitudService.asignarAsistente(req.params.id, req.body);
            res.status(200).json({ message: 'Asistente técnico asignado exitosamente', data: solicitud });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async patchIniciar(req, res) {
        try {
            const solicitud = await solicitudService.iniciarInspeccion(req.params.id, req.usuario);
            res.status(200).json({ message: 'Inspección iniciada', data: solicitud });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async patchCompletar(req, res) {
        try {
            const solicitud = await solicitudService.completarInspeccion(req.params.id, req.usuario);
            res.status(200).json({ message: 'Inspección completada exitosamente', data: solicitud });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async patchCancelar(req, res) {
        try {
            const solicitud = await solicitudService.cancelarSolicitud(req.params.id, req.body);
            res.status(200).json({ message: 'Solicitud cancelada', data: solicitud });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async patchInconclusa(req, res) {
        try {
            const solicitud = await solicitudService.marcarInconclusa(req.params.id, req.body, req.usuario);
            res.status(200).json({ message: 'Inspección marcada como inconclusa', data: solicitud });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async patchReasignar(req, res) {
        try {
            const solicitud = await solicitudService.reasignarSolicitud(req.params.id, req.body);
            res.status(200).json({ message: 'Solicitud reasignada exitosamente', data: solicitud });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async getContadores(req, res) {
        try {
            const contadores = await solicitudService.obtenerContadores();
            res.status(200).json({ message: 'Contadores de solicitudes', data: contadores });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }
}

module.exports = new SolicitudInspeccionController();