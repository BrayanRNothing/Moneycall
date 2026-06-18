const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { auth } = require('../middleware/auth');
const { toMongoFormat } = require('../lib/helpers');

router.get('/', auth, async (req, res) => {
    try {
        const rows = await db.prepare('SELECT * FROM ventas ORDER BY fecha DESC LIMIT 100').all();
        res.json(rows.map(toMongoFormat));
    } catch (error) {
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
});

// GET /api/ventas/cliente/:clienteId — Obtener ventas de un cliente específico
router.get('/cliente/:clienteId', auth, async (req, res) => {
    try {
        const clienteId = parseInt(req.params.clienteId);
        const rows = await db.prepare(`
            SELECT v.*, u.nombre as vendedorNombre 
            FROM ventas v
            LEFT JOIN usuarios u ON v.vendedor = u.id
            WHERE v.cliente = ? 
            ORDER BY v.fecha DESC
        `).all(clienteId);
        res.json(rows.map(toMongoFormat));
    } catch (error) {
        console.error('Error al obtener ventas de cliente:', error);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const { cliente, monto, estado, notas, pdf_url, fecha } = req.body;
        if (!cliente || monto == null) return res.status(400).json({ mensaje: 'Cliente y monto requeridos' });
        const vendedorId = parseInt(req.usuario.id);
        const fechaVenta = fecha ? new Date(fecha).toISOString() : new Date().toISOString();
        await db.prepare('INSERT INTO ventas (cliente, vendedor, monto, estado, notas, pdf_url, fecha) VALUES (?, ?, ?, ?, ?, ?, ?)')
            .run(parseInt(cliente), vendedorId, parseFloat(monto), estado || 'completado', notas || '', pdf_url || null, fechaVenta);
        const row = await db.prepare('SELECT * FROM ventas ORDER BY id DESC LIMIT 1').get();
        res.status(201).json({ mensaje: 'Venta registrada', venta: toMongoFormat(row) || row });
    } catch (error) {
        console.error('Error al registrar venta:', error);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
});

// PUT /api/ventas/:id/pdf — Actualizar comprobante PDF de una venta registrada
router.put('/:id/pdf', auth, async (req, res) => {
    try {
        const saleId = parseInt(req.params.id);
        const { pdf_url } = req.body;
        if (!pdf_url) return res.status(400).json({ mensaje: 'URL de PDF requerida' });
        
        await db.prepare('UPDATE ventas SET pdf_url = ? WHERE id = ?').run(pdf_url, saleId);
        res.json({ mensaje: 'PDF de venta actualizado' });
    } catch (error) {
        console.error('Error al actualizar PDF de venta:', error);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
});

// DELETE /api/ventas/:id — Eliminar una venta registrada
router.delete('/:id', auth, async (req, res) => {
    try {
        const saleId = parseInt(req.params.id);
        
        // 1. Obtener la información de la venta para poder identificar la actividad
        const venta = await db.prepare('SELECT * FROM ventas WHERE id = ?').get(saleId);
        if (!venta) {
            return res.status(404).json({ mensaje: 'Venta no encontrada' });
        }

        // 2. Eliminar la venta de la tabla 'ventas'
        await db.prepare('DELETE FROM ventas WHERE id = ?').run(saleId);

        // 3. Eliminar la actividad correspondiente
        // Buscamos una actividad que coincida en cliente, vendedor, tipo ('venta' o 'suscripcion')
        // y que contenga el monto de la venta en la descripción o coincida en las notas.
        const likeMonto = `%${venta.monto}%`;
        await db.prepare(`
            DELETE FROM actividades 
            WHERE cliente = ? 
              AND vendedor = ? 
              AND tipo IN ('venta', 'suscripcion')
              AND (notas = ? OR descripcion LIKE ?)
        `).run(venta.cliente, venta.vendedor, venta.notas || '', likeMonto);

        res.json({ mensaje: 'Venta y actividad asociada eliminadas' });
    } catch (error) {
        console.error('Error al eliminar venta:', error);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
});

module.exports = router;
