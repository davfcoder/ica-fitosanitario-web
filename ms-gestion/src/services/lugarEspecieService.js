const lugarEspecieRepository = require('../repositories/lugarEspecieRepository');
const lugarProduccionRepository = require('../repositories/lugarProduccionRepository');
const especieVegetalRepository = require('../repositories/especieVegetalRepository');
const predioRepository = require('../repositories/predioRepository');

class LugarEspecieService {

    async crearProyeccionEspecie(datos) {
        // 1. Validar campos
        if (!datos.id_lugar_produccion || !datos.id_especie || 
            !datos.area_dest_cultivo || !datos.capacidad_produccion_max) {
            throw { status: 400, message: 'Todos los campos son obligatorios: id_lugar_produccion, id_especie, area_dest_cultivo, capacidad_produccion_max' };
        }

        // 2. Validar que el lugar existe y está aprobado
        const lugar = await lugarProduccionRepository.findById(datos.id_lugar_produccion);
        if (!lugar) {
            throw { status: 404, message: 'Lugar de producción no encontrado' };
        }
        if (lugar.estado !== 'aprobado') {
            throw { status: 400, message: 'El lugar de producción debe estar aprobado para registrar proyecciones' };
        }

        // 3. Validar que la especie existe
        const especie = await especieVegetalRepository.findById(datos.id_especie);
        if (!especie) {
            throw { status: 404, message: 'Especie vegetal no encontrada' };
        }

        // 4. Validar que no exista ya esa proyección
        const existe = await lugarEspecieRepository.findByLugarYEspecie(datos.id_lugar_produccion, datos.id_especie);
        if (existe) {
            throw { status: 409, message: 'Ya existe una proyección para esa especie en este lugar de producción' };
        }

        // 5. Validar que el área destinada no exceda el área total del lugar
        const areaActualDestinada = await lugarEspecieRepository.sumarAreaDestinada(datos.id_lugar_produccion);
        const predios = await predioRepository.findByIdLugar(datos.id_lugar_produccion);
        const areaTotalLugar = predios.reduce((sum, p) => sum + p.area_total, 0);

        if ((areaActualDestinada + datos.area_dest_cultivo) > areaTotalLugar) {
            throw { 
                status: 400, 
                message: `Área excedida. Área total del lugar: ${areaTotalLugar} ha. Área ya destinada: ${areaActualDestinada} ha. Disponible: ${(areaTotalLugar - areaActualDestinada).toFixed(2)} ha` 
            };
        }

        // 6. Validar valores positivos
        if (datos.area_dest_cultivo <= 0 || datos.capacidad_produccion_max <= 0) {
            throw { status: 400, message: 'El área y la capacidad de producción deben ser mayores a 0' };
        }

        await lugarEspecieRepository.save(datos);

        // Retornar con info de periodicidad
        const periodicidad = (especie.ciclo_cultivo === 'Largo') ? 'Anual' : 'Mensual';
        return {
            ...datos,
            nom_especie: especie.nom_especie,
            nom_comun: especie.nom_comun,
            ciclo_cultivo: especie.ciclo_cultivo,
            periodicidad_produccion: periodicidad
        };
    }

    async listarProyecciones(idLugar) {
        const lugar = await lugarProduccionRepository.findById(idLugar);
        if (!lugar) {
            throw { status: 404, message: 'Lugar de producción no encontrado' };
        }

        const proyecciones = await lugarEspecieRepository.findByIdLugar(idLugar);

        // Agregar periodicidad calculada
        return proyecciones.map(p => ({
            ...p,
            periodicidad_produccion: (p.ciclo_cultivo === 'Largo') ? 'Anual' : 'Mensual'
        }));
    }

    async actualizarProyeccion(idLugar, idEspecie, datos) {
        const existe = await lugarEspecieRepository.findByLugarYEspecie(idLugar, idEspecie);
        if (!existe) {
            throw { status: 404, message: 'Proyección no encontrada' };
        }

        // Validar área si cambia
        if (datos.area_dest_cultivo) {
            const areaActual = await lugarEspecieRepository.sumarAreaDestinada(idLugar);
            const predios = await predioRepository.findByIdLugar(idLugar);
            const areaTotalLugar = predios.reduce((sum, p) => sum + p.area_total, 0);
            const areaSinEsta = areaActual - existe.area_dest_cultivo;

            if ((areaSinEsta + datos.area_dest_cultivo) > areaTotalLugar) {
                throw {
                    status: 400,
                    message: `Área excedida. Disponible: ${(areaTotalLugar - areaSinEsta).toFixed(2)} ha`
                };
            }
        }

        const actualizada = {
            area_dest_cultivo: datos.area_dest_cultivo || existe.area_dest_cultivo,
            capacidad_produccion_max: datos.capacidad_produccion_max || existe.capacidad_produccion_max
        };

        await lugarEspecieRepository.update(idLugar, idEspecie, actualizada);
        return await lugarEspecieRepository.findByLugarYEspecie(idLugar, idEspecie);
    }

    async eliminarProyeccion(idLugar, idEspecie) {
        const existe = await lugarEspecieRepository.findByLugarYEspecie(idLugar, idEspecie);
        if (!existe) {
            throw { status: 404, message: 'Proyección no encontrada' };
        }
        return await lugarEspecieRepository.delete(idLugar, idEspecie);
    }
}

module.exports = new LugarEspecieService();