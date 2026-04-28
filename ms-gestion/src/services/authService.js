const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const usuarioRepository = require('../repositories/usuarioRepository');

class AuthService {

    async autenticarUsuario(correo, contrasenia) {
        // 1. Validar que se enviaron los campos
        if (!correo || !contrasenia) {
            throw { status: 400, message: 'Correo electrónico y contraseña son obligatorios' };
        }

        // 2. Buscar usuario por correo
        const usuario = await usuarioRepository.findByCorreo(correo);
        if (!usuario) {
            throw { status: 401, message: 'Credenciales inválidas' };
        }

        // 3. Comparar contraseña
        const contrasenaValida = await bcrypt.compare(contrasenia, usuario.contrasenia);
        if (!contrasenaValida) {
            throw { status: 401, message: 'Credenciales inválidas' };
        }

        // 4. Generar token JWT
        const payload = {
            id_usuario: usuario.id_usuario,
            correo_electronico: usuario.correo_electronico,
            id_rol: usuario.id_rol,
            nom_rol: usuario.nom_rol
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });

        // 5. Retornar datos del usuario (sin contraseña) y token
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