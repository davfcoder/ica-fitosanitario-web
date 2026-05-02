const lugarProduccionService = require('../services/lugarProduccionService');

class LugarProduccionController {

    // Productor solicita edición
    async patchSolicitarEdicion(req, res) {
        try {
            const lugar = await lugarProduccionService.solicitarEdicion(req.params.id, req.body, req.usuario);
            res.status(200).json({ message: 'Solicitud de edición enviada', data: lugar });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    // Productor solicita cancelación
    async patchSolicitarCancelacion(req, res) {
        try {
            const lugar = await lugarProduccionService.solicitarCancelacion(req.params.id, req.body, req.usuario);
            res.status(200).json({ message: 'Solicitud de cancelación enviada', data: lugar });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    // Admin aprueba cambio (edición o cancelación)
    async patchAprobarCambio(req, res) {
        try {
            const lugar = await lugarProduccionService.aprobarCambio(req.params.id, req.body, req.usuario);
            res.status(200).json({ message: 'Cambio aprobado exitosamente', data: lugar });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    // Admin rechaza cambio
    async patchRechazarCambio(req, res) {
        try {
            const lugar = await lugarProduccionService.rechazarCambio(req.params.id, req.body, req.usuario);
            res.status(200).json({ message: 'Cambio rechazado', data: lugar });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    // Productor crea solicitud
    async postCrearLugar(req, res) {
        try {
            const lugar = await lugarProduccionService.crearSolicitud(req.body, req.usuario);
            res.status(201).json({ message: 'Solicitud de lugar de producción creada exitosamente', data: lugar });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    // Productor corrige solicitud devuelta
    async putCorregirSolicitud(req, res) {
        try {
            const lugar = await lugarProduccionService.corregirSolicitud(req.params.id, req.body, req.usuario);
            res.status(200).json({ message: 'Solicitud corregida y reenviada exitosamente', data: lugar });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async getLugares(req, res) {
        try {
            // Filtros por query params
            if (req.query.estado === 'pendiente') {
                const lugares = await lugarProduccionService.listarSolicitudesPendientes();
                return res.status(200).json({ message: 'Solicitudes pendientes', data: lugares });
            }

            // Si es Productor, solo ve los suyos
            if (req.usuario.nom_rol === 'Productor') {
                const lugares = await lugarProduccionService.listarLugaresPorProductor(req.usuario.id_usuario);
                return res.status(200).json({ message: 'Mis lugares de producción', data: lugares });
            }

            const lugares = await lugarProduccionService.listarLugares();
            res.status(200).json({ message: 'Lista de lugares de producción', data: lugares });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async getLugarPorId(req, res) {
        try {
            const lugar = await lugarProduccionService.obtenerLugarPorId(req.params.id);
            res.status(200).json({ message: 'Lugar de producción encontrado', data: lugar });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    // Admin aprueba
    async patchAprobar(req, res) {
        try {
            const lugar = await lugarProduccionService.aprobarSolicitud(req.params.id, req.body, req.usuario);
            res.status(200).json({ message: 'Lugar de producción aprobado exitosamente', data: lugar });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    // Admin rechaza
    async patchRechazar(req, res) {
        try {
            const lugar = await lugarProduccionService.rechazarSolicitud(req.params.id, req.body, req.usuario);
            res.status(200).json({ message: 'Solicitud rechazada', data: lugar });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    // Admin devuelve
    async patchDevolver(req, res) {
        try {
            const lugar = await lugarProduccionService.devolverSolicitud(req.params.id, req.body, req.usuario);
            res.status(200).json({ message: 'Solicitud devuelta para correcciones', data: lugar });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async deleteLugar(req, res) {
        try {
            await lugarProduccionService.eliminarLugar(req.params.id);
            res.status(200).json({ message: 'Lugar de producción eliminado exitosamente' });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async getAreaTotal(req, res) {
        try {
            const area = await lugarProduccionService.calcularAreaTotalUnificada(req.params.id);
            res.status(200).json({ message: 'Área total calculada', data: { area_total_hectareas: area } });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }
}

module.exports = new LugarProduccionController();