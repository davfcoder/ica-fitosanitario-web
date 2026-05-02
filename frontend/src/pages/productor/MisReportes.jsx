import TablaResumenInspecciones from '../../components/inspecciones/TablaResumenInspecciones';

const MisReportes = () => (
    <TablaResumenInspecciones
        esProductor={true}
        titulo="Resultados de Inspección"
        subtitulo="Resultados de inspecciones realizadas en tus lugares de producción"
    />
);

export default MisReportes;