// routes/search.js
import express from 'express';
import { Product } from '../models/index.js';
import { Op } from 'sequelize';

const router = express.Router();

// Buscar productos
router.get('/products', async (req, res) => {
  try {
    const { q, categoria } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Término de búsqueda requerido'
      });
    }

    let whereClause = {
      disponible: true,
      nombre: {
        [Op.like]: `%${q}%`
      }
    };

    if (categoria && categoria !== 'all') {
      whereClause.categoria = categoria;
    }

    const products = await Product.findAll({
      where: whereClause,
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      termino: q,
      cantidad: products.length,
      products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en la búsqueda'
    });
  }
});

export default router;