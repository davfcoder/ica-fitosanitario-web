const lugarProduccionRepository = require('../repositories/lugarProduccionRepository');
const predioRepository = require('../repositories/predioRepository');

class LugarProduccionService {

    // === PRODUCTOR: Crear solicitud ===
    async crearSolicitud(datos, usuarioSolicitante) {
        if (!datos.nom_lugar_produccion) {
            throw { status: 400, message: 'El nombre del lugar de producción es obligatorio' };
        }

        if (!datos.predios_ids || !Array.isArray(datos.predios_ids) || datos.predios_ids.length === 0) {
            throw { status: 400, message: 'Debe indicar al menos un predio para el lugar de producción' };
        }

        for (const idPredio of datos.predios_ids) {
            const predio = await predioRepository.findById(idPredio);
            if (!predio) {
                throw { status: 404, message: `El predio con ID ${idPredio} no existe` };
            }
            if (predio.id_lugar_produccion) {
                throw { status: 409, message: `El predio '${predio.nom_predio}' ya está asociado a otro lugar de producción` };
            }
        }

        const nuevoLugar = await lugarProduccionRepository.save({
            nom_lugar_produccion: datos.nom_lugar_produccion,
            id_usuario_productor: usuarioSolicitante.id_usuario,
            estado: 'pendiente'
        });

        for (const idPredio of datos.predios_ids) {
            await predioRepository.updateLugarProduccion(idPredio, nuevoLugar.id_lugar_produccion);
        }

        return await lugarProduccionRepository.findById(nuevoLugar.id_lugar_produccion);
    }

    // === PRODUCTOR: Corregir solicitud devuelta ===
    async corregirSolicitud(id, datos, usuarioSolicitante) {
        const lugar = await lugarProduccionRepository.findById(id);
        if (!lugar) throw { status: 404, message: 'Lugar de producción no encontrado' };

        if (lugar.id_usuario_productor !== usuarioSolicitante.id_usuario) {
            throw { status: 403, message: 'No tiene permisos para modificar este lugar de producción' };
        }

        if (lugar.estado !== 'devuelto') {
            throw { status: 400, message: `No se puede corregir: el estado actual es '${lugar.estado}'` };
        }

        if (!datos.nom_lugar_produccion) {
            throw { status: 400, message: 'El nombre del lugar de producción es obligatorio' };
        }

        if (!datos.predios_ids || !Array.isArray(datos.predios_ids) || datos.predios_ids.length === 0) {
            throw { status: 400, message: 'Debe indicar al menos un predio' };
        }

        // Desvincular predios actuales
        const prediosActuales = await lugarProduccionRepository.getPredios(id);
        for (const predio of prediosActuales) {
            await predioRepository.updateLugarProduccion(predio.id_predio, null);
        }

        // Validar y vincular nuevos predios
        for (const idPredio of datos.predios_ids) {
            const predio = await predioRepository.findById(idPredio);
            if (!predio) throw { status: 404, message: `El predio con ID ${idPredio} no existe` };
            if (predio.id_lugar_produccion && Number(predio.id_lugar_produccion) !== Number(id)) {
                throw { status: 409, message: `El predio '${predio.nom_predio}' ya está asociado a otro lugar` };
            }
            await predioRepository.updateLugarProduccion(idPredio, id);
        }

        await lugarProduccionRepository.updateEstado(id, 'pendiente', null, null);
        await lugarProduccionRepository.updateNombre(id, datos.nom_lugar_produccion);

        return await lugarProduccionRepository.findById(id);
    }

    // === PRODUCTOR: Solicitar edición de lugar aprobado ===
    async solicitarEdicion(id, datos, usuario) {
        const lugar = await lugarProduccionRepository.findById(id);
        if (!lugar) throw { status: 404, message: 'Lugar de producción no encontrado' };

        if (lugar.id_usuario_productor !== usuario.id_usuario) {
            throw { status: 403, message: 'No tiene permisos sobre este lugar de producción' };
        }

        if (lugar.estado !== 'aprobado') {
            throw { status: 400, message: 'Solo se puede solicitar edición de lugares aprobados' };
        }

        if (!datos.observaciones || !datos.observaciones.trim()) {
            throw { status: 400, message: 'Debe indicar el motivo de la solicitud de edición' };
        }

        await lugarProduccionRepository.updateEstadoProductor(id, 'en_edicion', datos.observaciones);
        return await lugarProduccionRepository.findById(id);
    }

