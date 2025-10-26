export const calculateCartTotal = (items) => {
  return items.reduce((total, item) => {
    const price = item.promocion && item.precioPromocion 
      ? item.precioPromocion 
      : item.precio;
    return total + (price * item.cantidad);
  }, 0);
};

export const validateCartItems = async (items) => {
  const validatedItems = [];
  let total = 0;

  for (const item of items) {
    const product = await Product.findById(item.producto);
    
    if (!product) {
      throw new Error(`Producto no encontrado: ${item.producto}`);
    }
    
    if (!product.disponible) {
      throw new Error(`Producto no disponible: ${product.nombre}`);
    }

    const itemPrice = product.promocion && product.precioPromocion 
      ? product.precioPromocion 
      : product.precio;

    validatedItems.push({
      producto: product._id,
      nombre: product.nombre,
      precio: itemPrice,
      cantidad: item.cantidad
    });

    total += itemPrice * item.cantidad;
  }

  return { validatedItems, total };
};