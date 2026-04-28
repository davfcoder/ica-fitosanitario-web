const loteRepository = require('../repositories/loteRepository');
const lugarProduccionRepository = require('../repositories/lugarProduccionRepository');
const variedadEspecieRepository = require('../repositories/variedadEspecieRepository');
const predioRepository = require('../repositories/predioRepository');

class LoteService {

    async crearLote(datos) {
        // 1. Validar campos obligatorios
        if (!datos.numero || !datos.area_total || !datos.id_variedad || !datos.id_lugar_produccion) {
            throw { status: 400, message: 'Número, área total, variedad y lugar de producción son obligatorios' };
        }

        // 2. Validar que el lugar existe y está aprobado
        const lugar = await lugarProduccionRepository.findById(datos.id_lugar_produccion);
        if (!lugar) {
            throw { status: 404, message: 'Lugar de producción no encontrado' };
        }
        if (lugar.estado !== 'aprobado') {
            throw { status: 400, message: 'El lugar de producción debe estar aprobado para registrar lotes' };
        }

        // 3. Validar que la variedad existe
        const variedad = await variedadEspecieRepository.findById(datos.id_variedad);
        if (!variedad) {
            throw { status: 404, message: 'Variedad de especie no encontrada' };
        }

        // 4. Validar área positiva
        if (datos.area_total <= 0) {
            throw { status: 400, message: 'El área del lote debe ser mayor a 0' };
        }

        // 5. Validar que el área del lote no exceda el área disponible del lugar
        const predios = await predioRepository.findByIdLugar(datos.id_lugar_produccion);
        const areaTotalLugar = predios.reduce((sum, p) => sum + p.area_total, 0);
        const areaLotesActual = await loteRepository.sumarAreaLotes(datos.id_lugar_produccion);

        if ((areaLotesActual + datos.area_total) > areaTotalLugar) {
            throw {
                status: 400,
                message: `Área excedida. Área total del lugar: ${areaTotalLugar} ha. Área en lotes: ${areaLotesActual} ha. Disponible: ${(areaTotalLugar - areaLotesActual).toFixed(2)} ha`
            };
        }

        // 6. Validar fechas
        if (datos.fec_siembra) {
            const fechaSiembra = new Date(datos.fec_siembra);
            const hoy = new Date();
            if (fechaSiembra > hoy) {
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

    async listarLotes(filtros) {
        if (filtros && filtros.id_lugar_produccion) {
            return await loteRepository.findByLugarProduccion(filtros.id_lugar_produccion);
        }
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

    async actualizarLote(id, datos) {
        const lote = await loteRepository.findById(id);
        if (!lote) {
            throw { status: 404, message: 'Lote no encontrado' };
        }

        // Validar área si cambia
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

        // Validar variedad si cambia
        if (datos.id_variedad && datos.id_variedad !== lote.id_variedad) {
            const variedad = await variedadEspecieRepository.findById(datos.id_variedad);
            if (!variedad) {
                throw { status: 404, message: 'Variedad no encontrada' };
            }
        }

        // Validar fechas
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

    async eliminarLote(id) {
        const lote = await loteRepository.findById(id);
        if (!lote) {
            throw { status: 404, message: 'Lote no encontrado' };
        }
        return await loteRepository.delete(id);
    }
}

module.exports = new LoteService();