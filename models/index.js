// models/index.js
import sequelize from '../config/database.js';

// Importar modelos
import initUser from './User.js';
import initCategory from './Category.js';
import initProduct from './Product.js';
import initOrder from './Order.js';
import initOrderItem from './OrderItem.js';

// Inicializar modelos
const User = initUser(sequelize);
const Category = initCategory(sequelize);
const Product = initProduct(sequelize);
const Order = initOrder(sequelize);
const OrderItem = initOrderItem(sequelize);

// Configurar asociaciones
if (User.associate) {
  User.associate({ Order });
}
if (Category.associate) {
  Category.associate({ Product });
}
if (Product.associate) {
  Product.associate({ Category, OrderItem });
}
if (Order.associate) {
  Order.associate({ User, OrderItem });
}
if (OrderItem.associate) {
  OrderItem.associate({ Order, Product });
}

const models = {
  User,
  Category,
  Product,
  Order,
  OrderItem,
  sequelize
};

export { 
  User, 
  Category, 
  Product, 
  Order, 
  OrderItem, 
  sequelize 
};

export default models;