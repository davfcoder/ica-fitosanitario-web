const Notificacion = require('../models/Notificacion');

class NotificacionRepository {
    async save(data) {
        return await new Notificacion(data).save();
    }

    async findByUsuario(idUsuario) {
        return await Notificacion.find({ id_usuario_destinatario: idUsuario })
            .sort({ createdAt: -1 })
            .limit(100);
    }

    async contarNoLeidas(idUsuario) {
        return await Notificacion.countDocuments({
            id_usuario_destinatario: idUsuario,
            leida: false
        });
    }

    async marcarLeida(id, idUsuario) {
        return await Notificacion.findOneAndUpdate(
            { _id: id, id_usuario_destinatario: idUsuario },
            { leida: true },
            { new: true }
        );
    }

    async marcarTodasLeidas(idUsuario) {
        return await Notificacion.updateMany(
            { id_usuario_destinatario: idUsuario, leida: false },
            { leida: true }
        );
    }

    async eliminarUna(id, idUsuario) {
        return await Notificacion.findOneAndDelete({
            _id: id,
            id_usuario_destinatario: idUsuario
        });
    }

    async eliminarTodas(idUsuario) {
        return await Notificacion.deleteMany({ id_usuario_destinatario: idUsuario });
    }
}

module.exports = new NotificacionRepository();