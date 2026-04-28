const especieVegetalRepository = require('../repositories/especieVegetalRepository');

class EspecieVegetalService {

    async crearEspecie(datos) {
        // 1. Validar campos obligatorios
        if (!datos.nom_especie || !datos.nom_comun || !datos.ciclo_cultivo) {
            throw { status: 400, message: 'Nombre científico, nombre común y ciclo de cultivo son obligatorios' };
        }

        // 2. Validar ciclo de cultivo válido
        const ciclosValidos = ['Corto', 'Medio', 'Largo'];
        if (!ciclosValidos.includes(datos.ciclo_cultivo)) {
            throw { status: 400, message: 'Ciclo de cultivo debe ser: Corto, Medio o Largo' };
        }

        // 3. Validar duplicado por nombre científico
        const existe = await especieVegetalRepository.findByNomEspecie(datos.nom_especie);
        if (existe) {
            throw { status: 409, message: 'Ya existe una especie vegetal con ese nombre científico' };
        }

        return await especieVegetalRepository.save(datos);
    }

    async listarEspecies() {
        return await especieVegetalRepository.findAll();
    }

    async obtenerEspeciePorId(id) {
        const especie = await especieVegetalRepository.findById(id);
        if (!especie) {
            throw { status: 404, message: 'Especie vegetal no encontrada' };
        }
        return especie;
    }

    async actualizarEspecie(id, datos) {
        const especie = await especieVegetalRepository.findById(id);
        if (!especie) {
            throw { status: 404, message: 'Especie vegetal no encontrada' };
        }

        if (datos.ciclo_cultivo && !['Corto', 'Medio', 'Largo'].includes(datos.ciclo_cultivo)) {
            throw { status: 400, message: 'Ciclo de cultivo debe ser: Corto, Medio o Largo' };
        }

        // Validar duplicado si cambia nombre científico
        if (datos.nom_especie && datos.nom_especie !== especie.nom_especie) {
            const existe = await especieVegetalRepository.findByNomEspecie(datos.nom_especie);
            if (existe) {
                throw { status: 409, message: 'Ya existe una especie con ese nombre científico' };
            }
        }

        const actualizada = {
            nom_especie: datos.nom_especie || especie.nom_especie,
            nom_comun: datos.nom_comun || especie.nom_comun,
            ciclo_cultivo: datos.ciclo_cultivo || especie.ciclo_cultivo
        };

        await especieVegetalRepository.update(id, actualizada);
        return await especieVegetalRepository.findById(id);
    }

    async eliminarEspecie(id) {
        const especie = await especieVegetalRepository.findById(id);
        if (!especie) {
            throw { status: 404, message: 'Especie vegetal no encontrada' };
        }

        // Verificar dependencias
        const tieneVariedades = await especieVegetalRepository.tieneVariedades(id);
        if (tieneVariedades) {
            throw { status: 409, message: 'No se puede eliminar: tiene variedades asociadas. Elimínelas primero' };
        }

        const estaEnUso = await especieVegetalRepository.estaEnUsoLugarEspecie(id);
        if (estaEnUso) {
            throw { status: 409, message: 'No se puede eliminar: está asociada a un lugar de producción' };
        }

        return await especieVegetalRepository.delete(id);
    }
}

module.exports = new EspecieVegetalService();