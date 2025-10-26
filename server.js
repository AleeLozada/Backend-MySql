
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/database.js';
import { User, Product, Order, OrderItem } from './models/index.js';

// Configuración
dotenv.config();
const app = express();

// Middleware CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para verificar conexión a BD
app.use(async (req, res, next) => {
  try {
    await sequelize.authenticate();
    next();
  } catch (error) {
    console.error('❌ Error de conexión a BD:', error);
    res.status(503).json({
      success: false,
      message: 'Servicio de base de datos no disponible'
    });
  }
});

// 📍 RUTAS DE PRODUCTOS (CON BASE DE DATOS REAL)
app.get('/api/products', async (req, res) => {
  try {
    const { categoria, destacados, promociones } = req.query;
    
    let whereClause = { disponible: true };
    
    if (categoria && categoria !== 'all') {
      whereClause.categoria = categoria;
    }
    
    if (destacados === 'true') {
      whereClause.destacado = true;
    }
    
    if (promociones === 'true') {
      whereClause.promocion = true;
    }

    const filteredProducts = await Product.findAll({ 
      where: whereClause,
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      cantidad: filteredProducts.length,
      products: filteredProducts
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar productos'
    });
  }
});

app.get('/api/products/categories', async (req, res) => {
  try {
    const categories = await Product.findAll({
      attributes: ['categoria'],
      group: ['categoria'],
      where: { disponible: true }
    });
    
    const categoryNames = categories.map(cat => cat.categoria);

    res.json({
      success: true,
      categories: categoryNames
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar categorías'
    });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar producto'
    });
  }
});

// 📍 RUTAS DE AUTH (CON BASE DE DATOS REAL)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    
    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un usuario con este email'
      });
    }

    // Crear nuevo usuario (en producción, hashear la contraseña)
    const newUser = await User.create({
      nombre,
      email,
      password, // ⚠️ En producción, usar bcrypt
      role: 'user'
    });

    const token = `jwt-token-${Date.now()}`;

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: newUser.id,
        nombre: newUser.nombre,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario'
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario en la base de datos
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // ⚠️ En producción, comparar con bcrypt
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const token = `jwt-token-${Date.now()}`;

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión'
    });
  }
});

// 📍 RUTAS DE ORDERS (CON BASE DE DATOS REAL)
let orderCounter = 1;

app.post('/api/orders', async (req, res) => {
  try {
    const { items, metodoPago, notas, userId = 1 } = req.body; // userId temporal
    
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
      if (!product || !product.disponible) {
        return res.status(400).json({
          success: false,
          message: `Producto ${item.producto} no disponible`
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
});

app.get('/api/orders/my-orders', async (req, res) => {
  try {
    const userId = 1; // Temporal - reemplazar con autenticación real
    
    const userOrders = await Order.findAll({
      where: { userId },
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
});

app.get('/api/orders/:id', async (req, res) => {
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
});

// 📍 RUTAS BÁSICAS
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '¡Bienvenido al API de Buffet UNaB! 🚀',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: 'MySQL Cloud SQL',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products', 
      orders: '/api/orders'
    }
  });
});

app.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ 
      success: true,
      message: '✅ Backend funcionando correctamente',
      database: 'MySQL Cloud SQL ✅',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: '❌ Error de base de datos',
      database: 'MySQL Cloud SQL ❌'
    });
  }
});

// 📍 MANEJO DE ERRORES
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.originalUrl}`,
    suggestion: 'Prueba con /api/health, /api/products o /api/auth/login'
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Error del servidor:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 📍 INICIAR SERVIDOR
const PORT = process.env.PORT || 5001;
app.listen(PORT, async () => {
  try {
    // Sincronizar modelos con la base de datos
    await sequelize.sync({ alter: true });
    console.log('\n🎯 =================================');
    console.log('🚀 Servidor Buffet UNaB Backend');
    console.log('💾 Base de datos: MySQL Cloud SQL');
    console.log('🔗 Conectado a: buffet-unab:us-central1:buffet-mysql');
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`📊 Puerto: ${PORT}`);
    console.log('✅ Base de datos sincronizada');
    console.log('🎯 =================================\n');
    
    console.log('📋 Endpoints disponibles:');
    console.log('   GET  /api/health           - Estado del servidor');
    console.log('   GET  /api/products         - Lista de productos');
    console.log('   GET  /api/products/:id     - Producto por ID');
    console.log('   POST /api/auth/register    - Registro de usuario');
    console.log('   POST /api/auth/login       - Login de usuario');
    console.log('   POST /api/orders           - Crear pedido');
    console.log('   GET  /api/orders/my-orders - Mis pedidos\n');
  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
  }
});