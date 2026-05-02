const solicitudRepository = require('../repositories/solicitudInspeccionRepository');
const notificacionService = require('./notificacionService');

class SolicitudInspeccionService {

    async crearSolicitud(datos, usuarioSolicitante) {
        if (!datos.id_lugar_produccion || !datos.motivo) {
            throw { status: 400, message: 'Lugar de producción y motivo son obligatorios' };
        }

        const tieneLotes = await solicitudRepository.verificarLotesActivos(datos.id_lugar_produccion);
        if (!tieneLotes) {
            throw { status: 400, message: 'El lugar de producción no tiene lotes activos' };
        }

        const solicitud = {
            id_lugar_produccion: datos.id_lugar_produccion,
            id_usuario_solicitante: usuarioSolicitante.id_usuario,
            motivo: datos.motivo,
            observaciones_productor: datos.observaciones_productor || null
        };

        const nueva = await solicitudRepository.save(solicitud);

        // Avisar a admins de nueva solicitud pendiente
        await notificacionService.crearParaAdmins({
            id_usuario_remitente: usuarioSolicitante.id_usuario,
            tipo: 'solicitud_nueva',
            titulo: 'Nueva solicitud de inspección',
            mensaje: `${usuarioSolicitante.nombres || 'Un productor'} registró una nueva solicitud de inspección pendiente de asignación.`,
            metadata: { id_solicitud: nueva.id_solicitud },
            ruta_destino: '/admin/solicitudes'
        });

        return await solicitudRepository.findById(nueva.id_solicitud);
    }

    async listarSolicitudes(usuario) {
        switch (usuario.nom_rol) {
            case 'Administrador ICA':
                return await solicitudRepository.findAll();
            case 'Asistente Técnico':
                return await solicitudRepository.findByAsistente(usuario.id_usuario);
            case 'Productor':
                return await solicitudRepository.findBySolicitante(usuario.id_usuario);
            default:
                throw { status: 403, message: 'Rol no autorizado' };
        }
    }

    async listarPendientes() {
        return await solicitudRepository.findPendientes();
    }

    async obtenerSolicitudPorId(id) {
        const solicitud = await solicitudRepository.findById(id);
        if (!solicitud) {
            throw { status: 404, message: 'Solicitud de inspección no encontrada' };
        }
        return solicitud;
    }

    async asignarAsistente(idSolicitud, datos, usuario) {
        if (!datos.id_asistente_asignado || !datos.fec_programada) {
            throw { status: 400, message: 'Asistente técnico y fecha programada son obligatorios' };
        }

        const solicitud = await solicitudRepository.findById(idSolicitud);
        if (!solicitud) {
            throw { status: 404, message: 'Solicitud no encontrada' };
        }

        if (solicitud.estado !== 'pendiente') {
            throw { status: 400, message: `No se puede asignar: el estado actual es '${solicitud.estado}'` };
        }

        const hoy = new Date().setHours(0, 0, 0, 0);
        if (new Date(datos.fec_programada.replace(/-/g, '/')) < hoy) {
            throw { status: 400, message: 'La fecha programada no puede ser en el pasado' };
        }

        const conflictos = await solicitudRepository.findByAsistenteYFecha(
            datos.id_asistente_asignado, datos.fec_programada
        );
        if (conflictos.length > 0) {
            throw { status: 409, message: 'El asistente ya tiene una inspección asignada para esa fecha. Seleccione otra fecha u otro asistente.' };
        }

        // PERSISTIR la asignación
        await solicitudRepository.asignarAsistente(idSolicitud, datos.id_asistente_asignado, datos.fec_programada);

        // Releer con datos enriquecidos para usar en notificaciones
        const sol = await solicitudRepository.findById(idSolicitud);

        // Notificar al asistente
        await notificacionService.crear({
            id_usuario_destinatario: datos.id_asistente_asignado,
            id_usuario_remitente: usuario ? usuario.id_usuario : null,
            tipo: 'inspeccion_asignada',
            titulo: 'Nueva inspección asignada',
            mensaje: `Se le asignó la inspección de ${sol.nom_lugar_produccion} para el ${datos.fec_programada}`,
            metadata: { id_solicitud: idSolicitud, fec_programada: datos.fec_programada },
            ruta_destino: '/asistente'
        });

        // Notificar al productor
        await notificacionService.crear({
            id_usuario_destinatario: sol.id_usuario_solicitante,
            id_usuario_remitente: usuario ? usuario.id_usuario : null,
            tipo: 'solicitud_asignada',
            titulo: 'Inspección programada',
            mensaje: `Su solicitud para ${sol.nom_lugar_produccion} fue asignada y programada para el ${datos.fec_programada}`,
            metadata: { id_solicitud: idSolicitud },
            ruta_destino: '/productor/inspecciones'
        });

        return sol;
    }

