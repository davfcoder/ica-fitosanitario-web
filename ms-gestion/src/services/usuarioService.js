const bcrypt = require('bcryptjs');
const usuarioRepository = require('../repositories/usuarioRepository');

class UsuarioService {

    async crearUsuario(datos) {
        const esPropietario = Number(datos.id_rol) === 4;

        // 1. Validar campos obligatorios (contraseña NO obligatoria para Propietario)
        const camposBase = ['num_identificacion', 'nombres', 'apellidos', 'direccion',
                            'telefono', 'correo_electronico', 'id_rol'];
        // Propietario no necesita contraseña
        const camposObligatorios = esPropietario ? camposBase : [...camposBase, 'contrasenia'];

        for (const campo of camposObligatorios) {
            if (!datos[campo]) {
                throw { status: 400, message: `El campo '${campo}' es obligatorio` };
            }
        }

        // 2. Validar que no exista usuario con misma identificación
        const existeIdentificacion = await usuarioRepository.findByNumIdentificacion(datos.num_identificacion);
        if (existeIdentificacion) {
            throw { status: 409, message: 'Ya existe un usuario con ese número de identificación' };
        }

        // 3. Validar que no exista usuario con mismo correo
        const existeCorreo = await usuarioRepository.findByCorreo(datos.correo_electronico);
        if (existeCorreo) {
            throw { status: 409, message: 'Ya existe un usuario con ese correo electrónico' };
        }

        // 4. Validar rol válido
        if (![1, 2, 3, 4].includes(Number(datos.id_rol))) {
            throw { status: 400, message: 'Rol no válido. Use: 1 (Administrador), 2 (Productor), 3 (Asistente Técnico), 4 (Propietario)' };
        }

        // 5. Contraseña: para Propietario guardar un hash inválido, para los demás encriptar
        if (esPropietario) {
            // String que nunca hará match con bcrypt.compare()
            datos.contrasenia = '!NOLOGIN!';
        } else {
            datos.contrasenia = await bcrypt.hash(datos.contrasenia, 12);
        }

        // 6. Guardar en BD
        const nuevoUsuario = await usuarioRepository.save(datos);

        // 7. Retornar sin contraseña
        delete nuevoUsuario.contrasenia;
        return nuevoUsuario;
    }

    async listarUsuarios() {
        return await usuarioRepository.findAll();
    }

    async obtenerUsuarioPorId(id) {
        const usuario = await usuarioRepository.findById(id);
        if (!usuario) {
            throw { status: 404, message: 'Usuario no encontrado' };
        }
        return usuario;
    }

    async actualizarUsuario(id, datos, usuarioSolicitante) {
        const usuarioExistente = await usuarioRepository.findById(id);
        if (!usuarioExistente) {
            throw { status: 404, message: 'Usuario no encontrado' };
        }

        if (usuarioExistente.id_rol === 1 && usuarioSolicitante.id_usuario !== 1) {
            throw { status: 403, message: 'Solo el administrador principal puede modificar otros administradores' };
        }

        if (datos.num_identificacion && datos.num_identificacion !== usuarioExistente.num_identificacion) {
            const existeIdent = await usuarioRepository.findByNumIdentificacion(datos.num_identificacion);
            if (existeIdent) {
                throw { status: 409, message: 'Ya existe un usuario con ese número de identificación' };
            }
        }

        if (datos.correo_electronico && datos.correo_electronico !== usuarioExistente.correo_electronico) {
            const existeCorreo = await usuarioRepository.findByCorreo(datos.correo_electronico);
            if (existeCorreo) {
                throw { status: 409, message: 'Ya existe un usuario con ese correo electrónico' };
            }
        }

        const usuarioActualizado = {
            num_identificacion: datos.num_identificacion || usuarioExistente.num_identificacion,
            nombres: datos.nombres || usuarioExistente.nombres,
            apellidos: datos.apellidos || usuarioExistente.apellidos,
            direccion: datos.direccion || usuarioExistente.direccion,
            telefono: datos.telefono || usuarioExistente.telefono,
            correo_electronico: datos.correo_electronico || usuarioExistente.correo_electronico,
            nro_registro_ica: datos.nro_registro_ica !== undefined ? datos.nro_registro_ica : usuarioExistente.nro_registro_ica,
            tarjeta_profesional: datos.tarjeta_profesional !== undefined ? datos.tarjeta_profesional : usuarioExistente.tarjeta_profesional,
            id_rol: datos.id_rol || usuarioExistente.id_rol
        };

        await usuarioRepository.update(id, usuarioActualizado);
        return await usuarioRepository.findById(id);
    }

    async eliminarUsuario(id, usuarioSolicitante) {
        const usuario = await usuarioRepository.findById(id);
        if (!usuario) {
            throw { status: 404, message: 'Usuario no encontrado' };
        }

        if (Number(id) === usuarioSolicitante.id_usuario) {
            throw { status: 400, message: 'No puede eliminarse a sí mismo' };
        }

        if (usuario.id_rol === 1 && usuarioSolicitante.id_usuario !== 1) {
            throw { status: 403, message: 'Solo el administrador principal puede eliminar otros administradores' };
        }

        if (Number(id) === 1) {
            throw { status: 403, message: 'El administrador principal no puede ser eliminado' };
        }

        return await usuarioRepository.delete(id);
    }

    async listarUsuariosPorRol(idRol) {
        return await usuarioRepository.findByRol(idRol);
    }
}

module.exports = new UsuarioService();