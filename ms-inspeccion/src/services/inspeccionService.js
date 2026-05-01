const inspeccionRepository = require('../repositories/inspeccionRepository');
const solicitudInspeccionRepository = require('../repositories/solicitudInspeccionRepository');

class InspeccionService {

    async registrarInspeccion(datos, usuario) {
        // 1. Validar campos obligatorios
        const camposObligatorios = ['id_solicitud', 'id_lote', 'id_lugar_produccion',
                                     'estado_fenologico', 'cantidad_plantas_evaluadas'];
        for (const campo of camposObligatorios) {
            if (!datos[campo] && datos[campo] !== 0) {
                throw { status: 400, message: `El campo '${campo}' es obligatorio` };
            }
        }

        // 2. Validar que la solicitud exista y esté asignada al asistente
        const solicitud = await solicitudInspeccionRepository.findById(datos.id_solicitud);
        if (!solicitud) {
            throw { status: 404, message: 'Solicitud de inspección no encontrada' };
        }

        if (solicitud.id_asistente_asignado !== usuario.id_usuario) {
            throw { status: 403, message: 'Esta solicitud no está asignada a usted' };
        }

        if (solicitud.estado !== 'asignada' && solicitud.estado !== 'en_proceso') {
            throw { status: 400, message: `No se puede registrar: el estado de la solicitud es '${solicitud.estado}'` };
        }

        // 3. Si la solicitud está asignada, cambiar a en_proceso
        if (solicitud.estado === 'asignada') {
            await solicitudInspeccionRepository.updateEstado(datos.id_solicitud, 'en_proceso');
        }

        // 4. Calcular porcentaje de infestación para cada hallazgo
        if (datos.hallazgos_plagas && datos.hallazgos_plagas.length > 0) {
            datos.hallazgos_plagas = datos.hallazgos_plagas.map(hallazgo => {
                const porcentaje = (hallazgo.cantidad_plantas_infestadas / datos.cantidad_plantas_evaluadas) * 100;
                return {
                    ...hallazgo,
                    porcentaje_infestacion: Math.round(porcentaje * 100) / 100
                };
            });
        }

        // 5. Construir documento de inspección
        const inspeccion = {
            id_solicitud: datos.id_solicitud,
            id_lote: datos.id_lote,
            id_lugar_produccion: datos.id_lugar_produccion,
            id_usuario_asistente: usuario.id_usuario,
            nom_asistente: `${usuario.nombres || ''} ${usuario.apellidos || ''}`.trim() || 'Asistente',
            fec_inspeccion: datos.fec_inspeccion || new Date(),
            estado_fenologico: datos.estado_fenologico,
            cantidad_plantas_evaluadas: datos.cantidad_plantas_evaluadas,
            observaciones: datos.observaciones || '',
            evidencias_fotograficas: datos.evidencias_fotograficas || [],
            hallazgos_plagas: datos.hallazgos_plagas || [],
            // Datos desnormalizados
            nom_lugar_produccion: datos.nom_lugar_produccion || '',
            numero_lote: datos.numero_lote || '',
            nom_especie: datos.nom_especie || '',
            nom_variedad: datos.nom_variedad || ''
        };

        return await inspeccionRepository.save(inspeccion);
    }

    async actualizarInspeccion(id, datos, usuario) {
        const inspeccion = await inspeccionRepository.findById(id);
        if (!inspeccion) {
            throw { status: 404, message: 'Inspección no encontrada' };
        }

        if (inspeccion.id_usuario_asistente !== usuario.id_usuario) {
            throw { status: 403, message: 'Solo el asistente que registró la inspección puede editarla' };
        }

        // Verificar que la solicitud siga en proceso
        const solicitud = await solicitudInspeccionRepository.findById(inspeccion.id_solicitud);
        if (solicitud && solicitud.estado === 'completada') {
            throw { status: 400, message: 'No se puede editar: la inspección ya fue completada' };
        }

        // Recalcular porcentajes
        if (datos.hallazgos_plagas && datos.cantidad_plantas_evaluadas) {
            datos.hallazgos_plagas = datos.hallazgos_plagas.map(h => ({
                ...h,
                porcentaje_infestacion: Math.round((h.cantidad_plantas_infestadas / datos.cantidad_plantas_evaluadas) * 10000) / 100
            }));
        }

        return await inspeccionRepository.update(id, {
            estado_fenologico: datos.estado_fenologico,
            cantidad_plantas_evaluadas: datos.cantidad_plantas_evaluadas,
            observaciones: datos.observaciones,
            hallazgos_plagas: datos.hallazgos_plagas,
            evidencias_fotograficas: datos.evidencias_fotograficas
        });
    }

    async obtenerInspeccionPorLoteYSolicitud(idLote, idSolicitud) {
        return await inspeccionRepository.findByLoteYSolicitud(idLote, idSolicitud);
    }

    async obtenerInspeccionPorId(id) {
        const inspeccion = await inspeccionRepository.findById(id);
        if (!inspeccion) {
            throw { status: 404, message: 'Inspección no encontrada' };
        }
        return inspeccion;
    }

    async listarInspeccionesPorSolicitud(idSolicitud) {
        return await inspeccionRepository.findByIdSolicitud(idSolicitud);
    }

    async listarInspeccionesPorLote(idLote) {
        return await inspeccionRepository.findByIdLote(idLote);
    }

    async generarReporte(filtros, usuario) {
        // Aplicar restricciones según rol
        if (usuario.nom_rol === 'Asistente Técnico') {
            filtros.id_usuario_asistente = usuario.id_usuario;
        }

        const inspecciones = await inspeccionRepository.findConFiltros(filtros);

        // Consolidar estadísticas
        let totalPlantas = 0;
        let totalInfestadas = 0;
        const plagasResumen = {};

        inspecciones.forEach(insp => {
            totalPlantas += insp.cantidad_plantas_evaluadas;
            insp.hallazgos_plagas.forEach(h => {
                totalInfestadas += h.cantidad_plantas_infestadas;
                if (!plagasResumen[h.nom_plaga || h.id_plaga]) {
                    plagasResumen[h.nom_plaga || h.id_plaga] = {
                        nombre: h.nom_plaga || `Plaga ID: ${h.id_plaga}`,
                        total_plantas_infestadas: 0,
                        apariciones: 0
                    };
                }
                plagasResumen[h.nom_plaga || h.id_plaga].total_plantas_infestadas += h.cantidad_plantas_infestadas;
                plagasResumen[h.nom_plaga || h.id_plaga].apariciones += 1;
            });
        });

        return {
            total_inspecciones: inspecciones.length,
            total_plantas_evaluadas: totalPlantas,
            total_plantas_infestadas: totalInfestadas,
            porcentaje_infestacion_general: totalPlantas > 0 
                ? Math.round((totalInfestadas / totalPlantas) * 10000) / 100 
                : 0,
            resumen_plagas: Object.values(plagasResumen),
            inspecciones: inspecciones
        };
    }

    async obtenerEstadisticas() {
        const totalInspecciones = await inspeccionRepository.contarTodas();
        const inspeccionesMes = await inspeccionRepository.contarDelMes();

        return {
            total_inspecciones: totalInspecciones,
            inspecciones_mes: inspeccionesMes
        };
    }
}

module.exports = new InspeccionService();