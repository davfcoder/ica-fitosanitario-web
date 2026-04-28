const bcrypt = require('bcryptjs');
const usuarioRepository = require('../repositories/usuarioRepository');

class UsuarioService {

    async crearUsuario(datos) {
        // 1. Validar campos obligatorios
        const camposObligatorios = ['num_identificacion', 'nombres', 'apellidos', 'direccion', 
                                      'telefono', 'correo_electronico', 'contrasenia', 'id_rol'];
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

        // 4. Validar rol válido (1: Admin, 2: Productor, 3: Asistente, 4: Propietario)
        if (![1, 2, 3, 4].includes(Number(datos.id_rol))) {
            throw { status: 400, message: 'Rol no válido. Use: 1 (Administrador), 2 (Productor), 3 (Asistente Técnico), 4 (Propietario)' };
        }

        // 5. Encriptar contraseña
        datos.contrasenia = await bcrypt.hash(datos.contrasenia, 12);

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
        // 1. Verificar que el usuario existe
        const usuarioExistente = await usuarioRepository.findById(id);
        if (!usuarioExistente) {
            throw { status: 404, message: 'Usuario no encontrado' };
        }

        // 2. Si se intenta modificar un Administrador, solo el admin principal (id=1) puede
        if (usuarioExistente.id_rol === 1 && usuarioSolicitante.id_usuario !== 1) {
            throw { status: 403, message: 'Solo el administrador principal puede modificar otros administradores' };
        }

        // 3. Validar duplicados de identificación (si cambió)
        if (datos.num_identificacion && datos.num_identificacion !== usuarioExistente.num_identificacion) {
            const existeIdent = await usuarioRepository.findByNumIdentificacion(datos.num_identificacion);
            if (existeIdent) {
                throw { status: 409, message: 'Ya existe un usuario con ese número de identificación' };
            }
        }

        // 4. Validar duplicados de correo (si cambió)
        if (datos.correo_electronico && datos.correo_electronico !== usuarioExistente.correo_electronico) {
            const existeCorreo = await usuarioRepository.findByCorreo(datos.correo_electronico);
            if (existeCorreo) {
                throw { status: 409, message: 'Ya existe un usuario con ese correo electrónico' };
            }
        }

        // 5. Construir objeto actualizado (mantener datos previos si no se envían)
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
        // 1. Verificar que existe
        const usuario = await usuarioRepository.findById(id);
        if (!usuario) {
            throw { status: 404, message: 'Usuario no encontrado' };
        }

        // 2. No se puede eliminar a sí mismo
        if (Number(id) === usuarioSolicitante.id_usuario) {
            throw { status: 400, message: 'No puede eliminarse a sí mismo' };
        }

        // 3. Solo el admin principal puede eliminar otros admins
        if (usuario.id_rol === 1 && usuarioSolicitante.id_usuario !== 1) {
            throw { status: 403, message: 'Solo el administrador principal puede eliminar otros administradores' };
        }

        // 4. No se puede eliminar el admin principal (id=1)
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