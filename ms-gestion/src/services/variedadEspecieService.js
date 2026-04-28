const variedadEspecieRepository = require('../repositories/variedadEspecieRepository');
const especieVegetalRepository = require('../repositories/especieVegetalRepository');

class VariedadEspecieService {

    async crearVariedad(datos) {
        if (!datos.nom_variedad || !datos.id_especie) {
            throw { status: 400, message: 'Nombre de variedad e ID de especie son obligatorios' };
        }

        // Validar que la especie existe
        const especie = await especieVegetalRepository.findById(datos.id_especie);
        if (!especie) {
            throw { status: 404, message: 'La especie vegetal indicada no existe' };
        }

        // Validar duplicado (misma variedad para misma especie)
        const existe = await variedadEspecieRepository.findByNombreYEspecie(datos.nom_variedad, datos.id_especie);
        if (existe) {
            throw { status: 409, message: 'Ya existe esa variedad para la especie indicada' };
        }

        return await variedadEspecieRepository.save(datos);
    }

    async listarVariedades() {
        return await variedadEspecieRepository.findAll();
    }

    async listarVariedadesPorEspecie(idEspecie) {
        return await variedadEspecieRepository.findByIdEspecie(idEspecie);
    }

    async obtenerVariedadPorId(id) {
        const variedad = await variedadEspecieRepository.findById(id);
        if (!variedad) {
            throw { status: 404, message: 'Variedad no encontrada' };
        }
        return variedad;
    }

    async actualizarVariedad(id, datos) {
        const variedad = await variedadEspecieRepository.findById(id);
        if (!variedad) {
            throw { status: 404, message: 'Variedad no encontrada' };
        }

        if (datos.id_especie) {
            const especie = await especieVegetalRepository.findById(datos.id_especie);
            if (!especie) {
                throw { status: 404, message: 'La especie vegetal indicada no existe' };
            }
        }

        const actualizada = {
            nom_variedad: datos.nom_variedad || variedad.nom_variedad,
            id_especie: datos.id_especie || variedad.id_especie
        };

        await variedadEspecieRepository.update(id, actualizada);
        return await variedadEspecieRepository.findById(id);
    }

    async eliminarVariedad(id) {
        const variedad = await variedadEspecieRepository.findById(id);
        if (!variedad) {
            throw { status: 404, message: 'Variedad no encontrada' };
        }

        const enUso = await variedadEspecieRepository.estaEnUsoLote(id);
        if (enUso) {
            throw { status: 409, message: 'No se puede eliminar: la variedad está asignada a uno o más lotes' };
        }

        return await variedadEspecieRepository.delete(id);
    }
}

module.exports = new VariedadEspecieService();