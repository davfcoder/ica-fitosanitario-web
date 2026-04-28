const variedadEspecieService = require('../services/variedadEspecieService');

class VariedadEspecieController {

    async postVariedad(req, res) {
        try {
            const variedad = await variedadEspecieService.crearVariedad(req.body);
            res.status(201).json({ message: 'Variedad creada exitosamente', data: variedad });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async getVariedades(req, res) {
        try {
            // Soporta filtro ?especie=1
            if (req.query.especie) {
                const variedades = await variedadEspecieService.listarVariedadesPorEspecie(req.query.especie);
                return res.status(200).json({ message: 'Variedades filtradas por especie', data: variedades });
            }
            const variedades = await variedadEspecieService.listarVariedades();
            res.status(200).json({ message: 'Lista de variedades', data: variedades });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async getVariedadPorId(req, res) {
        try {
            const variedad = await variedadEspecieService.obtenerVariedadPorId(req.params.id);
            res.status(200).json({ message: 'Variedad encontrada', data: variedad });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async putVariedad(req, res) {
        try {
            const variedad = await variedadEspecieService.actualizarVariedad(req.params.id, req.body);
            res.status(200).json({ message: 'Variedad actualizada exitosamente', data: variedad });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async deleteVariedad(req, res) {
        try {
            await variedadEspecieService.eliminarVariedad(req.params.id);
            res.status(200).json({ message: 'Variedad eliminada exitosamente' });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }
}

module.exports = new VariedadEspecieController();