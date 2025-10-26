// models/Product.js
import { DataTypes } from 'sequelize';

const Product = (sequelize) => {
  const ProductModel = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    precio: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    categoria: {
      type: DataTypes.ENUM('bebidas', 'golosinas', 'sandwiches', 'snacks', 'postres'),
      allowNull: false
    },
    imagen: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ''
    },
    disponible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    destacado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    promocion: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    precioPromocion: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0
      }
    }
  }, {
    tableName: 'products',
    timestamps: true
  });

  ProductModel.associate = (models) => {
    ProductModel.hasMany(models.OrderItem, {
      foreignKey: 'productId',
      as: 'orderItems'
    });
  };

  return ProductModel;
};

export default Product;