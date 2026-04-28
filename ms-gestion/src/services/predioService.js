const predioRepository = require('../repositories/predioRepository');
const usuarioRepository = require('../repositories/usuarioRepository');

class PredioService {

    async crearPredio(datos) {
        const camposObligatorios = ['num_predial', 'nom_predio', 'direccion', 'cx', 'cy',
                                     'area_total', 'id_propietario', 'cod_dane_dpto', 'departamento',
                                     'cod_dane_municipio', 'municipio', 'cod_dane_vereda', 'vereda'];
        for (const campo of camposObligatorios) {
            if (!datos[campo] && datos[campo] !== 0) {
                throw { status: 400, message: `El campo '${campo}' es obligatorio` };
            }
        }

        // Validar que no exista número predial duplicado
        const existePredial = await predioRepository.findByNumPredial(datos.num_predial);
        if (existePredial) {
            throw { status: 409, message: 'Ya existe un predio con ese número predial' };
        }

        // Validar que el propietario exista
        const propietario = await usuarioRepository.findById(datos.id_propietario);
        if (!propietario) {
            throw { status: 404, message: 'El usuario propietario indicado no existe' };
        }

        // Validar área positiva
        if (datos.area_total <= 0) {
            throw { status: 400, message: 'El área total debe ser mayor a 0' };
        }

        return await predioRepository.save(datos);
    }

    async listarPredios() {
        return await predioRepository.findAll();
    }

    async listarPrediosDisponibles() {
        return await predioRepository.findDisponibles();
    }

    async obtenerPredioPorId(id) {
        const predio = await predioRepository.findById(id);
        if (!predio) {
            throw { status: 404, message: 'Predio no encontrado' };
        }
        return predio;
    }

    async obtenerPrediosPorLugar(idLugar) {
        return await predioRepository.findByIdLugar(idLugar);
    }

    async actualizarPredio(id, datos) {
        const predio = await predioRepository.findById(id);
        if (!predio) {
            throw { status: 404, message: 'Predio no encontrado' };
        }

        // Validar duplicado de número predial si cambia
        if (datos.num_predial && datos.num_predial !== predio.num_predial) {
            const existe = await predioRepository.findByNumPredial(datos.num_predial);
            if (existe) {
                throw { status: 409, message: 'Ya existe un predio con ese número predial' };
            }
        }

        if (datos.id_propietario && datos.id_propietario !== predio.id_propietario) {
            const propietario = await usuarioRepository.findById(datos.id_propietario);
            if (!propietario) {
                throw { status: 404, message: 'El usuario propietario indicado no existe' };
            }
        }

        const actualizado = {
            num_predial: datos.num_predial || predio.num_predial,
            nro_registro_ica: datos.nro_registro_ica !== undefined ? datos.nro_registro_ica : predio.nro_registro_ica,
            nom_predio: datos.nom_predio || predio.nom_predio,
            direccion: datos.direccion || predio.direccion,
            cx: datos.cx || predio.cx,
            cy: datos.cy || predio.cy,
            area_total: datos.area_total || predio.area_total,
            id_propietario: datos.id_propietario || predio.id_propietario,
            cod_dane_dpto: datos.cod_dane_dpto || predio.cod_dane_dpto,
            departamento: datos.departamento || predio.departamento,
            cod_dane_municipio: datos.cod_dane_municipio || predio.cod_dane_municipio,
            municipio: datos.municipio || predio.municipio,
            cod_dane_vereda: datos.cod_dane_vereda || predio.cod_dane_vereda,
            vereda: datos.vereda || predio.vereda,
            id_lugar_produccion: datos.id_lugar_produccion !== undefined ? datos.id_lugar_produccion : predio.id_lugar_produccion
        };

        await predioRepository.update(id, actualizado);
        return await predioRepository.findById(id);
    }

    async eliminarPredio(id) {
        const predio = await predioRepository.findById(id);
        if (!predio) {
            throw { status: 404, message: 'Predio no encontrado' };
        }

        if (predio.id_lugar_produccion) {
            throw { status: 409, message: 'No se puede eliminar: el predio está asociado a un lugar de producción. Desasócielo primero' };
        }

        return await predioRepository.delete(id);
    }

    async vincularPredioLugar(idPredio, idLugar) {
        const predio = await predioRepository.findById(idPredio);
        if (!predio) throw { status: 404, message: 'Predio no encontrado' };

        if (predio.id_lugar_produccion && predio.id_lugar_produccion !== idLugar) {
            throw { status: 409, message: 'El predio ya está asociado a otro lugar de producción' };
        }

        return await predioRepository.updateLugarProduccion(idPredio, idLugar);
    }
}

module.exports = new PredioService();