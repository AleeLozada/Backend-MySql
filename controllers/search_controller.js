// controllers/search_controller.js
import { product, category } from '../models/index.js';
import { Op } from 'sequelize';

// Constantes para ordenamiento
const SORT_OPTIONS = {
  PRICE_ASC: 'price_asc',
  PRICE_DESC: 'price_desc', 
  NAME_ASC: 'name_asc',
  NAME_DESC: 'name_desc',
  NEWEST: 'newest',
  OLDEST: 'oldest'
};

// Constantes para filtros
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export const search_products = async (req, res) => {
  try {
    const { 
      q, 
      categoria, 
      min_price, 
      max_price, 
      sort_by = SORT_OPTIONS.NEWEST,
      limit = DEFAULT_LIMIT,
      page = 1,
      destacados,
      promociones
    } = req.query;
    
    // Validar parámetros
    const parsed_limit = Math.min(parseInt(limit) || DEFAULT_LIMIT, MAX_LIMIT);
    const parsed_page = Math.max(parseInt(page) || 1, 1);
    const offset = (parsed_page - 1) * parsed_limit;

    let where_clause = { disponible: true };
    
    // Búsqueda por texto (mejorada)
    if (q && q.trim()) {
      const search_term = q.trim();
      where_clause[Op.or] = [
        { nombre: { [Op.like]: `%${search_term}%` } },
        { descripcion: { [Op.like]: `%${search_term}%` } },
        { categoria: { [Op.like]: `%${search_term}%` } }
      ];
    }
    
    // Filtro por categoría (mejorado)
    if (categoria && categoria !== 'all' && categoria !== 'todas') {
      where_clause.categoria = categoria;
    }
    
    // Filtro por precio (mejorado)
    if (min_price || max_price) {
      where_clause.precio = {};
      const min = parseFloat(min_price);
      const max = parseFloat(max_price);
      
      if (!isNaN(min) && min >= 0) {
        where_clause.precio[Op.gte] = min;
      }
      if (!isNaN(max) && max >= 0) {
        where_clause.precio[Op.lte] = max;
      }
      
      // Si solo hay un filtro y es inválido, eliminar el objeto
      if (Object.keys(where_clause.precio).length === 0) {
        delete where_clause.precio;
      }
    }
    
    // Filtro por productos destacados
    if (destacados === 'true') {
      where_clause.destacado = true;
    }
    
    // Filtro por productos en promoción
    if (promociones === 'true') {
      where_clause.promocion = true;
    }
    
    // Ordenamiento (mejorado)
    let order = get_sort_order(sort_by);
    
    // Búsqueda con paginación
    const { count, rows: products } = await product.findAndCountAll({
      where: where_clause,
      order: order,
      limit: parsed_limit,
      offset: offset,
      include: [
        {
          model: category,
          as: 'category',
          attributes: ['id', 'nombre', 'slug'],
          where: { activa: true },
          required: false
        }
      ]
    });
    
    const total_pages = Math.ceil(count / parsed_limit);
    
    res.json({
      success: true,
      data: {
        products,
        pagination: {
          total: count,
          page: parsed_page,
          total_pages,
          limit: parsed_limit,
          has_next: parsed_page < total_pages,
          has_prev: parsed_page > 1
        },
        filters: {
          term: q,
          categoria,
          min_price: min_price ? parseFloat(min_price) : null,
          max_price: max_price ? parseFloat(max_price) : null,
          sort_by,
          destacados: destacados === 'true',
          promociones: promociones === 'true'
        }
      }
    });
    
  } catch (error) {
    console.error('Error en la búsqueda de productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al realizar la búsqueda',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Búsqueda rápida (solo por nombre)
export const quick_search = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Término de búsqueda requerido'
      });
    }
    
    const search_term = q.trim();
    const parsed_limit = Math.min(parseInt(limit) || 10, 20);
    
    const products = await product.findAll({
      where: {
        disponible: true,
        nombre: { [Op.like]: `%${search_term}%` }
      },
      order: [
        ['nombre', 'ASC'],
        ['precio', 'ASC']
      ],
      limit: parsed_limit,
      attributes: ['id', 'nombre', 'precio', 'imagen', 'categoria', 'promocion', 'precio_promocion']
    });
    
    res.json({
      success: true,
      term: search_term,
      cantidad: products.length,
      products
    });
    
  } catch (error) {
    console.error('Error en búsqueda rápida:', error);
    res.status(500).json({
      success: false,
      message: 'Error en la búsqueda rápida'
    });
  }
};

