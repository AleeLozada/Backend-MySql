// controllers/product_controller.js
import { product } from '../models/index.js';
import { Op } from 'sequelize';
import fs from 'fs'; // ✅ AGREGAR para manejar archivos

export const get_products = async (req, res) => {
  try {
    const { categoria, destacados, promociones } = req.query;
    
    let where_clause = { disponible: true };
    
    if (categoria && categoria !== 'all') {
      where_clause.categoria = categoria;
    }
    
    if (destacados === 'true') {
      where_clause.destacado = true;
    }
    
    if (promociones === 'true') {
      where_clause.promocion = true;
    }

    const products = await product.findAll({ 
      where: where_clause,
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

export const get_product_by_id = async (req, res) => {
  try {
    const product_data = await product.findByPk(req.params.id);
    
    if (!product_data) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    res.json({
      success: true,
      product: product_data
    });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar producto'
    });
  }
};

export const get_product_categories = async (req, res) => {
  try {
    const categories = await product.findAll({
      attributes: ['categoria'],
      group: ['categoria'],
      where: { disponible: true }
    });
    
    const category_names = categories.map(cat => cat.categoria);

    res.json({
      success: true,
      categories: category_names
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar categorías'
    });
  }
};

export const create_product = async (req, res) => {
  try {
    const { 
      nombre, 
      descripcion, 
      precio, 
      categoria, 
      disponible = true,
      destacado = false,
      promocion = false,
      precio_promocion = null
    } = req.body;

    // Manejar la imagen subida
    const imagen = req.file ? `/uploads/products/${req.file.filename}` : '';

    // Validaciones
    if (!nombre || !precio || !categoria) {
      // Si se subió archivo pero hay error, eliminarlo
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Nombre, precio y categoría son requeridos'
      });
    }

    const nuevo_producto = await product.create({
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || '',
      precio: parseFloat(precio),
      categoria,
      imagen,
      disponible: Boolean(disponible),
      destacado: Boolean(destacado),
      promocion: Boolean(promocion),
      precio_promocion: precio_promocion ? parseFloat(precio_promocion) : null
    });

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      product: nuevo_producto
    });

  } catch (error) {
    // Si hay error, eliminar archivo subido
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error al crear producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear producto'
    });
  }
};

export const update_product = async (req, res) => {
  try {
    const product_data = await product.findByPk(req.params.id);
    
    if (!product_data) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    await product_data.update(req.body);
    
    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      product: product_data
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar producto'
    });
  }
};

export const delete_product = async (req, res) => {
  try {
    const product_data = await product.findByPk(req.params.id);
    
    if (!product_data) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    await product_data.destroy();
    
    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto'
    });
  }
};