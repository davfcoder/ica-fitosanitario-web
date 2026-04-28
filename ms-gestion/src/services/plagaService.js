const plagaRepository = require('../repositories/plagaRepository');
const especieVegetalRepository = require('../repositories/especieVegetalRepository');

class PlagaService {

    async crearPlaga(datos) {
        if (!datos.nom_especie || !datos.nombre_comun) {
            throw { status: 400, message: 'Nombre científico y nombre común son obligatorios' };
        }

        const existe = await plagaRepository.findByNomEspecie(datos.nom_especie);
        if (existe) {
            throw { status: 409, message: 'Ya existe una plaga con ese nombre científico' };
        }

        return await plagaRepository.save(datos);
    }

    async listarPlagas() {
        return await plagaRepository.findAll();
    }

    async obtenerPlagaPorId(id) {
        const plaga = await plagaRepository.findById(id);
        if (!plaga) {
            throw { status: 404, message: 'Plaga no encontrada' };
        }
        return plaga;
    }

    async actualizarPlaga(id, datos) {
        const plaga = await plagaRepository.findById(id);
        if (!plaga) {
            throw { status: 404, message: 'Plaga no encontrada' };
        }

        if (datos.nom_especie && datos.nom_especie !== plaga.nom_especie) {
            const existe = await plagaRepository.findByNomEspecie(datos.nom_especie);
            if (existe) {
                throw { status: 409, message: 'Ya existe una plaga con ese nombre científico' };
            }
        }

        const actualizada = {
            nom_especie: datos.nom_especie || plaga.nom_especie,
            nombre_comun: datos.nombre_comun || plaga.nombre_comun
        };

        await plagaRepository.update(id, actualizada);
        return await plagaRepository.findById(id);
    }

    async eliminarPlaga(id) {
        const plaga = await plagaRepository.findById(id);
        if (!plaga) {
            throw { status: 404, message: 'Plaga no encontrada' };
        }

        const enUso = await plagaRepository.estaEnUsoEspeciePlaga(id);
        if (enUso) {
            throw { status: 409, message: 'No se puede eliminar: la plaga está asociada a especies vegetales. Desasóciela primero' };
        }

        return await plagaRepository.delete(id);
    }

    // Asociar plaga con especie vegetal
    async asociarConEspecie(idPlaga, idEspecie) {
        const plaga = await plagaRepository.findById(idPlaga);
        if (!plaga) throw { status: 404, message: 'Plaga no encontrada' };

        const especie = await especieVegetalRepository.findById(idEspecie);
        if (!especie) throw { status: 404, message: 'Especie vegetal no encontrada' };

        await plagaRepository.asociarEspecie(idEspecie, idPlaga);
        return { message: `Plaga '${plaga.nombre_comun}' asociada a '${especie.nom_comun}'` };
    }

    // Desasociar plaga de especie
    async desasociarDeEspecie(idPlaga, idEspecie) {
        await plagaRepository.desasociarEspecie(idEspecie, idPlaga);
        return { message: 'Asociación eliminada exitosamente' };
    }

    // Obtener plagas de una especie
    async obtenerPlagasPorEspecie(idEspecie) {
        const especie = await especieVegetalRepository.findById(idEspecie);
        if (!especie) throw { status: 404, message: 'Especie vegetal no encontrada' };

        return await plagaRepository.findByEspecie(idEspecie);
    }
}

module.exports = new PlagaService();