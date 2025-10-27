// controllers/cart_controller.js
import { product, category } from '../models/index.js';
import { Op } from 'sequelize';

export const validate_cart = async (req, res) => {
  try {
    const { items } = req.body;
    
    // Validar que items existe y es un array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El carrito está vacío o no es válido'
      });
    }

    const validated_items = [];
    let total = 0;
    let subtotal_sin_promociones = 0;
    let total_descuento = 0;
    let errors = [];

    // Usar Promise.all para consultas paralelas (más eficiente)
    const validation_promises = items.map(async (item) => {
      // Validar cantidad mínima
      if (!item.cantidad || item.cantidad < 1) {
        errors.push(`La cantidad para el producto ${item.producto} debe ser al menos 1`);
        return null;
      }

      // Validar cantidad máxima (opcional)
      if (item.cantidad > 50) {
        errors.push(`La cantidad para el producto ${item.producto} no puede exceder 50 unidades`);
        return null;
      }

      const product_data = await product.findByPk(item.producto, {
        include: [{
          model: category,
          as: 'category',
          attributes: ['id', 'nombre', 'slug'],
          required: false
        }]
      });
      
      if (!product_data) {
        errors.push(`Producto no encontrado: ${item.producto}`);
        return null;
      }
      
      if (!product_data.disponible) {
        errors.push(`Producto no disponible: ${product_data.nombre}`);
        return null;
      }

      // Validar que la categoría esté activa (si existe relación)
      if (product_data.category && !product_data.category.activa) {
        errors.push(`La categoría del producto ${product_data.nombre} no está disponible`);
        return null;
      }

      const price = product_data.promocion && product_data.precio_promocion 
        ? product_data.precio_promocion 
        : product_data.precio;

      const subtotal = price * item.cantidad;
      const subtotal_original = product_data.precio * item.cantidad;
      const descuento_item = product_data.promocion ? subtotal_original - subtotal : 0;

      return {
        producto: product_data.id,
        nombre: product_data.nombre,
        descripcion: product_data.descripcion,
        precio: price,
        precio_original: product_data.precio,
        cantidad: item.cantidad,
        imagen: product_data.imagen,
        categoria: product_data.categoria,
        category_id: product_data.category_id,
        category_nombre: product_data.category?.nombre,
        promocion: product_data.promocion,
        precio_promocion: product_data.precio_promocion,
        disponible: product_data.disponible,
        destacado: product_data.destacado,
        subtotal: subtotal,
        subtotal_original: subtotal_original,
        descuento: descuento_item,
        ahorro_porcentaje: product_data.promocion ? 
          Math.round(((product_data.precio - price) / product_data.precio) * 100) : 0
      };
    });

    const results = await Promise.all(validation_promises);

    // Procesar resultados válidos
    results.forEach(item => {
      if (item) {
        validated_items.push(item);
        total += item.subtotal;
        subtotal_sin_promociones += item.subtotal_original;
        total_descuento += item.descuento;
      }
    });

    // Calcular resumen
    const resumen = {
      subtotal: subtotal_sin_promociones,
      total_descuento,
      total,
      cantidad_items: validated_items.length,
      cantidad_productos: validated_items.reduce((sum, item) => sum + item.cantidad, 0),
      items_con_promocion: validated_items.filter(item => item.promocion).length,
      ahorro_total: total_descuento
    };

    // Si hay errores, retornarlos
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Errores en la validación del carrito',
        errors: errors,
        validated_items, // Retornar items válidos también
        resumen
      });
    }

    res.json({
      success: true,
      message: 'Carrito validado exitosamente',
      items: validated_items,
      resumen
    });
  } catch (error) {
    console.error('Error al validar carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al validar el carrito'
    });
  }
};

export const add_to_cart = async (req, res) => {
  try {
    const { producto_id, cantidad = 1 } = req.body;

    // Validaciones básicas
    if (!producto_id) {
      return res.status(400).json({
        success: false,
        message: 'ID de producto requerido'
      });
    }

    if (cantidad < 1) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad debe ser al menos 1'
      });
    }

    if (cantidad > 50) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad no puede exceder 50 unidades'
      });
    }

    const product_data = await product.findByPk(producto_id, {
      include: [{
        model: category,
        as: 'category',
        attributes: ['id', 'nombre', 'slug'],
        required: false
      }]
    });
    
    if (!product_data) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    if (!product_data.disponible) {
      return res.status(400).json({
        success: false,
        message: `El producto ${product_data.nombre} no está disponible`
      });
    }

    // Validar categoría activa
    if (product_data.category && !product_data.category.activa) {
      return res.status(400).json({
        success: false,
        message: `La categoría del producto ${product_data.nombre} no está disponible`
      });
    }

    const price = product_data.promocion && product_data.precio_promocion 
      ? product_data.precio_promocion 
      : product_data.precio;

    const subtotal_original = product_data.precio * cantidad;
    const descuento = product_data.promocion ? subtotal_original - (price * cantidad) : 0;

    const cart_item = {
      producto: product_data.id,
      nombre: product_data.nombre,
      descripcion: product_data.descripcion,
      precio: price,
      precio_original: product_data.precio,
      cantidad: cantidad,
      imagen: product_data.imagen,
      categoria: product_data.categoria,
      category_id: product_data.category_id,
      category_nombre: product_data.category?.nombre,
      promocion: product_data.promocion,
      precio_promocion: product_data.precio_promocion,
      disponible: product_data.disponible,
      destacado: product_data.destacado,
      subtotal: price * cantidad,
      subtotal_original: subtotal_original,
      descuento: descuento,
      ahorro_porcentaje: product_data.promocion ? 
        Math.round(((product_data.precio - price) / product_data.precio) * 100) : 0
    };

    res.json({
      success: true,
      message: 'Producto agregado al carrito',
      item: cart_item
    });
  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar producto al carrito'
    });
  }
};

