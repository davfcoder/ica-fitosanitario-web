import TablaResumenInspecciones from '../../components/inspecciones/TablaResumenInspecciones';

const InspeccionesAdmin = () => (
    <TablaResumenInspecciones
        esAdmin={true}
        titulo="Inspecciones Fitosanitarias"
        subtitulo="Listado consolidado de todas las inspecciones registradas en el sistema"
    />
);

export default InspeccionesAdmin;