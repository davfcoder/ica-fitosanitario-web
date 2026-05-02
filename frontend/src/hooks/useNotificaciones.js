import { useState, useEffect, useCallback } from 'react';
import { API_INSPECCION } from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

const INTERVALO_MS = 30000;

export const useNotificaciones = () => {
    const { usuario } = useAuth();
    const [notificaciones, setNotificaciones] = useState([]);
    const [noLeidas, setNoLeidas] = useState(0);

    const cargar = useCallback(async () => {
        if (!usuario) return;
        try {
            const res = await API_INSPECCION.get('/notificaciones');
            setNotificaciones(res.data.data.lista || []);
            setNoLeidas(res.data.data.no_leidas || 0);
        } catch (err) {
            console.error('Error cargando notificaciones:', err);
        }
    }, [usuario]);

    useEffect(() => {
        if (!usuario) return;
        cargar();
        const interval = setInterval(cargar, INTERVALO_MS);
        return () => clearInterval(interval);
    }, [usuario, cargar]);

    const marcarLeida = async (id) => {
        try {
            await API_INSPECCION.patch(`/notificaciones/${id}/leida`);
            await cargar();
        } catch (err) { console.error(err); }
    };

    const marcarTodasLeidas = async () => {
        try {
            await API_INSPECCION.patch('/notificaciones/marcar-todas-leidas');
            await cargar();
        } catch (err) { console.error(err); }
    };

    const eliminarUna = async (id) => {
        try {
            await API_INSPECCION.delete(`/notificaciones/${id}`);
            await cargar();
        } catch (err) { console.error(err); }
    };

    const eliminarTodas = async () => {
        try {
            await API_INSPECCION.delete('/notificaciones/limpiar');
            await cargar();
        } catch (err) { console.error(err); }
    };

    return { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas, eliminarUna, eliminarTodas, recargar: cargar };
};