// models/OrderItem.js
import { DataTypes } from 'sequelize';

const OrderItem = (sequelize) => {
  const OrderItemModel = sequelize.define('OrderItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    precio: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    subtotal: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0
      }
    }
  }, {
    tableName: 'order_items',
    timestamps: true
  });

  OrderItemModel.associate = (models) => {
    OrderItemModel.belongsTo(models.Order, {
      foreignKey: 'orderId',
      as: 'order'
    });
    OrderItemModel.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product'
    });
  };

  return OrderItemModel;
};

export default OrderItem;