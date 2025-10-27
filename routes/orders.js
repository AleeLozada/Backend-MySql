<<<<<<< HEAD
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
=======
// routes/orders.js
import express from 'express';
import { 
  create_order,
  get_user_orders,
  get_order_by_id,
  update_order_status,
  get_all_orders,
  delete_order,
  cancel_order,
  get_user_order_stats
} from '../controllers/order_controller.js';
import { protect, restrict_to } from '../middleware/auth.js';
import { validate_order } from '../middleware/validation.js'; // ✅ AGREGAR

const router = express.Router();

// Rutas protegidas para usuarios
router.use(protect);

// ✅ INTEGRAR validación en crear orden
router.post('/', validate_order, create_order);

// Obtener órdenes del usuario autenticado
router.get('/my-orders', get_user_orders);
router.get('/my-stats', get_user_order_stats);
router.get('/:id', get_order_by_id);
router.put('/:id/cancel', cancel_order);

// Rutas solo para admin
router.use(restrict_to('admin'));
router.get('/', get_all_orders);
router.put('/:id/status', update_order_status);
router.delete('/:id', delete_order);

export default router;
>>>>>>> main