// Obtener sugerencias de búsqueda
export const get_search_suggestions = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        suggestions: []
      });
    }
    
    const search_term = q.trim();
    
    // Buscar productos que coincidan
    const products = await product.findAll({
      where: {
        disponible: true,
        nombre: { [Op.like]: `%${search_term}%` }
      },
      limit: 5,
      attributes: ['id', 'nombre', 'categoria'],
      order: [['nombre', 'ASC']]
    });
    
    // Buscar categorías que coincidan
    const categories = await category.findAll({
      where: {
        activa: true,
        nombre: { [Op.like]: `%${search_term}%` }
      },
      limit: 3,
      attributes: ['id', 'nombre', 'slug'],
      order: [['nombre', 'ASC']]
    });
    
    const suggestions = [
      ...products.map(p => ({
        type: 'product',
        id: p.id,
        nombre: p.nombre,
        categoria: p.categoria
      })),
      ...categories.map(c => ({
        type: 'category',
        id: c.id,
        nombre: c.nombre,
        slug: c.slug
      }))
    ];
    
    res.json({
      success: true,
      term: search_term,
      suggestions: suggestions.slice(0, 8) // Máximo 8 sugerencias
    });
    
  } catch (error) {
    console.error('Error al obtener sugerencias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener sugerencias'
    });
  }
};

// Función auxiliar para ordenamiento
const get_sort_order = (sort_by) => {
  switch (sort_by) {
    case SORT_OPTIONS.PRICE_ASC:
      return [['precio', 'ASC']];
    case SORT_OPTIONS.PRICE_DESC:
      return [['precio', 'DESC']];
    case SORT_OPTIONS.NAME_ASC:
      return [['nombre', 'ASC']];
    case SORT_OPTIONS.NAME_DESC:
      return [['nombre', 'DESC']];
    case SORT_OPTIONS.OLDEST:
      return [['created_at', 'ASC']];
    case SORT_OPTIONS.NEWEST:
    default:
      return [['created_at', 'DESC']];
  }
};

// Obtener filtros disponibles para la búsqueda actual
export const get_search_filters = async (req, res) => {
  try {
    const { q, categoria } = req.query;
    
    let where_clause = { disponible: true };
    
    if (q && q.trim()) {
      const search_term = q.trim();
      where_clause[Op.or] = [
        { nombre: { [Op.like]: `%${search_term}%` } },
        { descripcion: { [Op.like]: `%${search_term}%` } }
      ];
    }
    
    if (categoria && categoria !== 'all') {
      where_clause.categoria = categoria;
    }
    
    // Obtener rangos de precios
    const price_stats = await product.findOne({
      where: where_clause,
      attributes: [
        [product.sequelize.fn('MIN', product.sequelize.col('precio')), 'min_price'],
        [product.sequelize.fn('MAX', product.sequelize.col('precio')), 'max_price']
      ]
    });
    
    // Obtener categorías disponibles
    const available_categories = await product.findAll({
      where: where_clause,
      attributes: ['categoria'],
      group: ['categoria'],
      order: [['categoria', 'ASC']]
    });
    
    res.json({
      success: true,
      filters: {
        price_range: {
          min: parseFloat(price_stats?.dataValues?.min_price || 0),
          max: parseFloat(price_stats?.dataValues?.max_price || 1000)
        },
        categories: available_categories.map(cat => cat.categoria),
        total_products: await product.count({ where: where_clause })
      }
    });
    
  } catch (error) {
    console.error('Error al obtener filtros:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener filtros de búsqueda'
    });
  }
};