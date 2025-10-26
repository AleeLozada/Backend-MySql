// models/Order.js
import { DataTypes } from 'sequelize';

const Order = (sequelize) => {
  const OrderModel = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    total: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'confirmado', 'preparando', 'listo', 'entregado', 'cancelado'),
      defaultValue: 'pendiente'
    },
    metodoPago: {
      type: DataTypes.ENUM('efectivo', 'tarjeta', 'qr'),
      defaultValue: 'efectivo'
    },
    numeroPedido: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true
    },
    notas: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'orders',
    timestamps: true
  });

  OrderModel.associate = (models) => {
    OrderModel.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    OrderModel.hasMany(models.OrderItem, {
      foreignKey: 'orderId',
      as: 'items'
    });
  };

  // Hook para generar número de pedido
  OrderModel.beforeCreate(async (order) => {
    if (!order.numeroPedido) {
      const count = await OrderModel.count();
      order.numeroPedido = `PED${String(count + 1).padStart(4, '0')}`;
    }
  });

  return OrderModel;
};

export default Order;