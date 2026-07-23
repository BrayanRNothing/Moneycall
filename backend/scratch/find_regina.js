require('dotenv').config();
const { db } = require('../config/database');

async function main() {
    try {
        console.log('Searching for phone 8124191605 in clientes...');
        const rows = await db.prepare('SELECT * FROM clientes WHERE telefono LIKE ? OR telefono2 LIKE ?')
            .all('%8124191605%', '%8124191605%');

        console.log('Results:', JSON.stringify(rows, null, 2));

        if (rows.length > 0) {
            const clientIds = rows.map(r => r.id);
            console.log('\nSearching activities for these client IDs...');
            const activities = await db.prepare('SELECT id, cliente, tipo, vendedor, descripcion, resultado, "createdAt", fecha FROM actividades WHERE cliente IN (' + clientIds.join(',') + ') ORDER BY id DESC LIMIT 5')
                .all();
            console.log('Recent activities:', JSON.stringify(activities, null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

main();