    async reasignarSolicitud(idSolicitud, datos, usuario) {
        const solicitud = await solicitudRepository.findById(idSolicitud);
        if (!solicitud) {
            throw { status: 404, message: 'Solicitud no encontrada' };
        }

        if (solicitud.estado !== 'asignada') {
            throw { status: 400, message: `Solo se puede reasignar solicitudes en estado 'asignada'. Estado actual: '${solicitud.estado}'` };
        }

        if (!datos.id_asistente_asignado || !datos.fec_programada) {
            throw { status: 400, message: 'Asistente y fecha programada son obligatorios' };
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        if (new Date(datos.fec_programada.replace(/-/g, '/')) < hoy) {
            throw { status: 400, message: 'La fecha programada no puede ser en el pasado' };
        }

        const conflictos = await solicitudRepository.findByAsistenteYFecha(
            datos.id_asistente_asignado, datos.fec_programada
        );
        const conflictoReal = conflictos.filter(c => c.id_solicitud !== Number(idSolicitud));
        if (conflictoReal.length > 0) {
            throw { status: 409, message: 'El asistente ya tiene una inspección asignada para esa fecha' };
        }

        await solicitudRepository.asignarAsistente(idSolicitud, datos.id_asistente_asignado, datos.fec_programada);

        const sol = await solicitudRepository.findById(idSolicitud);

        // Notificar nuevo asistente
        await notificacionService.crear({
            id_usuario_destinatario: datos.id_asistente_asignado,
            id_usuario_remitente: usuario ? usuario.id_usuario : null,
            tipo: 'inspeccion_asignada',
            titulo: 'Inspección reasignada a usted',
            mensaje: `Se le reasignó la inspección de ${sol.nom_lugar_produccion} para el ${datos.fec_programada}`,
            metadata: { id_solicitud: idSolicitud },
            ruta_destino: '/asistente'
        });

        // Notificar al productor del cambio
        await notificacionService.crear({
            id_usuario_destinatario: sol.id_usuario_solicitante,
            id_usuario_remitente: usuario ? usuario.id_usuario : null,
            tipo: 'solicitud_asignada',
            titulo: 'Inspección reprogramada',
            mensaje: `Su inspección de ${sol.nom_lugar_produccion} fue reasignada y programada para el ${datos.fec_programada}`,
            metadata: { id_solicitud: idSolicitud },
            ruta_destino: '/productor/inspecciones'
        });

        return sol;
    }

    async iniciarInspeccion(idSolicitud, usuario) {
        const solicitud = await solicitudRepository.findById(idSolicitud);
        if (!solicitud) {
            throw { status: 404, message: 'Solicitud no encontrada' };
        }
        if (solicitud.estado !== 'asignada') {
            throw { status: 400, message: `No se puede iniciar: el estado actual es '${solicitud.estado}'` };
        }

        if (solicitud.id_asistente_asignado !== usuario.id_usuario) {
            throw { status: 403, message: 'Solo el asistente asignado puede iniciar esta inspección' };
        }

        const hoy = new Date().setHours(0, 0, 0, 0);
        const fechaProg = new Date(solicitud.fec_programada);
        fechaProg.setHours(0, 0, 0, 0);
        if (hoy < fechaProg) {
            throw { status: 400, message: `No puede iniciar antes de la fecha programada (${fechaProg.toLocaleDateString('es-CO')})` };
        }

        await solicitudRepository.updateEstado(idSolicitud, 'en_proceso');
        return await solicitudRepository.findById(idSolicitud);
    }

    async completarInspeccion(idSolicitud, usuario) {
        const solicitud = await solicitudRepository.findById(idSolicitud);
        if (!solicitud) {
            throw { status: 404, message: 'Solicitud no encontrada' };
        }
        if (solicitud.estado !== 'en_proceso') {
            throw { status: 400, message: `No se puede completar: el estado actual es '${solicitud.estado}'` };
        }

        if (solicitud.id_asistente_asignado !== usuario.id_usuario) {
            throw { status: 403, message: 'Solo el asistente asignado puede completar esta inspección' };
        }

        await solicitudRepository.updateEstado(idSolicitud, 'completada');

        const sol = await solicitudRepository.findById(idSolicitud);

        await notificacionService.crear({
            id_usuario_destinatario: sol.id_usuario_solicitante,
            id_usuario_remitente: usuario.id_usuario,
            tipo: 'inspeccion_completada',
            titulo: 'Inspección completada',
            mensaje: `La inspección de ${sol.nom_lugar_produccion} ha sido completada. Ya puede consultar los resultados.`,
            metadata: { id_solicitud: idSolicitud },
            ruta_destino: '/productor/reportes'
        });

        return sol;
    }

    async cancelarSolicitud(idSolicitud, datos, usuario) {
        const solicitud = await solicitudRepository.findById(idSolicitud);
        if (!solicitud) {
            throw { status: 404, message: 'Solicitud no encontrada' };
        }

        if (solicitud.estado === 'completada' || solicitud.estado === 'cancelada') {
            throw { status: 400, message: `No se puede cancelar: el estado actual es '${solicitud.estado}'` };
        }

        if (!datos.observaciones || !datos.observaciones.trim()) {
            throw { status: 400, message: 'Debe indicar el motivo de la cancelación' };
        }

        await solicitudRepository.cancelarSolicitud(idSolicitud, datos.observaciones);

        const sol = await solicitudRepository.findById(idSolicitud);

        // Notificar al productor
        await notificacionService.crear({
            id_usuario_destinatario: sol.id_usuario_solicitante,
            id_usuario_remitente: usuario ? usuario.id_usuario : null,
            tipo: 'solicitud_cancelada',
            titulo: 'Solicitud de inspección cancelada',
            mensaje: `Su solicitud para ${sol.nom_lugar_produccion} fue cancelada. Motivo: ${datos.observaciones}`,
            metadata: { id_solicitud: idSolicitud },
            ruta_destino: '/productor/inspecciones'
        });

        // Notificar al asistente si estaba asignado
        if (sol.id_asistente_asignado) {
            await notificacionService.crear({
                id_usuario_destinatario: sol.id_asistente_asignado,
                id_usuario_remitente: usuario ? usuario.id_usuario : null,
                tipo: 'inspeccion_cancelada',
                titulo: 'Inspección cancelada',
                mensaje: `La inspección de ${sol.nom_lugar_produccion} fue cancelada`,
                metadata: { id_solicitud: idSolicitud },
                ruta_destino: '/asistente'
            });
        }

        return sol;
    }

    async marcarInconclusa(idSolicitud, datos, usuario) {
        const solicitud = await solicitudRepository.findById(idSolicitud);
        if (!solicitud) {
            throw { status: 404, message: 'Solicitud no encontrada' };
        }

        if (solicitud.estado !== 'en_proceso') {
            throw { status: 400, message: `No se puede marcar como inconclusa: el estado actual es '${solicitud.estado}'` };
        }

        if (solicitud.id_asistente_asignado !== usuario.id_usuario) {
            throw { status: 403, message: 'Solo el asistente asignado puede realizar esta acción' };
        }

        if (!datos.observaciones || !datos.observaciones.trim()) {
            throw { status: 400, message: 'Debe indicar el motivo por el cual la inspección queda inconclusa' };
        }

        await solicitudRepository.marcarInconclusa(idSolicitud, datos.observaciones);

        const sol = await solicitudRepository.findById(idSolicitud);

        // Productor
        await notificacionService.crear({
            id_usuario_destinatario: sol.id_usuario_solicitante,
            id_usuario_remitente: usuario.id_usuario,
            tipo: 'inspeccion_inconclusa',
            titulo: 'Inspección marcada como inconclusa',
            mensaje: `La inspección de ${sol.nom_lugar_produccion} fue marcada como inconclusa. Motivo: ${datos.observaciones}`,
            metadata: { id_solicitud: idSolicitud },
            ruta_destino: '/productor/inspecciones'
        });

        // Admins
        await notificacionService.crearParaAdmins({
            id_usuario_remitente: usuario.id_usuario,
            tipo: 'inspeccion_inconclusa_admin',
            titulo: 'Inspección marcada como inconclusa',
            mensaje: `Una inspección de ${sol.nom_lugar_produccion} fue marcada como inconclusa por el asistente.`,
            metadata: { id_solicitud: idSolicitud },
            ruta_destino: '/admin/solicitudes'
        });

        return sol;
    }

    async obtenerContadores() {
        const pendientes = await solicitudRepository.contarPorEstado('pendiente');
        const asignadas = await solicitudRepository.contarPorEstado('asignada');
        const enProceso = await solicitudRepository.contarPorEstado('en_proceso');
        const completadas = await solicitudRepository.contarPorEstado('completada');
        const canceladas = await solicitudRepository.contarPorEstado('cancelada');
        const inconclusas = await solicitudRepository.contarPorEstado('inconclusa');

        return { pendientes, asignadas, en_proceso: enProceso, completadas, canceladas, inconclusas };
    }
}

module.exports = new SolicitudInspeccionService();