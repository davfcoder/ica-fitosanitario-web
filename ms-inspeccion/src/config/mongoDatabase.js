const mongoose = require('mongoose');
require('dotenv').config();

const connectMongo = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ [MS Inspección] MongoDB conectado - BD: ica_inspecciones');
    } catch (error) {
        console.error('❌ [MS Inspección] Error MongoDB:', error.message);
        process.exit(1);
    }
};

module.exports = connectMongo;