// orderRoutes.js

import express from 'express';
import * as orderController from '../controllers/orderController.js'; 

const router = express.Router();

// Crear un pedido
router.route('/')
  .post(orderController.createOrder)
  .get(orderController.getAllOrders); 

router.route('/:id')
  .get(orderController.getOrderById)     
  .put(orderController.updateOrderDetails)
  // .delete(orderController.deleteOrder); // Si tienes la función deleteOrder

// Modificar items y recalcular el total
router.route('/:id/items')
  .patch(orderController.modifyOrderItems); 

// Cambiar el ESTADO
router.route('/:id/status')
  .patch(orderController.updateOrderStatus);

// Ruta para pedidos del usuario actual
router.route('/user')
  .get(orderController.getUserOrders);

export default router;
