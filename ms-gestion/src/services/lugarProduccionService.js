const lugarProduccionRepository = require('../repositories/lugarProduccionRepository');
const predioRepository = require('../repositories/predioRepository');
const usuarioRepository = require('../repositories/usuarioRepository');

class LugarProduccionService {

    // Productor crea solicitud de lugar de producción
    async crearSolicitud(datos, usuarioSolicitante) {
        if (!datos.nom_lugar_produccion) {
            throw { status: 400, message: 'El nombre del lugar de producción es obligatorio' };
        }

        if (!datos.predios_ids || !Array.isArray(datos.predios_ids) || datos.predios_ids.length === 0) {
            throw { status: 400, message: 'Debe indicar al menos un predio para el lugar de producción' };
        }

        // Validar que los predios existen y están disponibles
        for (const idPredio of datos.predios_ids) {
            const predio = await predioRepository.findById(idPredio);
            if (!predio) {
                throw { status: 404, message: `El predio con ID ${idPredio} no existe` };
            }
            if (predio.id_lugar_produccion) {
                throw { status: 409, message: `El predio '${predio.nom_predio}' ya está asociado a otro lugar de producción` };
            }
        }

        // Crear lugar con estado pendiente
        const nuevoLugar = await lugarProduccionRepository.save({
            nom_lugar_produccion: datos.nom_lugar_produccion,
            id_usuario_productor: usuarioSolicitante.id_usuario,
            estado: 'pendiente'
        });

        // Vincular predios al lugar
        for (const idPredio of datos.predios_ids) {
            await predioRepository.updateLugarProduccion(idPredio, nuevoLugar.id_lugar_produccion);
        }

        return await lugarProduccionRepository.findById(nuevoLugar.id_lugar_produccion);
    }

    // Productor corrige solicitud devuelta
    async corregirSolicitud(id, datos, usuarioSolicitante) {
        const lugar = await lugarProduccionRepository.findById(id);
        if (!lugar) {
            throw { status: 404, message: 'Lugar de producción no encontrado' };
        }

        // Verificar que el lugar pertenece al productor
        if (lugar.id_usuario_productor !== usuarioSolicitante.id_usuario) {
            throw { status: 403, message: 'No tiene permisos para modificar este lugar de producción' };
        }

        // Solo puede corregir si está devuelto
        if (lugar.estado !== 'devuelto') {
            throw { status: 400, message: `No se puede corregir: el estado actual es '${lugar.estado}'` };
        }

        if (!datos.nom_lugar_produccion) {
            throw { status: 400, message: 'El nombre del lugar de producción es obligatorio' };
        }

        if (!datos.predios_ids || !Array.isArray(datos.predios_ids) || datos.predios_ids.length === 0) {
            throw { status: 400, message: 'Debe indicar al menos un predio para el lugar de producción' };
        }

        // Obtener predios actuales del lugar para desvincular los anteriores
        const prediosActuales = await lugarProduccionRepository.getPredios(id);
        for (const predio of prediosActuales) {
            await predioRepository.updateLugarProduccion(predio.id_predio, null);
        }

        // Validar y vincular los nuevos predios
        for (const idPredio of datos.predios_ids) {
            const predio = await predioRepository.findById(idPredio);
            if (!predio) {
                throw { status: 404, message: `El predio con ID ${idPredio} no existe` };
            }
            if (predio.id_lugar_produccion && Number(predio.id_lugar_produccion) !== Number(id)) {
                throw { status: 409, message: `El predio '${predio.nom_predio}' ya está asociado a otro lugar de producción` };
            }
            await predioRepository.updateLugarProduccion(idPredio, id);
        }

        // Actualizar el lugar a estado pendiente
        await lugarProduccionRepository.updateEstado(id, 'pendiente', null, null);
        await lugarProduccionRepository.updateNombre(id, datos.nom_lugar_produccion);

        return await lugarProduccionRepository.findById(id);
    }

    async listarLugares() {
        return await lugarProduccionRepository.findAll();
    }

    async listarLugaresPorProductor(idProductor) {
        return await lugarProduccionRepository.findByProductor(idProductor);
    }

    async listarSolicitudesPendientes() {
        return await lugarProduccionRepository.findByEstado('pendiente');
    }

    async obtenerLugarPorId(id) {
        const lugar = await lugarProduccionRepository.findById(id);
        if (!lugar) {
            throw { status: 404, message: 'Lugar de producción no encontrado' };
        }

        // Obtener predios asociados
        const predios = await predioRepository.findByIdLugar(id);
        lugar.predios = predios;

        return lugar;
    }

    // Admin aprueba solicitud
    async aprobarSolicitud(id, datos) {
        const lugar = await lugarProduccionRepository.findById(id);
        if (!lugar) {
            throw { status: 404, message: 'Lugar de producción no encontrado' };
        }

        if (lugar.estado !== 'pendiente' && lugar.estado !== 'devuelto') {
            throw { status: 400, message: `No se puede aprobar: el estado actual es '${lugar.estado}'` };
        }

        if (!datos.nro_registro_ica) {
            throw { status: 400, message: 'El número de registro ICA es obligatorio para aprobar' };
        }

        await lugarProduccionRepository.updateEstado(id, 'aprobado', datos.observaciones, datos.nro_registro_ica);
        return await lugarProduccionRepository.findById(id);
    }

    // Admin rechaza solicitud
    async rechazarSolicitud(id, datos) {
        const lugar = await lugarProduccionRepository.findById(id);
        if (!lugar) {
            throw { status: 404, message: 'Lugar de producción no encontrado' };
        }

        if (lugar.estado !== 'pendiente') {
            throw { status: 400, message: `No se puede rechazar: el estado actual es '${lugar.estado}'` };
        }

        if (!datos.observaciones) {
            throw { status: 400, message: 'Debe indicar el motivo del rechazo en observaciones' };
        }

        await lugarProduccionRepository.updateEstado(id, 'rechazado', datos.observaciones, null);
        return await lugarProduccionRepository.findById(id);
    }

    // Admin devuelve para correcciones
    async devolverSolicitud(id, datos) {
        const lugar = await lugarProduccionRepository.findById(id);
        if (!lugar) {
            throw { status: 404, message: 'Lugar de producción no encontrado' };
        }

        if (lugar.estado !== 'pendiente') {
            throw { status: 400, message: `No se puede devolver: el estado actual es '${lugar.estado}'` };
        }

        if (!datos.observaciones) {
            throw { status: 400, message: 'Debe indicar las observaciones para corrección' };
        }

        await lugarProduccionRepository.updateEstado(id, 'devuelto', datos.observaciones, null);
        return await lugarProduccionRepository.findById(id);
    }

    async eliminarLugar(id) {
        const lugar = await lugarProduccionRepository.findById(id);
        if (!lugar) {
            throw { status: 404, message: 'Lugar de producción no encontrado' };
        }

        const tieneLotes = await lugarProduccionRepository.tieneLotes(id);
        if (tieneLotes) {
            throw { status: 409, message: 'No se puede eliminar: tiene lotes asociados' };
        }

        // Desvincular predios primero
        const predios = await predioRepository.findByIdLugar(id);
        for (const predio of predios) {
            await predioRepository.updateLugarProduccion(predio.id_predio, null);
        }

        return await lugarProduccionRepository.delete(id);
    }

    async calcularAreaTotalUnificada(id) {
        const predios = await predioRepository.findByIdLugar(id);
        return predios.reduce((total, predio) => total + predio.area_total, 0);
    }
}

module.exports = new LugarProduccionService();
