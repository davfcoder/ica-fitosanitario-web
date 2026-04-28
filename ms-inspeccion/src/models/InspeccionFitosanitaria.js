const mongoose = require('mongoose');

// Subdocumento: Hallazgo de plaga
const hallazgoPlagaSchema = new mongoose.Schema({
    id_plaga: {
        type: Number,
        required: true
    },
    nom_plaga: {
        type: String,
        required: true
    },
    cantidad_plantas_infestadas: {
        type: Number,
        required: true,
        min: 0
    },
    porcentaje_infestacion: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    }
}, { _id: false });

// Documento principal: Inspección Fitosanitaria
const inspeccionFitosanitariaSchema = new mongoose.Schema({
    id_solicitud: {
        type: Number,
        required: true
    },
    id_lote: {
        type: Number,
        required: true
    },
    id_lugar_produccion: {
        type: Number,
        required: true
    },
    id_usuario_asistente: {
        type: Number,
        required: true
    },
    nom_asistente: {
        type: String,
        required: true
    },
    fec_inspeccion: {
        type: Date,
        required: true,
        default: Date.now
    },
    estado_fenologico: {
        type: String,
        required: true,
        enum: ['Germinacion', 'Desarrollo vegetativo', 'Floracion', 'Fructificacion', 'Maduracion', 'Cosecha', 'Reposo']
    },
    cantidad_plantas_evaluadas: {
        type: Number,
        required: true,
        min: 1
    },
    observaciones: {
        type: String,
        default: ''
    },
    evidencias_fotograficas: {
        type: [String],
        default: []
    },
    hallazgos_plagas: {
        type: [hallazgoPlagaSchema],
        default: []
    },
    // Datos desnormalizados para reportes rápidos
    nom_lugar_produccion: String,
    numero_lote: String,
    nom_especie: String,
    nom_variedad: String
}, {
    timestamps: true,
    collection: 'inspecciones'
});

// Índices para consultas frecuentes
inspeccionFitosanitariaSchema.index({ id_lote: 1 });
inspeccionFitosanitariaSchema.index({ id_solicitud: 1 });
inspeccionFitosanitariaSchema.index({ id_usuario_asistente: 1 });
inspeccionFitosanitariaSchema.index({ id_lugar_produccion: 1 });
inspeccionFitosanitariaSchema.index({ fec_inspeccion: -1 });

module.exports = mongoose.model('InspeccionFitosanitaria', inspeccionFitosanitariaSchema);