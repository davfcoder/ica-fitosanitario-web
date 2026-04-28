const usuarioService = require('../services/usuarioService');

class UsuarioController {

    async postCrearUsuario(req, res) {
        try {
            const nuevoUsuario = await usuarioService.crearUsuario(req.body);
            res.status(201).json({
                message: 'Usuario creado exitosamente',
                data: nuevoUsuario
            });
        } catch (error) {
            const status = error.status || 500;
            res.status(status).json({ error: error.message || 'Error al crear usuario' });
        }
    }

    async getUsuarios(req, res) {
        try {
            // Si se envía query param ?rol=2, filtra por rol
            if (req.query.rol) {
                const usuarios = await usuarioService.listarUsuariosPorRol(req.query.rol);
                return res.status(200).json({ message: 'Usuarios filtrados por rol', data: usuarios });
            }

            const usuarios = await usuarioService.listarUsuarios();
            res.status(200).json({
                message: 'Lista de usuarios obtenida',
                data: usuarios
            });
        } catch (error) {
            const status = error.status || 500;
            res.status(status).json({ error: error.message || 'Error al obtener usuarios' });
        }
    }

    async getUsuarioPorId(req, res) {
        try {
            const usuario = await usuarioService.obtenerUsuarioPorId(req.params.id);
            res.status(200).json({
                message: 'Usuario encontrado',
                data: usuario
            });
        } catch (error) {
            const status = error.status || 500;
            res.status(status).json({ error: error.message || 'Error al obtener usuario' });
        }
    }

    async putActualizarUsuario(req, res) {
        try {
            const usuarioActualizado = await usuarioService.actualizarUsuario(
                req.params.id, 
                req.body, 
                req.usuario // usuario autenticado del token
            );
            res.status(200).json({
                message: 'Usuario actualizado exitosamente',
                data: usuarioActualizado
            });
        } catch (error) {
            const status = error.status || 500;
            res.status(status).json({ error: error.message || 'Error al actualizar usuario' });
        }
    }

    async deleteUsuario(req, res) {
        try {
            await usuarioService.eliminarUsuario(req.params.id, req.usuario);
            res.status(200).json({
                message: 'Usuario eliminado exitosamente'
            });
        } catch (error) {
            const status = error.status || 500;
            res.status(status).json({ error: error.message || 'Error al eliminar usuario' });
        }
    }
}

module.exports = new UsuarioController();