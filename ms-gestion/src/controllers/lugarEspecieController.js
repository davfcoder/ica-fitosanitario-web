const lugarEspecieService = require('../services/lugarEspecieService');

class LugarEspecieController {

    async postProyeccionCultivo(req, res) {
        try {
            const proyeccion = await lugarEspecieService.crearProyeccionEspecie(req.body);
            res.status(201).json({ message: 'Proyección de cultivo registrada exitosamente', data: proyeccion });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async getLugarEspecie(req, res) {
        try {
            const proyecciones = await lugarEspecieService.listarProyecciones(req.params.idLugar);
            res.status(200).json({ message: 'Proyecciones del lugar de producción', data: proyecciones });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async putProyeccion(req, res) {
        try {
            const proyeccion = await lugarEspecieService.actualizarProyeccion(
                req.params.idLugar, req.params.idEspecie, req.body
            );
            res.status(200).json({ message: 'Proyección actualizada exitosamente', data: proyeccion });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async deleteProyeccion(req, res) {
        try {
            await lugarEspecieService.eliminarProyeccion(req.params.idLugar, req.params.idEspecie);
            res.status(200).json({ message: 'Proyección eliminada exitosamente' });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }
}

module.exports = new LugarEspecieController();