// controllers/admin_controller.js
import { order, user, product, category, orderitem } from '../models/index.js'; // ✅ Agregar orderitem
import { Op } from 'sequelize';

export const get_dashboard_stats = async (req, res) => {
  try {
    const [
      total_users,
      total_products,
      total_orders,
      revenue,
      pending_orders,
      delivered_orders
    ] = await Promise.all([
      user.count(),
      product.count(),
      order.count(),
      order.sum('total', { where: { estado: 'entregado' } }),
      order.count({ where: { estado: 'pendiente' } }),
      order.count({ where: { estado: 'entregado' } })
    ]);

    // Pedidos recientes con más información
    const recent_orders = await order.findAll({
      include: [{
        model: user,
        as: 'user',
        attributes: ['id', 'nombre', 'email']
      }],
      order: [['created_at', 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      stats: {
        total_users,
        total_products,
        total_orders,
        pending_orders,
        delivered_orders,
        revenue: revenue || 0,
        average_order_value: total_orders > 0 ? (revenue || 0) / delivered_orders : 0 // ✅ Corregido: usar delivered_orders
      },
      recent_orders
    });
  } catch (error) {
    console.error('Error al cargar estadísticas del dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar estadísticas del dashboard'
    });
  }
};

export const get_recent_orders = async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const parsed_limit = parseInt(limit);

    const { count, rows: orders } = await order.findAndCountAll({
      include: [{
        model: user,
        as: 'user',
        attributes: ['id', 'nombre', 'email', 'telefono']
      }],
      order: [['created_at', 'DESC']],
      limit: parsed_limit,
      offset: offset
    });

    res.json({
      success: true,
      cantidad: orders.length,
      total: count,
      page: parseInt(page),
      total_pages: Math.ceil(count / parsed_limit),
      orders
    });
  } catch (error) {
    console.error('Error al cargar pedidos recientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar pedidos recientes'
    });
  }
};

export const get_all_users = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      role,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const parsed_limit = parseInt(limit);

    // Construir where clause
    const where_clause = {};
    
    if (search) {
      where_clause[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    if (role && role !== 'all') {
      where_clause.role = role;
    }

    const { count, rows: users } = await user.findAndCountAll({
      where: where_clause,
      attributes: { exclude: ['password'] },
      order: [[sort_by, sort_order.toUpperCase()]],
      limit: parsed_limit,
      offset: offset
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total: count,
          page: parseInt(page),
          total_pages: Math.ceil(count / parsed_limit),
          has_next: parseInt(page) < Math.ceil(count / parsed_limit),
          has_prev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar usuarios'
    });
  }
};

export const update_user_role = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // ✅ VALIDACIÓN: ID debe ser número
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido'
      });
    }

    // ✅ VALIDACIÓN: Rol válido
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rol no válido. Debe ser "user" o "admin"'
      });
    }

    const user_data = await user.findByPk(id);
    
    if (!user_data) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // ✅ VALIDACIÓN: No permitir cambiar el propio rol
    if (parseInt(id) === parseInt(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'No puedes cambiar tu propio rol'
      });
    }

    await user_data.update({ role });

    // Obtener usuario actualizado sin password
    const updated_user = await user.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      message: `Rol de usuario actualizado a: ${role}`,
      user: updated_user
    });
  } catch (error) {
    console.error('Error al actualizar rol de usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar rol de usuario'
    });
  }
};

export const get_all_products = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      categoria,
      disponible,
      search 
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const parsed_limit = parseInt(limit);

    // Construir where clause
    const where_clause = {};
    
    if (categoria && categoria !== 'all') {
      where_clause.categoria = categoria;
    }

    if (disponible !== undefined) {
      where_clause.disponible = disponible === 'true';
    }

    if (search) {
      where_clause[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { descripcion: { [Op.like]: `%${search}%` } }
      ];
    }

    // ✅ CORREGIDO: Si no tienes relación con category, usar solo atributos
    const { count, rows: products } = await product.findAndCountAll({
      where: where_clause,
      // ❌ QUITAR include de category si no existe la relación
      order: [['created_at', 'DESC']],
      limit: parsed_limit,
      offset: offset
    });

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          total: count,
          page: parseInt(page),
          total_pages: Math.ceil(count / parsed_limit),
          has_next: parseInt(page) < Math.ceil(count / parsed_limit),
          has_prev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error al cargar productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar productos'
    });
  }
};

// Función adicional: Obtener estadísticas avanzadas (VERSIÓN CORREGIDA)
export const get_advanced_stats = async (req, res) => {
  try {
    // Estadísticas de órdenes por mes (últimos 6 meses) - VERSIÓN CORREGIDA
    const six_months_ago = new Date();
    six_months_ago.setMonth(six_months_ago.getMonth() - 6);

    // ✅ CORREGIDO: Usar funciones de Sequelize compatibles
    const monthly_orders = await order.findAll({
      where: {
        created_at: {
          [Op.gte]: six_months_ago
        }
      },
      attributes: [
        [order.sequelize.fn('YEAR', order.sequelize.col('created_at')), 'year'],
        [order.sequelize.fn('MONTH', order.sequelize.col('created_at')), 'month'],
        [order.sequelize.fn('COUNT', order.sequelize.col('id')), 'order_count'],
        [order.sequelize.fn('SUM', order.sequelize.col('total')), 'revenue']
      ],
      group: ['year', 'month'],
      order: [['year', 'ASC'], ['month', 'ASC']],
      raw: true
    });

    // ✅ CORREGIDO: Productos más vendidos usando orderitems
    const top_products_data = await orderitem.findAll({
      attributes: [
        'product_id',
        [orderitem.sequelize.fn('SUM', orderitem.sequelize.col('cantidad')), 'total_sold']
      ],
      include: [{
        model: product,
        as: 'product',
        attributes: ['id', 'nombre', 'categoria']
      }],
      group: ['product_id'],
      order: [[orderitem.sequelize.fn('SUM', orderitem.sequelize.col('cantidad')), 'DESC']],
      limit: 10,
      raw: false // ✅ Importante para poder acceder a las relaciones
    });

    // ✅ CORREGIDO: Usuarios más activos
    const top_users_data = await order.findAll({
      attributes: [
        'user_id',
        [order.sequelize.fn('COUNT', order.sequelize.col('id')), 'order_count'],
        [order.sequelize.fn('SUM', order.sequelize.col('total')), 'total_spent']
      ],
      include: [{
        model: user,
        as: 'user',
        attributes: ['id', 'nombre', 'email']
      }],
      group: ['user_id'],
      order: [[order.sequelize.fn('COUNT', order.sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: false
    });

    res.json({
      success: true,
      stats: {
        monthly_orders: monthly_orders.map(item => ({
          period: `${item.year}-${String(item.month).padStart(2, '0')}`,
          order_count: parseInt(item.order_count) || 0,
          revenue: parseFloat(item.revenue) || 0
        })),
        top_products: top_products_data.map(item => ({
          id: item.product?.id,
          nombre: item.product?.nombre,
          categoria: item.product?.categoria,
          total_sold: parseInt(item.get('total_sold')) || 0
        })),
        top_users: top_users_data.map(item => ({
          id: item.user?.id,
          nombre: item.user?.nombre,
          email: item.user?.email,
          order_count: parseInt(item.get('order_count')) || 0,
          total_spent: parseFloat(item.get('total_spent')) || 0
        }))
      }
    });
  } catch (error) {
    console.error('Error al cargar estadísticas avanzadas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar estadísticas avanzadas',
      // Solo en desarrollo mostrar el error completo
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};