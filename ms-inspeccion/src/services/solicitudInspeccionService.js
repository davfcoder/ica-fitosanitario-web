const solicitudRepository = require('../repositories/solicitudInspeccionRepository');

class SolicitudInspeccionService {

    async crearSolicitud(datos, usuarioSolicitante) {
        if (!datos.id_lugar_produccion || !datos.motivo) {
            throw { status: 400, message: 'Lugar de producción y motivo son obligatorios' };
        }

        // Verificar que el lugar tenga lotes activos
        const tieneLotes = await solicitudRepository.verificarLotesActivos(datos.id_lugar_produccion);
        if (!tieneLotes) {
            throw { status: 400, message: 'El lugar de producción no tiene lotes activos' };
        }

        const solicitud = {
            id_lugar_produccion: datos.id_lugar_produccion,
            id_usuario_solicitante: usuarioSolicitante.id_usuario,
            motivo: datos.motivo
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

        // Validar fecha programada no sea pasada
        if (new Date(datos.fec_programada) < new Date().setHours(0, 0, 0, 0)) {
            throw { status: 400, message: 'La fecha programada no puede ser en el pasado' };
        }

        await solicitudRepository.asignarAsistente(idSolicitud, datos.id_asistente_asignado, datos.fec_programada);
        return await solicitudRepository.findById(idSolicitud);
    }

    async iniciarInspeccion(idSolicitud) {
        const solicitud = await solicitudRepository.findById(idSolicitud);
        if (!solicitud) {
            throw { status: 404, message: 'Solicitud no encontrada' };
        }
        if (solicitud.estado !== 'asignada') {
            throw { status: 400, message: `No se puede iniciar: el estado actual es '${solicitud.estado}'` };
        }

        await solicitudRepository.updateEstado(idSolicitud, 'en_proceso');
        return await solicitudRepository.findById(idSolicitud);
    }

    async completarInspeccion(idSolicitud) {
        const solicitud = await solicitudRepository.findById(idSolicitud);
        if (!solicitud) {
            throw { status: 404, message: 'Solicitud no encontrada' };
        }
        if (solicitud.estado !== 'en_proceso') {
            throw { status: 400, message: `No se puede completar: el estado actual es '${solicitud.estado}'` };
        }

        await solicitudRepository.updateEstado(idSolicitud, 'completada');
        return await solicitudRepository.findById(idSolicitud);
    }

    async obtenerContadores() {
        const pendientes = await solicitudRepository.contarPorEstado('pendiente');
        const asignadas = await solicitudRepository.contarPorEstado('asignada');
        const enProceso = await solicitudRepository.contarPorEstado('en_proceso');
        const completadas = await solicitudRepository.contarPorEstado('completada');

        return { pendientes, asignadas, en_proceso: enProceso, completadas };
    }
}

module.exports = new SolicitudInspeccionService();