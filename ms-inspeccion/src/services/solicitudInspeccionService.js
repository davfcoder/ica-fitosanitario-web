const solicitudRepository = require('../repositories/solicitudInspeccionRepository');

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

    async asignarAsistente(idSolicitud, datos) {
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

        // Fecha programada no puede ser pasada
        const hoy = new Date().setHours(0, 0, 0, 0);
        if (new Date(datos.fec_programada.replace(/-/g, '/')) < hoy) {
            throw { status: 400, message: 'La fecha programada no puede ser en el pasado' };
        }

        // Verificar que el asistente no tenga otra solicitud ese día
        const conflictos = await solicitudRepository.findByAsistenteYFecha(
            datos.id_asistente_asignado, datos.fec_programada
        );
        if (conflictos.length > 0) {
            throw { status: 409, message: 'El asistente ya tiene una inspección asignada para esa fecha. Seleccione otra fecha u otro asistente.' };
        }

        await solicitudRepository.asignarAsistente(idSolicitud, datos.id_asistente_asignado, datos.fec_programada);
        return await solicitudRepository.findById(idSolicitud);
    }

    // Admin reasigna asistente o fecha
    async reasignarSolicitud(idSolicitud, datos) {
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
        if (new Date(datos.fec_programada) < hoy) {
            throw { status: 400, message: 'La fecha programada no puede ser en el pasado' };
        }

        // Verificar disponibilidad del asistente (excluyendo esta misma solicitud)
        const conflictos = await solicitudRepository.findByAsistenteYFecha(
            datos.id_asistente_asignado, datos.fec_programada
        );
        const conflictoReal = conflictos.filter(c => c.id_solicitud !== Number(idSolicitud));
        if (conflictoReal.length > 0) {
            throw { status: 409, message: 'El asistente ya tiene una inspección asignada para esa fecha' };
        }

        await solicitudRepository.asignarAsistente(idSolicitud, datos.id_asistente_asignado, datos.fec_programada);
        return await solicitudRepository.findById(idSolicitud);
    }

    async iniciarInspeccion(idSolicitud, usuario) {
        const solicitud = await solicitudRepository.findById(idSolicitud);
        if (!solicitud) {
            throw { status: 404, message: 'Solicitud no encontrada' };
        }
        if (solicitud.estado !== 'asignada') {
            throw { status: 400, message: `No se puede iniciar: el estado actual es '${solicitud.estado}'` };
        }

        // Validar que el asistente asignado es quien inicia
        if (solicitud.id_asistente_asignado !== usuario.id_usuario) {
            throw { status: 403, message: 'Solo el asistente asignado puede iniciar esta inspección' };
        }

        // No se puede iniciar antes de la fecha programada
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
        return await solicitudRepository.findById(idSolicitud);
    }

    // Admin cancela solicitud
    async cancelarSolicitud(idSolicitud, datos) {
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
        return await solicitudRepository.findById(idSolicitud);
    }

    // Asistente marca como inconclusa
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
        return await solicitudRepository.findById(idSolicitud);
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