    // === PRODUCTOR: Solicitar cancelación de lugar aprobado ===
    async solicitarCancelacion(id, datos, usuario) {
        const lugar = await lugarProduccionRepository.findById(id);
        if (!lugar) throw { status: 404, message: 'Lugar de producción no encontrado' };

        if (lugar.id_usuario_productor !== usuario.id_usuario) {
            throw { status: 403, message: 'No tiene permisos sobre este lugar de producción' };
        }

        if (lugar.estado !== 'aprobado') {
            throw { status: 400, message: 'Solo se puede solicitar cancelación de lugares aprobados' };
        }

        if (!datos.observaciones || !datos.observaciones.trim()) {
            throw { status: 400, message: 'Debe indicar el motivo de la solicitud de cancelación' };
        }

        // Bloquear si tiene lotes activos
        const tieneLotesActivos = await lugarProduccionRepository.tieneLotesActivos(id);
        if (tieneLotesActivos) {
            throw { status: 409, message: 'No puede solicitar cancelación mientras haya lotes activos. Elimine o cierre los lotes primero.' };
        }

        await lugarProduccionRepository.updateEstadoProductor(id, 'en_cancelacion', datos.observaciones);
        return await lugarProduccionRepository.findById(id);
    }

    // === ADMIN: Aprobar cambio solicitado (edición o cancelación) ===
    async aprobarCambio(id, datos) {
        const lugar = await lugarProduccionRepository.findById(id);
        if (!lugar) throw { status: 404, message: 'Lugar de producción no encontrado' };

        if (lugar.estado === 'en_edicion') {
            // Aprobar edición → devuelto para que el productor edite y reenvíe
            await lugarProduccionRepository.updateEstadoSimple(id, 'devuelto',
                datos.observaciones || 'Solicitud de edición aprobada. Realice los cambios y reenvíe.');
            return await lugarProduccionRepository.findById(id);
        }

        if (lugar.estado === 'en_cancelacion') {
            // Limpiar dependencias
            await lugarProduccionRepository.deleteLugarEspecies(id);

            const predios = await predioRepository.findByIdLugar(id);
            for (const predio of predios) {
                await predioRepository.updateLugarProduccion(predio.id_predio, null);
            }

            await lugarProduccionRepository.updateEstadoSimple(id, 'cancelado',
                datos.observaciones || 'Cancelación aprobada');
            return await lugarProduccionRepository.findById(id);
        }

        throw { status: 400, message: `No hay cambio pendiente para aprobar. Estado actual: '${lugar.estado}'` };
    }

    // === ADMIN: Rechazar cambio solicitado ===
    async rechazarCambio(id, datos) {
        const lugar = await lugarProduccionRepository.findById(id);
        if (!lugar) throw { status: 404, message: 'Lugar de producción no encontrado' };

        if (lugar.estado !== 'en_edicion' && lugar.estado !== 'en_cancelacion') {
            throw { status: 400, message: `No hay cambio pendiente para rechazar. Estado actual: '${lugar.estado}'` };
        }

        if (!datos.observaciones || !datos.observaciones.trim()) {
            throw { status: 400, message: 'Debe indicar el motivo del rechazo' };
        }

        // Vuelve a aprobado sin tocar nro_registro_ica
        await lugarProduccionRepository.updateEstadoSimple(id, 'aprobado', datos.observaciones);
        return await lugarProduccionRepository.findById(id);
    }

    // === Consultas ===
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
        if (!lugar) throw { status: 404, message: 'Lugar de producción no encontrado' };

        const predios = await predioRepository.findByIdLugar(id);
        lugar.predios = predios;
        return lugar;
    }

    // === ADMIN: Aprobar solicitud inicial ===
    async aprobarSolicitud(id, datos) {
        const lugar = await lugarProduccionRepository.findById(id);
        if (!lugar) throw { status: 404, message: 'Lugar de producción no encontrado' };

        if (lugar.estado !== 'pendiente') {
            throw { status: 400, message: `No se puede aprobar: el estado actual es '${lugar.estado}'` };
        }

        if (!datos.nro_registro_ica) {
            throw { status: 400, message: 'El número de registro ICA es obligatorio para aprobar' };
        }

        await lugarProduccionRepository.updateEstado(id, 'aprobado', datos.observaciones, datos.nro_registro_ica);
        return await lugarProduccionRepository.findById(id);
    }

    // === ADMIN: Rechazar solicitud inicial ===
    async rechazarSolicitud(id, datos) {
        const lugar = await lugarProduccionRepository.findById(id);
        if (!lugar) throw { status: 404, message: 'Lugar de producción no encontrado' };

        if (lugar.estado !== 'pendiente') {
            throw { status: 400, message: `No se puede rechazar: el estado actual es '${lugar.estado}'` };
        }

        if (!datos.observaciones) {
            throw { status: 400, message: 'Debe indicar el motivo del rechazo' };
        }

        await lugarProduccionRepository.updateEstado(id, 'rechazado', datos.observaciones, null);
        return await lugarProduccionRepository.findById(id);
    }

    // === ADMIN: Devolver solicitud inicial ===
    async devolverSolicitud(id, datos) {
        const lugar = await lugarProduccionRepository.findById(id);
        if (!lugar) throw { status: 404, message: 'Lugar de producción no encontrado' };

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
        if (!lugar) throw { status: 404, message: 'Lugar de producción no encontrado' };

        const tieneLotes = await lugarProduccionRepository.tieneLotes(id);
        if (tieneLotes) {
            throw { status: 409, message: 'No se puede eliminar: tiene lotes asociados' };
        }

        await lugarProduccionRepository.deleteLugarEspecies(id);

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