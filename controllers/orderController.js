// controllers/orderController.js

import { Order, OrderItem, Product, User, sequelize } from '../models/index.js';

export const createOrder = async (req, res) => {
  try {
    const { items, metodoPago, notas } = req.body;
    const userId = req.user.id;
    
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El carrito está vacío'
      });
    }

    // Calcular total y verificar productos
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.producto);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Producto no encontrado: ${item.producto}`
        });
      }
      
      if (!product.disponible) {
        return res.status(400).json({
          success: false,
          message: `Producto no disponible: ${product.nombre}`
        });
      }

      const price = product.promocion && product.precioPromocion 
        ? product.precioPromocion 
        : product.precio;
      
      const subtotal = price * item.cantidad;
      total += subtotal;

      orderItems.push({
        productId: product.id,
        cantidad: item.cantidad,
        precio: price,
        subtotal: subtotal
      });
    }

    // Crear orden
    const order = await Order.create({
      userId,
      total,
      metodoPago: metodoPago || 'efectivo',
      notas: notas || '',
      estado: 'pendiente'
    });

    // Crear items de la orden
    for (const item of orderItems) {
      await OrderItem.create({
        ...item,
        orderId: order.id
      });
    }

    // Cargar orden completa con relaciones
    const completeOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nombre', 'email']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'nombre', 'imagen']
          }]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Pedido creado exitosamente',
      order: completeOrder
    });
  } catch (error) {
    console.error('Error al crear pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear pedido'
    });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const userOrders = await Order.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'nombre', 'imagen']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      cantidad: userOrders.length,
      orders: userOrders
    });
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar pedidos'
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nombre', 'email']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'nombre', 'imagen']
          }]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Verificar que el pedido pertenece al usuario o es admin
    if (order.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para ver este pedido'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar pedido'
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { estado } = req.body;
    
    const order = await Order.findByPk(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    await order.update({ estado });
    
    const updatedOrder = await Order.findByPk(order.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'nombre', 'email']
      }]
    });

    res.json({
      success: true,
      message: 'Estado del pedido actualizado',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error al actualizar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar pedido'
    });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nombre', 'email']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'nombre']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      cantidad: orders.length,
      orders
    });
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar pedidos'
    });
  }
// actualizar detalles de orden y modificar orden (NUEVo)
  export const updateOrderDetails = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
        }

        // Autorización
        if (order.userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'No autorizado para modificar este pedido' });
        }
        
        // Control de Estado (pendiente o confirmado)
        if (order.estado !== 'pendiente' && order.estado !== 'confirmado') {
            return res.status(403).json({ success: false, message: `No se pueden modificar los detalles de un pedido en estado: ${order.estado}` });
        }

        const { metodoPago, notas } = req.body;

        await order.update({
            metodoPago: metodoPago ?? order.metodoPago,
            notas: notas ?? order.notas
        });

        res.status(200).json({
            success: true,
            message: 'Detalles del pedido actualizados exitosamente',
            order
        });

    } catch (error) {
        console.error('Error al actualizar detalles del pedido:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar detalles del pedido' });
    }
};

export const modifyOrderItems = async (req, res) => {
    const t = await sequelize.transaction(); 
    try {
        const order = await Order.findByPk(req.params.id, { transaction: t });

        if (!order) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
        }
        
        // Autorización
        if (order.userId !== req.user.id && req.user.role !== 'admin') {
            await t.rollback();
            return res.status(403).json({ success: false, message: 'No autorizado para modificar los ítems de este pedido' });
        }
        
        // Control de Estado Solo si está 'pendiente'
        if (order.estado !== 'pendiente') { 
            await t.rollback();
            return res.status(403).json({ success: false, message: `No se pueden modificar ítems de un pedido en estado: ${order.estado}` });
        }

        const { items } = req.body;
        if (!items || items.length === 0) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'Se requiere al menos un ítem para modificar el pedido.' });
        }

        let newTotal = 0;
        const newOrderItems = [];

        // Verificar productos y calcular nuevo total
        for (const item of items) {
            const product = await Product.findByPk(item.producto); 
            
            if (!product || !product.disponible) {
                await t.rollback();
                return res.status(400).json({ success: false, message: `Producto no válido o no disponible: ${item.producto}` });
            }

            const price = product.promocion && product.precioPromocion ? product.precioPromocion : product.precio;
            const subtotal = price * item.cantidad;
            newTotal += subtotal;

            newOrderItems.push({
                productId: product.id,
                cantidad: item.cantidad,
                precio: price,
                subtotal: subtotal
            });
        }
        
        // Transacción
        await OrderItem.destroy({ where: { orderId: order.id } }, { transaction: t });
        await order.update({ total: newTotal }, { transaction: t });
        for (const item of newOrderItems) {
            await OrderItem.create({ ...item, orderId: order.id }, { transaction: t });
        }

        await t.commit();

        // Devolver el pedido actualizado
        const completeOrder = await Order.findByPk(order.id, {
             include: [{ model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }]
        });

        res.status(200).json({
            success: true,
            message: 'Pedido modificado y total recalculado exitosamente',
            order: completeOrder
        });

    } catch (error) {
        await t.rollback();
        console.error('Error al modificar ítems del pedido:', error);
        res.status(500).json({ success: false, message: 'Error al modificar ítems del pedido' });
    }
};
};
