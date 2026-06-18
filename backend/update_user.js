require('dotenv').config();
const { db } = require('./config/database');
const id = 8;
const rol = 'asignador';
db.prepare('UPDATE usuarios SET rol=? WHERE id=?').run(rol, id);
const u = db.prepare('SELECT id, usuario, rol FROM usuarios WHERE id=?').get(id);
console.log('Updated user:', u);
process.exit(0);
