const notificacionRepository = require('../repositories/notificacionRepository');
const pool = require('../config/mysqlDatabase');

class NotificacionService {

    async crear(datos) {
        // datos: { id_usuario_destinatario, id_usuario_remitente, tipo, titulo, mensaje, metadata, ruta_destino }
        if (!datos.id_usuario_destinatario || !datos.tipo || !datos.titulo || !datos.mensaje) {
            throw { status: 400, message: 'Datos de notificación incompletos' };
        }

        // Resolver nom_remitente si viene id_usuario_remitente
        let nom_remitente = 'Sistema';
        if (datos.id_usuario_remitente) {
            const [rows] = await pool.execute(
                `SELECT nombres, apellidos FROM Usuarios WHERE id_usuario = ?`,
                [datos.id_usuario_remitente]
            );
            if (rows.length > 0) {
                nom_remitente = `${rows[0].nombres} ${rows[0].apellidos}`.trim();
            }
        }

        return await notificacionRepository.save({
            ...datos,
            nom_remitente
        });
    }

    // Notificar a TODOS los administradores ICA (rol = 1)
    async crearParaAdmins(datos) {
        const [admins] = await pool.execute(
            `SELECT id_usuario FROM Usuarios WHERE id_rol = 1`
        );
        const promesas = admins.map(a => this.crear({
            ...datos,
            id_usuario_destinatario: a.id_usuario
        }));
        return await Promise.all(promesas);
    }

    async listarMisNotificaciones(idUsuario) {
        return await notificacionRepository.findByUsuario(idUsuario);
    }

    async contarNoLeidas(idUsuario) {
        return await notificacionRepository.contarNoLeidas(idUsuario);
    }

    async marcarLeida(id, idUsuario) {
        const result = await notificacionRepository.marcarLeida(id, idUsuario);
        if (!result) throw { status: 404, message: 'Notificación no encontrada' };
        return result;
    }

    async marcarTodasLeidas(idUsuario) {
        return await notificacionRepository.marcarTodasLeidas(idUsuario);
    }

    async eliminarUna(id, idUsuario) {
        const result = await notificacionRepository.eliminarUna(id, idUsuario);
        if (!result) throw { status: 404, message: 'Notificación no encontrada' };
        return result;
    }

    async eliminarTodas(idUsuario) {
        return await notificacionRepository.eliminarTodas(idUsuario);
    }
}

module.exports = new NotificacionService();