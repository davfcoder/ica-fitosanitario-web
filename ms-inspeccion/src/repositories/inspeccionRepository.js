const InspeccionFitosanitaria = require('../models/InspeccionFitosanitaria');

class InspeccionRepository {

    async save(inspeccion) {
        const nuevaInspeccion = new InspeccionFitosanitaria(inspeccion);
        return await nuevaInspeccion.save();
    }

    async findById(id) {
        return await InspeccionFitosanitaria.findById(id);
    }

    async findByIdSolicitud(idSolicitud) {
        return await InspeccionFitosanitaria.find({ id_solicitud: idSolicitud })
            .sort({ fec_inspeccion: -1 });
    }

    async findByIdLote(idLote) {
        return await InspeccionFitosanitaria.find({ id_lote: idLote })
            .sort({ fec_inspeccion: -1 });
    }

    async findByAsistente(idAsistente) {
        return await InspeccionFitosanitaria.find({ id_usuario_asistente: idAsistente })
            .sort({ fec_inspeccion: -1 });
    }

    async findByLugarProduccion(idLugar) {
        return await InspeccionFitosanitaria.find({ id_lugar_produccion: idLugar })
            .sort({ fec_inspeccion: -1 });
    }

    async findByFechaEntre(fechaInicio, fechaFin) {
        return await InspeccionFitosanitaria.find({
            fec_inspeccion: {
                $gte: new Date(fechaInicio),
                $lte: new Date(fechaFin)
            }
        }).sort({ fec_inspeccion: -1 });
    }

    async update(id, datos) {
        return await InspeccionFitosanitaria.findByIdAndUpdate(id, datos, { new: true });
    }

    async findByLoteYSolicitud(idLote, idSolicitud) {
        return await InspeccionFitosanitaria.findOne({
            id_lote: idLote,
            id_solicitud: idSolicitud
        });
    }
    
    async findConFiltros(filtros) {
        const query = {};

        if (filtros.id_lugar_produccion) {
            query.id_lugar_produccion = Number(filtros.id_lugar_produccion);
        }
        if (filtros.id_lote) {
            query.id_lote = Number(filtros.id_lote);
        }
        if (filtros.id_usuario_asistente) {
            query.id_usuario_asistente = Number(filtros.id_usuario_asistente);
        }
        if (filtros.id_plaga) {
            query['hallazgos_plagas.id_plaga'] = Number(filtros.id_plaga);
        }
        if (filtros.fecha_inicio && filtros.fecha_fin) {
            query.fec_inspeccion = {
                $gte: new Date(filtros.fecha_inicio),
                $lte: new Date(filtros.fecha_fin)
            };
        }

        return await InspeccionFitosanitaria.find(query).sort({ fec_inspeccion: -1 });
    }

    // Contar inspecciones totales
    async contarTodas() {
        return await InspeccionFitosanitaria.countDocuments();
    }

    // Contar inspecciones del mes actual
    async contarDelMes() {
        const inicioMes = new Date();
        inicioMes.setDate(1);
        inicioMes.setHours(0, 0, 0, 0);

        return await InspeccionFitosanitaria.countDocuments({
            fec_inspeccion: { $gte: inicioMes }
        });
    }
}

module.exports = new InspeccionRepository();