// routes/cart.js
import express from 'express';
import { Product } from '../models/index.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Validar carrito
router.post('/validate', protect, async (req, res) => {
  try {
    const { items } = req.body;
    const validatedItems = [];
    let total = 0;

    for (const item of items) {
      const product = await Product.findByPk(item.producto);
      
      if (!product || !product.disponible) {
        return res.status(400).json({
          success: false,
          message: `El producto ${product?.nombre || item.producto} no está disponible`
        });
      }

      const price = product.promocion && product.precioPromocion 
        ? product.precioPromocion 
        : product.precio;

      const cartItem = {
        producto: product.id,
        nombre: product.nombre,
        precio: price,
        cantidad: item.cantidad,
        imagen: product.imagen,
        subtotal: price * item.cantidad
      };

      validatedItems.push(cartItem);
      total += cartItem.subtotal;
    }

    res.json({
      success: true,
      items: validatedItems,
      total
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al validar carrito'
    });
  }
});

export default router;