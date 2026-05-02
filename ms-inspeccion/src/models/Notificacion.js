const mongoose = require('mongoose');

const notificacionSchema = new mongoose.Schema({
    id_usuario_destinatario: { type: Number, required: true, index: true },
    id_usuario_remitente: { type: Number, default: null },
    nom_remitente: { type: String, default: 'Sistema' },
    tipo: { type: String, required: true },
    titulo: { type: String, required: true },
    mensaje: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ruta_destino: { type: String, default: null },
    leida: { type: Boolean, default: false, index: true }
}, {
    timestamps: true,
    collection: 'notificaciones'
});

notificacionSchema.index({ id_usuario_destinatario: 1, leida: 1, createdAt: -1 });

module.exports = mongoose.model('Notificacion', notificacionSchema);