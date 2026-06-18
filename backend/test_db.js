require('dotenv').config();
const { db } = require('./config/database');
(async () => {
    try {
        const users = await db.prepare('SELECT id, usuario, nombre, "equipo_id" FROM usuarios').all();
        const equipos = await db.prepare('SELECT id, nombre, owner_id FROM equipos').all();
        console.log('Users:', users);
        console.log('Equipos:', equipos);
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
})();
