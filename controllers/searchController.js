// controllers/searchController.js
import { Product } from '../models/index.js';
import { Op } from 'sequelize';

export const searchProducts = async (req, res) => {
  try {
    const { q, categoria, minPrice, maxPrice, sortBy } = req.query;
    
    let whereClause = { disponible: true };
    
    // Búsqueda por texto
    if (q) {
      whereClause[Op.or] = [
        { nombre: { [Op.like]: `%${q}%` } },
        { descripcion: { [Op.like]: `%${q}%` } }
      ];
    }
    
    // Filtro por categoría
    if (categoria && categoria !== 'all') {
      whereClause.categoria = categoria;
    }
    
    // Filtro por precio
    if (minPrice || maxPrice) {
      whereClause.precio = {};
      if (minPrice) whereClause.precio[Op.gte] = parseFloat(minPrice);
      if (maxPrice) whereClause.precio[Op.lte] = parseFloat(maxPrice);
    }
    
    // Ordenamiento
    let order = [];
    switch (sortBy) {
      case 'price_asc':
        order = [['precio', 'ASC']];
        break;
      case 'price_desc':
        order = [['precio', 'DESC']];
        break;
      case 'name':
        order = [['nombre', 'ASC']];
        break;
      default:
        order = [['createdAt', 'DESC']];
    }
    
    const products = await Product.findAll({
      where: whereClause,
      order: order
    });
    
    res.json({
      success: true,
      cantidad: products.length,
      products
    });
  } catch (error) {
    console.error('Error en la búsqueda:', error);
    res.status(500).json({
      success: false,
      message: 'Error en la búsqueda'
    });
  }
};