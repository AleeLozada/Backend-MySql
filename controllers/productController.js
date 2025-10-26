// controllers/productController.js
import { Product } from '../models/index.js';
import { Op } from 'sequelize';

export const getProducts = async (req, res) => {
  try {
    const { categoria, destacados, promociones } = req.query;
    
    let whereClause = { disponible: true };
    
    if (categoria && categoria !== 'all') {
      whereClause.categoria = categoria;
    }
    
    if (destacados === 'true') {
      whereClause.destacado = true;
    }
    
    if (promociones === 'true') {
      whereClause.promocion = true;
    }

    const products = await Product.findAll({ 
      where: whereClause,
      order: [['nombre', 'ASC']]
    });
    
    res.json({
      success: true,
      cantidad: products.length,
      products
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar productos'
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar producto'
    });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Product.findAll({
      attributes: ['categoria'],
      group: ['categoria'],
      where: { disponible: true }
    });
    
    const categoryNames = categories.map(cat => cat.categoria);

    res.json({
      success: true,
      categories: categoryNames
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar categorías'
    });
  }
};

export const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      product
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear producto'
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    await product.update(req.body);
    
    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      product
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar producto'
    });
  }
};