export const remove_from_cart = async (req, res) => {
  try {
    const { producto_id } = req.body;

    if (!producto_id) {
      return res.status(400).json({
        success: false,
        message: 'ID de producto requerido'
      });
    }

    // Verificar que el producto existe
    const product_data = await product.findByPk(producto_id);
    
    if (!product_data) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      message: `Producto ${product_data.nombre} removido del carrito`,
      producto_removido: {
        id: product_data.id,
        nombre: product_data.nombre,
        categoria: product_data.categoria
      }
    });
  } catch (error) {
    console.error('Error al remover del carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al remover producto del carrito'
    });
  }
};

export const update_cart_item = async (req, res) => {
  try {
    const { producto_id, cantidad } = req.body;

    if (!producto_id || cantidad === undefined) {
      return res.status(400).json({
        success: false,
        message: 'ID de producto y cantidad requeridos'
      });
    }

    if (cantidad < 0) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad no puede ser negativa'
      });
    }

    if (cantidad > 50) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad no puede exceder 50 unidades'
      });
    }

    const product_data = await product.findByPk(producto_id, {
      include: [{
        model: category,
        as: 'category',
        attributes: ['id', 'nombre', 'slug'],
        required: false
      }]
    });
    
    if (!product_data) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    if (cantidad === 0) {
      return res.json({
        success: true,
        message: `Producto ${product_data.nombre} removido del carrito`,
        action: 'removed',
        producto_removido: {
          id: product_data.id,
          nombre: product_data.nombre
        }
      });
    }

    if (!product_data.disponible) {
      return res.status(400).json({
        success: false,
        message: `El producto ${product_data.nombre} no está disponible`
      });
    }

    // Validar categoría activa
    if (product_data.category && !product_data.category.activa) {
      return res.status(400).json({
        success: false,
        message: `La categoría del producto ${product_data.nombre} no está disponible`
      });
    }

    const price = product_data.promocion && product_data.precio_promocion 
      ? product_data.precio_promocion 
      : product_data.precio;

    const subtotal_original = product_data.precio * cantidad;
    const descuento = product_data.promocion ? subtotal_original - (price * cantidad) : 0;

    const updated_item = {
      producto: product_data.id,
      nombre: product_data.nombre,
      descripcion: product_data.descripcion,
      precio: price,
      precio_original: product_data.precio,
      cantidad: cantidad,
      imagen: product_data.imagen,
      categoria: product_data.categoria,
      category_id: product_data.category_id,
      category_nombre: product_data.category?.nombre,
      promocion: product_data.promocion,
      precio_promocion: product_data.precio_promocion,
      disponible: product_data.disponible,
      destacado: product_data.destacado,
      subtotal: price * cantidad,
      subtotal_original: subtotal_original,
      descuento: descuento,
      ahorro_porcentaje: product_data.promocion ? 
        Math.round(((product_data.precio - price) / product_data.precio) * 100) : 0
    };

    res.json({
      success: true,
      message: 'Cantidad actualizada en el carrito',
      item: updated_item,
      action: 'updated'
    });
  } catch (error) {
    console.error('Error al actualizar item del carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar producto en el carrito'
    });
  }
};

export const clear_cart = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Carrito vaciado exitosamente',
      items: [],
      resumen: {
        subtotal: 0,
        total_descuento: 0,
        total: 0,
        cantidad_items: 0,
        cantidad_productos: 0,
        items_con_promocion: 0,
        ahorro_total: 0
      }
    });
  } catch (error) {
    console.error('Error al vaciar carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al vaciar el carrito'
    });
  }
};

// Obtener resumen rápido del carrito (para mostrar en header)
export const get_cart_summary = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.json({
        success: true,
        resumen: {
          cantidad_items: 0,
          total: 0,
          cantidad_productos: 0
        }
      });
    }

    let total = 0;
    let cantidad_productos = 0;

    // Solo calcular total sin validar productos (más rápido)
    const summary_promises = items.map(async (item) => {
      if (!item.producto || !item.cantidad || item.cantidad < 1) return null;

      const product_data = await product.findByPk(item.producto, {
        attributes: ['id', 'precio', 'precio_promocion', 'promocion', 'disponible']
      });

      if (!product_data || !product_data.disponible) return null;

      const price = product_data.promocion && product_data.precio_promocion 
        ? product_data.precio_promocion 
        : product_data.precio;

      return {
        subtotal: price * item.cantidad,
        cantidad: item.cantidad
      };
    });

    const results = await Promise.all(summary_promises);

    results.forEach(item => {
      if (item) {
        total += item.subtotal;
        cantidad_productos += item.cantidad;
      }
    });

    res.json({
      success: true,
      resumen: {
        cantidad_items: items.length,
        total: Math.round(total * 100) / 100, // Redondear a 2 decimales
        cantidad_productos: cantidad_productos
      }
    });
  } catch (error) {
    console.error('Error al obtener resumen del carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen del carrito'
    });
  }
};