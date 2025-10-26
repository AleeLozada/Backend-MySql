// controllers/adminController.js
import { Order, Product, User, OrderItem } from '../models/index.js';
import { Op } from 'sequelize';

export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Estadísticas generales
    const totalOrders = await Order.count();
    const totalProducts = await Product.count();
    const totalUsers = await User.count();
    
    // Pedidos de hoy
    const todayOrders = await Order.count({
      where: {
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });
    
    // Ingresos de hoy
    const todayRevenueResult = await Order.sum('total', {
      where: {
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        },
        estado: {
          [Op.ne]: 'cancelado'
        }
      }
    });

    // Pedidos por estado
    const ordersByStatus = await Order.findAll({
      attributes: [
        'estado',
        [Order.sequelize.fn('COUNT', Order.sequelize.col('id')), 'count']
      ],
      group: ['estado'],
      raw: true
    });

    // Productos más vendidos
    const topProducts = await OrderItem.findAll({
      attributes: [
        'productId',
        [OrderItem.sequelize.fn('SUM', OrderItem.sequelize.col('cantidad')), 'totalVendido']
      ],
      include: [{
        model: Product,
        as: 'product',
        attributes: ['nombre']
      }],
      group: ['productId'],
      order: [[OrderItem.sequelize.fn('SUM', OrderItem.sequelize.col('cantidad')), 'DESC']],
      limit: 5,
      raw: true
    });

    res.json({
      success: true,
      stats: {
        totalOrders,
        totalProducts,
        totalUsers,
        todayOrders,
        todayRevenue: todayRevenueResult || 0
      },
      ordersByStatus,
      topProducts
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};

export const getRecentOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['nombre', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Error al obtener pedidos recientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedidos recientes'
    });
  }
};