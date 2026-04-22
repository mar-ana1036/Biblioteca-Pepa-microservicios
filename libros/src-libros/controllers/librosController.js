const { Router } = require('express');
const router = Router();
const librosModel = require('../models/librosModel');

// 1. OBTENER TODOS
router.get('/libros', async (req, res) => {
    try {
        const result = await librosModel.traerLibros();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener libros" });
    }
});

// 2. OBTENER UNO POR CODIGO
router.get('/libros/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        const result = await librosModel.traerLibro(codigo);
        if (!result[0]) return res.status(404).json({ error: "Libro no encontrado" });
        res.status(200).json(result[0]);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener libro" });
    }
});

// 3. ACTUALIZAR CANTIDAD DISPONIBLE (PUT)
router.put('/libros/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        const { cantidad_disponible } = req.body;
        if (cantidad_disponible < 0) {
            return res.status(400).json({ error: "La cantidad disponible no puede ser menor de cero" });
        }
        await librosModel.actualizarLibro(codigo, cantidad_disponible);
        res.status(200).json({ mensaje: "Cantidad disponible actualizada" });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar libro" });
    }
});

// 4. CREAR LIBRO (POST)
router.post('/libros', async (req, res) => {
    try {
        const { codigo, titulo, autor, genero, cantidad_disponible } = req.body;
        await librosModel.crearLibro(codigo, titulo, autor, genero, cantidad_disponible);
        res.status(201).json({ mensaje: "Libro creado con éxito" });
    } catch (error) {
        res.status(500).json({ error: "Error al crear libro" });
    }
});

// 5. ELIMINAR LIBRO (DELETE)
router.delete('/libros/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        await librosModel.eliminarLibro(codigo);
        res.status(200).json({ mensaje: "Libro eliminado con éxito" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar libro" });
    }
});

module.exports = router;
