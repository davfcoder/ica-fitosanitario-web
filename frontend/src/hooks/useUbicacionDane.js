import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para datos de ubicación de Colombia
 * API: https://api-colombia.com
 * Docs: https://api-colombia.com/swagger
 * 
 * Endpoints:
 *   GET /api/v1/Department          → Lista departamentos
 *   GET /api/v1/Department/{id}/cities  → Municipios por departamento
 */

const BASE = 'https://api-colombia.com/api/v1';

const cache = {
    departamentos: null,
    municipios: {}
};

const useUbicacionDane = () => {
    const [departamentos, setDepartamentos] = useState([]);
    const [municipios, setMunicipios] = useState([]);
    const [cargandoDptos, setCargandoDptos] = useState(false);
    const [cargandoMunicipios, setCargandoMunicipios] = useState(false);
    const [errorUbicacion, setErrorUbicacion] = useState('');

    useEffect(() => {
        cargarDepartamentos();
    }, []);

    const cargarDepartamentos = async () => {
        if (cache.departamentos) {
            setDepartamentos(cache.departamentos);
            return;
        }

        try {
            setCargandoDptos(true);
            setErrorUbicacion('');

            const response = await fetch(`${BASE}/Department`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();

            const dptos = data
                .map(d => ({
                    id: d.id,
                    cod: String(d.id).padStart(2, '0'),
                    nombre: d.name
                }))
                .sort((a, b) => a.nombre.localeCompare(b.nombre));

            cache.departamentos = dptos;
            setDepartamentos(dptos);
        } catch (err) {
            console.error('Error cargando departamentos:', err);
            setErrorUbicacion('No se pudieron cargar los departamentos');
        } finally {
            setCargandoDptos(false);
        }
    };

    const cargarMunicipios = useCallback(async (idDepartamento) => {
        if (!idDepartamento) {
            setMunicipios([]);
            return;
        }

        // Buscar el ID numérico real del departamento
        const dpto = (cache.departamentos || []).find(
            d => d.cod === idDepartamento || String(d.id) === String(idDepartamento)
        );
        const idReal = dpto ? dpto.id : idDepartamento;

        if (cache.municipios[idReal]) {
            setMunicipios(cache.municipios[idReal]);
            return;
        }

        try {
            setCargandoMunicipios(true);
            setErrorUbicacion('');

            const response = await fetch(`${BASE}/Department/${idReal}/cities`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();

            const mpios = data
                .map(m => ({
                    id: m.id,
                    cod: String(m.id).padStart(5, '0'),
                    nombre: m.name
                }))
                .sort((a, b) => a.nombre.localeCompare(b.nombre));

            cache.municipios[idReal] = mpios;
            setMunicipios(mpios);
        } catch (err) {
            console.error('Error cargando municipios:', err);
            setErrorUbicacion('No se pudieron cargar los municipios');
        } finally {
            setCargandoMunicipios(false);
        }
    }, []);

    const limpiarMunicipios = () => setMunicipios([]);

    return {
        departamentos,
        municipios,
        cargandoDptos,
        cargandoMunicipios,
        errorUbicacion,
        cargarMunicipios,
        limpiarMunicipios
    };
};

export default useUbicacionDane;