const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { auth } = require('../middleware/auth');

// @route   GET api/notificaciones
// @desc    Obtener notificaciones no leídas del usuario autenticado
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const notificaciones = await db.prepare('SELECT * FROM notificaciones WHERE usuario_id = ? AND leido = 0 ORDER BY id DESC').all(req.usuario.id);
        res.json(notificaciones);
    } catch (error) {
        console.error('Error al obtener notificaciones:', error);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
});

// @route   PUT api/notificaciones/marcar-leida/:id
// @desc    Marcar notificación como leída
// @access  Private
router.put('/marcar-leida/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.prepare('UPDATE notificaciones SET leido = 1 WHERE id = ? AND usuario_id = ?').run(id, req.usuario.id);
        
        if (result.changes === 0) {
            return res.status(404).json({ mensaje: 'Notificación no encontrada o no pertenece al usuario' });
        }
        res.json({ mensaje: 'Notificación marcada como leída' });
    } catch (error) {
        console.error('Error al marcar notificación:', error);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
});

// @route   PUT api/notificaciones/marcar-todas-leidas
// @desc    Marcar todas las notificaciones del usuario como leídas
// @access  Private
router.put('/marcar-todas-leidas/todo', auth, async (req, res) => {
    try {
        await db.prepare('UPDATE notificaciones SET leido = 1 WHERE usuario_id = ? AND leido = 0').run(req.usuario.id);
        res.json({ mensaje: 'Todas las notificaciones marcadas como leídas' });
    } catch (error) {
        console.error('Error al marcar todas las notificaciones:', error);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
});

module.exports = router;
