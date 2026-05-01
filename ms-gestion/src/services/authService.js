const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const usuarioRepository = require('../repositories/usuarioRepository');

class AuthService {

    async autenticarUsuario(correo, contrasenia) {
        if (!correo || !contrasenia) {
            throw { status: 400, message: 'Correo electrónico y contraseña son obligatorios' };
        }

        const usuario = await usuarioRepository.findByCorreo(correo);
        if (!usuario) {
            throw { status: 401, message: 'Credenciales inválidas' };
        }

        // >>> NUEVO: Bloquear Propietario
        if (usuario.id_rol === 4) {
            throw { status: 403, message: 'Este usuario no tiene acceso al sistema' };
        }

        const contrasenaValida = await bcrypt.compare(contrasenia, usuario.contrasenia);
        if (!contrasenaValida) {
            throw { status: 401, message: 'Credenciales inválidas' };
        }

        const payload = {
            id_usuario: usuario.id_usuario,
            correo_electronico: usuario.correo_electronico,
            id_rol: usuario.id_rol,
            nom_rol: usuario.nom_rol
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });

        return {
            token,
            usuario: {
                id_usuario: usuario.id_usuario,
                nombres: usuario.nombres,
                apellidos: usuario.apellidos,
                correo_electronico: usuario.correo_electronico,
                id_rol: usuario.id_rol,
                nom_rol: usuario.nom_rol
            }
        };
    }

    async obtenerPerfil(idUsuario) {
        const usuario = await usuarioRepository.findById(idUsuario);
        if (!usuario) {
            throw { status: 404, message: 'Usuario no encontrado' };
        }
        return usuario;
    }
}

module.exports = new AuthService();