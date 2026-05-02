// Script de un solo uso para reparar nom_asistente en documentos antiguos.
// Ejecutar desde la carpeta ms-inspeccion: node scripts/fixNomAsistente.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const mysql = require('mysql2/promise');
const InspeccionFitosanitaria = require('../src/models/InspeccionFitosanitaria');

(async () => {
    try {
        // Conectar Mongo
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ Conectado a MongoDB');

        // Conectar MySQL
        const pool = await mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        console.log('✓ Conectado a MySQL');

        // Encontrar inspecciones con nom_asistente = "Asistente"
        const malas = await InspeccionFitosanitaria.find({ nom_asistente: 'Asistente' });
        console.log(`Encontradas ${malas.length} inspecciones con nombre incorrecto.`);

        let reparadas = 0;
        for (const insp of malas) {
            const [rows] = await pool.execute(
                'SELECT nombres, apellidos FROM Usuarios WHERE id_usuario = ?',
                [insp.id_usuario_asistente]
            );
            if (rows.length > 0) {
                const nombreReal = `${rows[0].nombres} ${rows[0].apellidos}`.trim();
                insp.nom_asistente = nombreReal;
                await insp.save();
                console.log(`  ✓ Inspección ${insp._id} → ${nombreReal}`);
                reparadas++;
            } else {
                console.log(`  ⚠ Usuario ${insp.id_usuario_asistente} no encontrado para inspección ${insp._id}`);
            }
        }

        console.log(`\n✅ Reparación completada: ${reparadas} de ${malas.length} inspecciones actualizadas.`);
        await pool.end();
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
})();