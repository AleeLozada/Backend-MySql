// routes/categories.js
import express from 'express';
import { Category, Product } from '../models/index.js';

const router = express.Router();

// Obtener todas las categorías
router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { activa: true },
      order: [['nombre', 'ASC']]
    });
    
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías'
    });
  }
});

// Obtener productos por categoría
router.get('/:slug/products', async (req, res) => {
  try {
    const category = await Category.findOne({
      where: { slug: req.params.slug, activa: true }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    const products = await Product.findAll({
      where: {
        categoryId: category.id,
        disponible: true
      },
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      category: category.nombre,
      products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos'
    });
  }
});

export default router;