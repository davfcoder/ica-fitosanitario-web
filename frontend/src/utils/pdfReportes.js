import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLOR_PRIMARIO = [15, 124, 58];
const MARGEN = 14;

// ===========================================================
// UTILIDADES COMUNES
// ===========================================================

const dibujarEncabezado = (doc, titulo) => {
    doc.setFillColor(...COLOR_PRIMARIO);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 20, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('INSTITUTO COLOMBIANO AGROPECUARIO - ICA', MARGEN, 8);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Inspecciones Fitosanitarias', MARGEN, 14);

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(titulo, MARGEN, 30);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`,
        doc.internal.pageSize.getWidth() - MARGEN, 30, { align: 'right' });
    doc.setTextColor(0, 0, 0);

    return 38; // Y donde empieza el contenido
};

const dibujarPiePagina = (doc) => {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text(
            `Página ${i} de ${pageCount}`,
            pageWidth - MARGEN,
            pageHeight - 8,
            { align: 'right' }
        );
        doc.text(
            'ICA - Documento generado automáticamente',
            MARGEN,
            pageHeight - 8
        );
    }
};

const seccion = (doc, titulo, y) => {
    doc.setFillColor(240, 248, 240);
    doc.rect(MARGEN, y - 4, doc.internal.pageSize.getWidth() - 2 * MARGEN, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLOR_PRIMARIO);
    doc.text(titulo, MARGEN + 2, y + 1);
    doc.setTextColor(0, 0, 0);
    return y + 8;
};

const filaDato = (doc, label, valor, y, columna = 0) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const colWidth = (pageWidth - 2 * MARGEN) / 2;
    const x = MARGEN + (columna * colWidth);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(`${label}:`, x, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const texto = String(valor || '—');
    const textoSplit = doc.splitTextToSize(texto, colWidth - 4);
    doc.text(textoSplit, x, y + 4);

    return y + 4 + (textoSplit.length * 4);
};

// Detecta el formato a partir del data URL o cabecera
const detectarFormato = (dataUrl) => {
    if (typeof dataUrl !== 'string') return 'JPEG';
    if (dataUrl.startsWith('data:image/png')) return 'PNG';
    if (dataUrl.startsWith('data:image/webp')) return 'WEBP';
    return 'JPEG';
};

// Carga una imagen base64 y devuelve {dataUrl, w, h} normalizado
const cargarImagen = (src) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ dataUrl: src, w: img.naturalWidth, h: img.naturalHeight, formato: detectarFormato(src) });
    img.onerror = () => resolve(null);
    img.src = src;
});

// ===========================================================
// PDF 1: TABLA RESUMEN DE INSPECCIONES
// ===========================================================
export const generarPdfTablaResumen = (inspecciones, filtrosAplicados, esAdmin) => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    let y = dibujarEncabezado(doc, 'Reporte de Inspecciones Fitosanitarias');

    // Filtros aplicados
    if (filtrosAplicados && Object.keys(filtrosAplicados).length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Filtros aplicados:', MARGEN, y);
        y += 4;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        Object.entries(filtrosAplicados).forEach(([k, v]) => {
            if (v) {
                doc.text(`• ${k}: ${v}`, MARGEN + 2, y);
                y += 4;
            }
        });
        y += 2;
    }

    // Resumen
    const totalPlantas = inspecciones.reduce((s, i) => s + i.cantidad_plantas_evaluadas, 0);
    const totalInfestadas = inspecciones.reduce((s, i) =>
        s + i.hallazgos_plagas.reduce((ss, h) => ss + h.cantidad_plantas_infestadas, 0), 0);
    const porcentajeGen = totalPlantas > 0 ? ((totalInfestadas / totalPlantas) * 100).toFixed(2) : 0;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(
        `Total inspecciones: ${inspecciones.length}    |    Plantas evaluadas: ${totalPlantas}    |    Plantas infestadas: ${totalInfestadas}    |    % Infestación general: ${porcentajeGen}%`,
        MARGEN, y
    );
    y += 6;

    // Construir filas
    const head = [[
        'ID', 'Fecha', 'Lugar', 'Lote', 'Especie / Variedad',
        ...(esAdmin ? ['Asistente'] : []),
        'Plantas Eval.', '# Plagas', '% Inf. Máx.'
    ]];

    const body = inspecciones.map(i => {
        const porcMax = i.hallazgos_plagas.length > 0
            ? Math.max(...i.hallazgos_plagas.map(h => h.porcentaje_infestacion))
            : 0;
        const fila = [
            String(i._id).slice(-6).toUpperCase(),
            new Date(i.fec_inspeccion).toLocaleDateString('es-CO'),
            i.nom_lugar_produccion || '—',
            i.numero_lote || '—',
            `${i.nom_especie || '—'} / ${i.nom_variedad || '—'}`,
            ...(esAdmin ? [i.nom_asistente || '—'] : []),
            i.cantidad_plantas_evaluadas,
            i.hallazgos_plagas.length,
            `${porcMax}%`
        ];
        return fila;
    });

    autoTable(doc, {
        head,
        body,
        startY: y,
        theme: 'striped',
        headStyles: { fillColor: COLOR_PRIMARIO, textColor: 255, fontSize: 8, halign: 'center' },
        bodyStyles: { fontSize: 8 },
        styles: { cellPadding: 2 },
        margin: { left: MARGEN, right: MARGEN }
    });

    dibujarPiePagina(doc);
    doc.save(`reporte-inspecciones-${new Date().toISOString().split('T')[0]}.pdf`);
};

// ===========================================================
// PDF 2: REPORTE INDIVIDUAL DE INSPECCIÓN
// ===========================================================
export const generarPdfInspeccionIndividual = async ({
    inspeccion, solicitud, solicitante, asistente
}) => {
    const doc = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = dibujarEncabezado(doc, 'Reporte de Inspección Fitosanitaria');

    // ====== INFORMACIÓN GENERAL ======
    y = seccion(doc, 'INFORMACIÓN GENERAL', y);
    let yIzq = y, yDer = y;
    yIzq = filaDato(doc, 'ID Inspección', String(inspeccion._id).slice(-8).toUpperCase(), yIzq, 0);
    yDer = filaDato(doc, 'ID Solicitud', `#${solicitud.id_solicitud}`, yDer, 1);
    y = Math.max(yIzq, yDer);
    yIzq = filaDato(doc, 'Estado solicitud', solicitud.estado, y + 1, 0);
    yDer = filaDato(doc, 'Motivo', solicitud.motivo, y + 1, 1);
    y = Math.max(yIzq, yDer);
    yIzq = filaDato(doc, 'Fecha programada',
        solicitud.fec_programada ? new Date(solicitud.fec_programada).toLocaleDateString('es-CO') : '—',
        y + 1, 0);
    yDer = filaDato(doc, 'Fecha de inspección',
        new Date(inspeccion.fec_inspeccion).toLocaleString('es-CO'), y + 1, 1);
    y = Math.max(yIzq, yDer) + 4;

    // ====== UBICACIÓN ======
    y = seccion(doc, 'LUGAR DE PRODUCCIÓN', y);
    yIzq = filaDato(doc, 'Nombre', solicitud.nom_lugar_produccion, y, 0);
    yDer = filaDato(doc, 'Registro ICA', solicitud.nro_registro_ica || '—', y, 1);
    y = Math.max(yIzq, yDer);
    yIzq = filaDato(doc, 'Dirección', solicitud.direccion_lugar || '—', y + 1, 0);
    yDer = filaDato(doc, 'Vereda', solicitud.vereda_lugar || '—', y + 1, 1);
    y = Math.max(yIzq, yDer);
    yIzq = filaDato(doc, 'Municipio', solicitud.municipio_lugar || '—', y + 1, 0);
    yDer = filaDato(doc, 'Departamento', solicitud.departamento_lugar || '—', y + 1, 1);
    y = Math.max(yIzq, yDer) + 4;

    // ====== SOLICITANTE ======
    if (solicitante) {
        y = seccion(doc, 'SOLICITANTE (PRODUCTOR)', y);
        yIzq = filaDato(doc, 'Nombre', `${solicitante.nombres} ${solicitante.apellidos}`, y, 0);
        yDer = filaDato(doc, 'Identificación', solicitante.num_identificacion, y, 1);
        y = Math.max(yIzq, yDer);
        yIzq = filaDato(doc, 'Correo', solicitante.correo_electronico, y + 1, 0);
        yDer = filaDato(doc, 'Teléfono', solicitante.telefono || '—', y + 1, 1);
        y = Math.max(yIzq, yDer) + 4;
    }

    // ====== ASISTENTE ======
    if (asistente) {
        y = seccion(doc, 'ASISTENTE TÉCNICO ASIGNADO', y);
        yIzq = filaDato(doc, 'Nombre', `${asistente.nombres} ${asistente.apellidos}`, y, 0);
        yDer = filaDato(doc, 'Identificación', asistente.num_identificacion, y, 1);
        y = Math.max(yIzq, yDer);
        yIzq = filaDato(doc, 'Registro ICA', asistente.nro_registro_ica || '—', y + 1, 0);
        yDer = filaDato(doc, 'Tarjeta profesional', asistente.tarjeta_profesional || '—', y + 1, 1);
        y = Math.max(yIzq, yDer);
        yIzq = filaDato(doc, 'Correo', asistente.correo_electronico, y + 1, 0);
        yDer = filaDato(doc, 'Teléfono', asistente.telefono || '—', y + 1, 1);
        y = Math.max(yIzq, yDer) + 4;
    }

    // ====== DETALLE DEL LOTE ======
    if (y > 230) { doc.addPage(); y = 20; }
    y = seccion(doc, 'DETALLE DEL LOTE INSPECCIONADO', y);
    yIzq = filaDato(doc, 'Número de lote', inspeccion.numero_lote, y, 0);
    yDer = filaDato(doc, 'Estado fenológico', inspeccion.estado_fenologico, y, 1);
    y = Math.max(yIzq, yDer);
    yIzq = filaDato(doc, 'Especie', inspeccion.nom_especie, y + 1, 0);
    yDer = filaDato(doc, 'Variedad', inspeccion.nom_variedad, y + 1, 1);
    y = Math.max(yIzq, yDer);
    yIzq = filaDato(doc, 'Plantas evaluadas', inspeccion.cantidad_plantas_evaluadas, y + 1, 0);
    const totalInfest = inspeccion.hallazgos_plagas.reduce((s, h) => s + h.cantidad_plantas_infestadas, 0);
    yDer = filaDato(doc, 'Plantas infestadas (total)', totalInfest, y + 1, 1);
    y = Math.max(yIzq, yDer) + 4;

    // ====== OBSERVACIONES ======
    if (inspeccion.observaciones) {
        if (y > 250) { doc.addPage(); y = 20; }
        y = seccion(doc, 'OBSERVACIONES', y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const obs = doc.splitTextToSize(inspeccion.observaciones, pageWidth - 2 * MARGEN);
        doc.text(obs, MARGEN, y);
        y += obs.length * 4 + 4;
    }

    // ====== HALLAZGOS DE PLAGAS ======
    if (y > 240) { doc.addPage(); y = 20; }
    y = seccion(doc, 'HALLAZGOS DE PLAGAS', y);
    if (inspeccion.hallazgos_plagas.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text('Sin hallazgos de plagas registrados.', MARGEN, y);
        doc.setTextColor(0);
        y += 6;
    } else {
        autoTable(doc, {
            head: [['Plaga', 'Plantas Infestadas', '% Infestación']],
            body: inspeccion.hallazgos_plagas.map(h => [
                h.nom_plaga,
                h.cantidad_plantas_infestadas,
                `${h.porcentaje_infestacion}%`
            ]),
            startY: y,
            theme: 'grid',
            headStyles: { fillColor: COLOR_PRIMARIO, textColor: 255, fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            margin: { left: MARGEN, right: MARGEN }
        });
        y = doc.lastAutoTable.finalY + 6;
    }

    // ====== EVIDENCIAS FOTOGRÁFICAS ======
    if (inspeccion.evidencias_fotograficas && inspeccion.evidencias_fotograficas.length > 0) {
        if (y > 230) { doc.addPage(); y = 20; }
        y = seccion(doc, `EVIDENCIAS FOTOGRÁFICAS (${inspeccion.evidencias_fotograficas.length})`, y);

        const imgWidth = 80;
        const imgHeight = 60;
        const gap = 6;
        let xCol = MARGEN;
        let columna = 0;

        for (let i = 0; i < inspeccion.evidencias_fotograficas.length; i++) {
            const foto = inspeccion.evidencias_fotograficas[i];
            const datos = await cargarImagen(foto);
            if (!datos) continue;

            // Saltar página si no cabe
            if (y + imgHeight + 8 > 280) {
                doc.addPage();
                y = 20;
                columna = 0;
                xCol = MARGEN;
            }

            try {
                doc.addImage(datos.dataUrl, datos.formato, xCol, y, imgWidth, imgHeight, undefined, 'FAST');
            } catch (err) {
                console.warn('No se pudo agregar evidencia', i, err);
            }
            doc.setFontSize(7);
            doc.setTextColor(100);
            doc.text(`Evidencia ${i + 1}`, xCol, y + imgHeight + 4);
            doc.setTextColor(0);

            columna++;
            if (columna >= 2) {
                columna = 0;
                xCol = MARGEN;
                y += imgHeight + 10;
            } else {
                xCol = MARGEN + imgWidth + gap;
            }
        }
    }

    dibujarPiePagina(doc);
    doc.save(`inspeccion-${String(inspeccion._id).slice(-8)}.pdf`);
};


// ===========================================================
// PDF 3: REPORTE CONSOLIDADO POR SOLICITUD (TODOS LOS LOTES)
// ===========================================================
export const generarPdfConsolidadoSolicitud = async ({
    inspecciones, solicitud, solicitante, asistente
}) => {
    if (!inspecciones || inspecciones.length === 0) return;

    const doc = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = dibujarEncabezado(doc, 'Reporte Consolidado de Inspección Fitosanitaria');

    // ====== INFORMACIÓN GENERAL ======
    y = seccion(doc, 'INFORMACIÓN GENERAL DE LA VISITA', y);
    let yIzq = y, yDer = y;
    yIzq = filaDato(doc, 'ID Solicitud', `#${solicitud.id_solicitud}`, yIzq, 0);
    yDer = filaDato(doc, 'Estado solicitud', solicitud.estado, yDer, 1);
    y = Math.max(yIzq, yDer);
    yIzq = filaDato(doc, 'Motivo', solicitud.motivo, y + 1, 0);
    yDer = filaDato(doc, 'Lotes inspeccionados', inspecciones.length, y + 1, 1);
    y = Math.max(yIzq, yDer);
    yIzq = filaDato(doc, 'Fecha programada',
        solicitud.fec_programada ? new Date(solicitud.fec_programada).toLocaleDateString('es-CO') : '—',
        y + 1, 0);
    yDer = filaDato(doc, 'Fecha de inspección',
        new Date(inspecciones[0].fec_inspeccion).toLocaleString('es-CO'), y + 1, 1);
    y = Math.max(yIzq, yDer) + 4;

    // ====== UBICACIÓN ======
    y = seccion(doc, 'LUGAR DE PRODUCCIÓN', y);
    yIzq = filaDato(doc, 'Nombre', solicitud.nom_lugar_produccion, y, 0);
    yDer = filaDato(doc, 'Registro ICA', solicitud.nro_registro_ica || '—', y, 1);
    y = Math.max(yIzq, yDer);
    yIzq = filaDato(doc, 'Dirección', solicitud.direccion_lugar || '—', y + 1, 0);
    yDer = filaDato(doc, 'Vereda', solicitud.vereda_lugar || '—', y + 1, 1);
    y = Math.max(yIzq, yDer);
    yIzq = filaDato(doc, 'Municipio', solicitud.municipio_lugar || '—', y + 1, 0);
    yDer = filaDato(doc, 'Departamento', solicitud.departamento_lugar || '—', y + 1, 1);
    y = Math.max(yIzq, yDer) + 4;

    // ====== SOLICITANTE ======
    if (solicitante) {
        y = seccion(doc, 'SOLICITANTE (PRODUCTOR)', y);
        yIzq = filaDato(doc, 'Nombre', `${solicitante.nombres} ${solicitante.apellidos}`, y, 0);
        yDer = filaDato(doc, 'Identificación', solicitante.num_identificacion, y, 1);
        y = Math.max(yIzq, yDer);
        yIzq = filaDato(doc, 'Correo', solicitante.correo_electronico, y + 1, 0);
        yDer = filaDato(doc, 'Teléfono', solicitante.telefono || '—', y + 1, 1);
        y = Math.max(yIzq, yDer) + 4;
    }

    // ====== ASISTENTE ======
    if (asistente) {
        y = seccion(doc, 'ASISTENTE TÉCNICO ASIGNADO', y);
        yIzq = filaDato(doc, 'Nombre', `${asistente.nombres} ${asistente.apellidos}`, y, 0);
        yDer = filaDato(doc, 'Identificación', asistente.num_identificacion, y, 1);
        y = Math.max(yIzq, yDer);
        yIzq = filaDato(doc, 'Registro ICA', asistente.nro_registro_ica || '—', y + 1, 0);
        yDer = filaDato(doc, 'Tarjeta profesional', asistente.tarjeta_profesional || '—', y + 1, 1);
        y = Math.max(yIzq, yDer);
        yIzq = filaDato(doc, 'Correo', asistente.correo_electronico, y + 1, 0);
        yDer = filaDato(doc, 'Teléfono', asistente.telefono || '—', y + 1, 1);
        y = Math.max(yIzq, yDer) + 4;
    }

    // ====== TABLA RESUMEN POR LOTE ======
    if (y > 230) { doc.addPage(); y = 20; }
    y = seccion(doc, 'RESUMEN POR LOTE', y);
    autoTable(doc, {
        head: [['Lote', 'Especie/Variedad', 'Estado fenológico', 'Plantas Eval.', 'Plantas Inf.', '% Infestación']],
        body: inspecciones.map(i => {
            const infest = i.hallazgos_plagas.reduce((s, h) => s + h.cantidad_plantas_infestadas, 0);
            const porc = i.cantidad_plantas_evaluadas > 0
                ? ((infest / i.cantidad_plantas_evaluadas) * 100).toFixed(2)
                : 0;
            return [
                i.numero_lote,
                `${i.nom_especie} / ${i.nom_variedad}`,
                i.estado_fenologico,
                i.cantidad_plantas_evaluadas,
                infest,
                `${porc}%`
            ];
        }),
        startY: y,
        theme: 'grid',
        headStyles: { fillColor: COLOR_PRIMARIO, textColor: 255, fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        margin: { left: MARGEN, right: MARGEN }
    });
    y = doc.lastAutoTable.finalY + 4;

    // Totales globales
    const totalEval = inspecciones.reduce((s, i) => s + i.cantidad_plantas_evaluadas, 0);
    const totalInf = inspecciones.reduce((s, i) =>
        s + i.hallazgos_plagas.reduce((ss, h) => ss + h.cantidad_plantas_infestadas, 0), 0);
    const porcGlobal = totalEval > 0 ? ((totalInf / totalEval) * 100).toFixed(2) : 0;

    doc.setFillColor(240, 248, 240);
    doc.rect(MARGEN, y, pageWidth - 2 * MARGEN, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR_PRIMARIO);
    doc.text(
        `TOTAL VISITA: ${totalEval} plantas evaluadas  |  ${totalInf} infestadas  |  ${porcGlobal}% infestación global`,
        MARGEN + 2, y + 6
    );
    doc.setTextColor(0, 0, 0);
    y += 14;

    // ====== DETALLE POR LOTE ======
    for (let idx = 0; idx < inspecciones.length; idx++) {
        const insp = inspecciones[idx];
        if (y > 240) { doc.addPage(); y = 20; }

        y = seccion(doc, `LOTE ${idx + 1} DE ${inspecciones.length}: ${insp.numero_lote}`, y);

        yIzq = filaDato(doc, 'Especie', insp.nom_especie, y, 0);
        yDer = filaDato(doc, 'Variedad', insp.nom_variedad, y, 1);
        y = Math.max(yIzq, yDer);
        yIzq = filaDato(doc, 'Estado fenológico', insp.estado_fenologico, y + 1, 0);
        yDer = filaDato(doc, 'Plantas evaluadas', insp.cantidad_plantas_evaluadas, y + 1, 1);
        y = Math.max(yIzq, yDer) + 4;

        // Observaciones del lote
        if (insp.observaciones) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text('Observaciones:', MARGEN, y);
            y += 4;
            doc.setFont('helvetica', 'normal');
            const obs = doc.splitTextToSize(insp.observaciones, pageWidth - 2 * MARGEN);
            if (y + obs.length * 4 > 280) { doc.addPage(); y = 20; }
            doc.text(obs, MARGEN, y);
            y += obs.length * 4 + 4;
        }

        // Hallazgos del lote
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        if (y > 260) { doc.addPage(); y = 20; }
        doc.text('Hallazgos de plagas:', MARGEN, y);
        y += 3;
        if (insp.hallazgos_plagas.length === 0) {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text('Sin hallazgos registrados.', MARGEN + 2, y + 4);
            doc.setTextColor(0);
            y += 13;
        } else {
            autoTable(doc, {
                head: [['Plaga', 'Plantas Infestadas', '% Infestación']],
                body: insp.hallazgos_plagas.map(h => [
                    h.nom_plaga,
                    h.cantidad_plantas_infestadas,
                    `${h.porcentaje_infestacion}%`
                ]),
                startY: y + 2,
                theme: 'grid',
                headStyles: { fillColor: COLOR_PRIMARIO, textColor: 255, fontSize: 8 },
                bodyStyles: { fontSize: 8 },
                margin: { left: MARGEN, right: MARGEN }
            });
            y = doc.lastAutoTable.finalY + 4;
        }

        // Evidencias del lote
        if (insp.evidencias_fotograficas && insp.evidencias_fotograficas.length > 0) {
            if (y > 220) { doc.addPage(); y = 20; }
            y = seccion(doc, `EVIDENCIAS DEL LOTE ${insp.numero_lote} (${insp.evidencias_fotograficas.length})`, y);

            const imgWidth = 80;
            const imgHeight = 60;
            const gap = 6;
            let xCol = MARGEN;
            let columna = 0;

            for (let i = 0; i < insp.evidencias_fotograficas.length; i++) {
                const foto = insp.evidencias_fotograficas[i];
                const datos = await cargarImagen(foto);
                if (!datos) continue;

                if (y + imgHeight + 8 > 280) {
                    doc.addPage();
                    y = 20;
                    columna = 0;
                    xCol = MARGEN;
                }

                try {
                    doc.addImage(datos.dataUrl, datos.formato, xCol, y, imgWidth, imgHeight, undefined, 'FAST');
                } catch (err) {
                    console.warn(`No se pudo agregar evidencia ${i} del lote ${insp.numero_lote}`, err);
                }
                
                doc.setFontSize(7);
                doc.setTextColor(100);
                doc.text(`Evidencia ${i + 1}`, xCol, y + imgHeight + 4);
                doc.setTextColor(0);

                columna++;
                if (columna >= 2) {
                    columna = 0;
                    xCol = MARGEN;
                    y += imgHeight + 10;
                } else {
                    xCol = MARGEN + imgWidth + gap;
                }
            }
            // Si quedó la última fila a medias, mover el cursor abajo
            if (columna === 1) {
                y += imgHeight + 10;
            }
        }

        y += 4; // Separación entre lotes
    }

    dibujarPiePagina(doc);
    doc.save(`inspeccion-consolidada-sol${solicitud.id_solicitud}.pdf`);
};