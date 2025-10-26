// routes/admin.js
import express from 'express';
import { Order, User, Product } from '../models/index.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router = express.Router();

// Todas las rutas requieren ser admin
router.use(protect, restrictTo('admin'));

// Estadísticas del dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalProducts = await Product.count();
    const totalOrders = await Order.count();
    
    const recentOrders = await Order.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['nombre', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    const revenue = await Order.sum('total', {
      where: {
        estado: 'entregado'
      }
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        revenue: revenue || 0
      },
      recentOrders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al cargar estadísticas'
    });
  }
});

// Pedidos recientes
router.get('/recent-orders', async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['nombre', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    res.json({
      success: true,
      cantidad: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al cargar pedidos'
    });
  }
});

export default router;