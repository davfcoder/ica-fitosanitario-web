const loteRepository = require('../repositories/loteRepository');
const lugarProduccionRepository = require('../repositories/lugarProduccionRepository');
const variedadEspecieRepository = require('../repositories/variedadEspecieRepository');
const predioRepository = require('../repositories/predioRepository');

class LoteService {

    async crearLote(datos, usuario) {
        if (!datos.numero || !datos.area_total || !datos.id_variedad || !datos.id_lugar_produccion) {
            throw { status: 400, message: 'Número, área total, variedad y lugar de producción son obligatorios' };
        }

        const lugar = await lugarProduccionRepository.findById(datos.id_lugar_produccion);
        if (!lugar) {
            throw { status: 404, message: 'Lugar de producción no encontrado' };
        }
        if (lugar.estado !== 'aprobado') {
            throw { status: 400, message: 'El lugar de producción debe estar aprobado para registrar lotes' };
        }

        // Validar que el lugar pertenece al productor autenticado
        if (usuario.nom_rol === 'Productor' && lugar.id_usuario_productor !== usuario.id_usuario) {
            throw { status: 403, message: 'No tiene permiso para crear lotes en este lugar de producción' };
        }

        const variedad = await variedadEspecieRepository.findById(datos.id_variedad);
        if (!variedad) {
            throw { status: 404, message: 'Variedad de especie no encontrada' };
        }

        if (datos.area_total <= 0) {
            throw { status: 400, message: 'El área del lote debe ser mayor a 0' };
        }

        const predios = await predioRepository.findByIdLugar(datos.id_lugar_produccion);
        const areaTotalLugar = predios.reduce((sum, p) => sum + p.area_total, 0);
        const areaLotesActual = await loteRepository.sumarAreaLotes(datos.id_lugar_produccion);

        if ((areaLotesActual + datos.area_total) > areaTotalLugar) {
            throw {
                status: 400,
                message: `Área excedida. Área total del lugar: ${areaTotalLugar} ha. Área en lotes: ${areaLotesActual} ha. Disponible: ${(areaTotalLugar - areaLotesActual).toFixed(2)} ha`
            };
        }

        if (datos.fec_siembra) {
            if (new Date(datos.fec_siembra) > new Date()) {
                throw { status: 400, message: 'La fecha de siembra no puede ser futura' };
            }
        }

        if (datos.fec_eliminacion && datos.fec_siembra) {
            if (new Date(datos.fec_eliminacion) <= new Date(datos.fec_siembra)) {
                throw { status: 400, message: 'La fecha de eliminación debe ser posterior a la fecha de siembra' };
            }
        }

        const nuevoLote = await loteRepository.save(datos);
        return await loteRepository.findById(nuevoLote.id_lote);
    }

    async listarLotes(filtros, usuario) {
        if (filtros && filtros.id_lugar_produccion) {
            return await loteRepository.findByLugarProduccion(filtros.id_lugar_produccion);
        }

        // Productor solo ve sus lotes
        if (usuario && usuario.nom_rol === 'Productor') {
            return await loteRepository.findByProductor(usuario.id_usuario);
        }

        // Admin y Asistente ven todo
        return await loteRepository.findAll();
    }

    async listarLotesActivosPorLugar(idLugar) {
        return await loteRepository.findLotesActivosByLugar(idLugar);
    }

    async obtenerLotePorId(id) {
        const lote = await loteRepository.findById(id);
        if (!lote) {
            throw { status: 404, message: 'Lote no encontrado' };
        }
        return lote;
    }

    async actualizarLote(id, datos, usuario) {
        const lote = await loteRepository.findById(id);
        if (!lote) {
            throw { status: 404, message: 'Lote no encontrado' };
        }

        if (usuario.nom_rol === 'Productor' && lote.id_usuario_productor !== usuario.id_usuario) {
            throw { status: 403, message: 'No tiene permiso para editar este lote' };
        }

        if (datos.area_total && datos.area_total !== lote.area_total) {
            const predios = await predioRepository.findByIdLugar(lote.id_lugar_produccion);
            const areaTotalLugar = predios.reduce((sum, p) => sum + p.area_total, 0);
            const areaLotesActual = await loteRepository.sumarAreaLotes(lote.id_lugar_produccion);
            const areaSinEste = areaLotesActual - lote.area_total;

            if ((areaSinEste + datos.area_total) > areaTotalLugar) {
                throw {
                    status: 400,
                    message: `Área excedida. Disponible: ${(areaTotalLugar - areaSinEste).toFixed(2)} ha`
                };
            }
        }

        if (datos.id_variedad && datos.id_variedad !== lote.id_variedad) {
            const variedad = await variedadEspecieRepository.findById(datos.id_variedad);
            if (!variedad) {
                throw { status: 404, message: 'Variedad no encontrada' };
            }
        }

        const fecSiembra = datos.fec_siembra || lote.fec_siembra;
        const fecEliminacion = datos.fec_eliminacion !== undefined ? datos.fec_eliminacion : lote.fec_eliminacion;

        if (fecEliminacion && fecSiembra) {
            if (new Date(fecEliminacion) <= new Date(fecSiembra)) {
                throw { status: 400, message: 'La fecha de eliminación debe ser posterior a la de siembra' };
            }
        }

        const actualizado = {
            numero: datos.numero || lote.numero,
            area_total: datos.area_total || lote.area_total,
            fec_siembra: datos.fec_siembra !== undefined ? datos.fec_siembra : lote.fec_siembra,
            fec_eliminacion: fecEliminacion,
            id_variedad: datos.id_variedad || lote.id_variedad,
            id_lugar_produccion: lote.id_lugar_produccion
        };

        await loteRepository.update(id, actualizado);
        return await loteRepository.findById(id);
    }

    async eliminarLote(id, usuario) {
        const lote = await loteRepository.findById(id);
        if (!lote) {
            throw { status: 404, message: 'Lote no encontrado' };
        }

        if (usuario.nom_rol === 'Productor' && lote.id_usuario_productor !== usuario.id_usuario) {
            throw { status: 403, message: 'No tiene permiso para eliminar este lote' };
        }

        return await loteRepository.delete(id);
    }
}

module.exports = new LoteService();