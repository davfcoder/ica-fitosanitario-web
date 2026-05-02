import { useState, useEffect, useCallback } from 'react';
import ubicaciones from '../data/colombiaUbicaciones.json';

/**
 * Hook para datos de ubicación de Colombia (DIVIPOLA-DANE).
 * Lee desde JSON local: src/data/colombiaUbicaciones.json
 *
 * Estructura del JSON:
 * [
 *   { "departamento": "Antioquia", "municipios": ["Medellín", "Bello", ...] },
 *   ...
 * ]
 */
const useUbicacionDane = () => {
    const [departamentos, setDepartamentos] = useState([]);
    const [municipios, setMunicipios] = useState([]);

    useEffect(() => {
        const dptos = ubicaciones
            .map(u => u.departamento)
            .sort((a, b) => a.localeCompare(b));
        setDepartamentos(dptos);
    }, []);

    const cargarMunicipios = useCallback((nombreDepartamento) => {
        if (!nombreDepartamento) {
            setMunicipios([]);
            return;
        }
        const dpto = ubicaciones.find(u => u.departamento === nombreDepartamento);
        const mpios = dpto ? [...dpto.municipios].sort((a, b) => a.localeCompare(b)) : [];
        setMunicipios(mpios);
    }, []);

    const limpiarMunicipios = () => setMunicipios([]);

    return {
        departamentos,
        municipios,
        cargandoDptos: false,
        cargandoMunicipios: false,
        errorUbicacion: '',
        cargarMunicipios,
        limpiarMunicipios
    };
};

export default useUbicacionDane;