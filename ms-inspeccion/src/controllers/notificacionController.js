const notificacionService = require('../services/notificacionService');

class NotificacionController {

    async getMisNotificaciones(req, res) {
        try {
            const lista = await notificacionService.listarMisNotificaciones(req.usuario.id_usuario);
            const noLeidas = await notificacionService.contarNoLeidas(req.usuario.id_usuario);
            res.status(200).json({ message: 'Notificaciones', data: { lista, no_leidas: noLeidas } });
        } catch (e) {
            res.status(e.status || 500).json({ error: e.message });
        }
    }

    async patchMarcarLeida(req, res) {
        try {
            const result = await notificacionService.marcarLeida(req.params.id, req.usuario.id_usuario);
            res.status(200).json({ message: 'Marcada como leída', data: result });
        } catch (e) {
            res.status(e.status || 500).json({ error: e.message });
        }
    }

    async patchMarcarTodasLeidas(req, res) {
        try {
            await notificacionService.marcarTodasLeidas(req.usuario.id_usuario);
            res.status(200).json({ message: 'Todas marcadas como leídas' });
        } catch (e) {
            res.status(e.status || 500).json({ error: e.message });
        }
    }

    async deleteUna(req, res) {
        try {
            await notificacionService.eliminarUna(req.params.id, req.usuario.id_usuario);
            res.status(200).json({ message: 'Eliminada' });
        } catch (e) {
            res.status(e.status || 500).json({ error: e.message });
        }
    }

    async deleteTodas(req, res) {
        try {
            await notificacionService.eliminarTodas(req.usuario.id_usuario);
            res.status(200).json({ message: 'Bandeja limpiada' });
        } catch (e) {
            res.status(e.status || 500).json({ error: e.message });
        }
    }

    // Endpoint INTERNO: usado por ms-gestion para crear notificaciones
    async postCrearInterno(req, res) {
        try {
            // Validación por header secreto (configurado en .env)
            const claveRecibida = req.headers['x-internal-key'];
            if (!claveRecibida || claveRecibida !== process.env.INTERNAL_SERVICE_KEY) {
                return res.status(403).json({ error: 'Acceso interno no autorizado' });
            }

            // Soporte: una sola notificación o "para_admins" para broadcast
            if (req.body.para_admins) {
                const result = await notificacionService.crearParaAdmins(req.body);
                return res.status(201).json({ message: 'Notificaciones a admins creadas', data: result });
            }

            const result = await notificacionService.crear(req.body);
            res.status(201).json({ message: 'Notificación creada', data: result });
        } catch (e) {
            res.status(e.status || 500).json({ error: e.message });
        }
    }
}

module.exports = new NotificacionController();