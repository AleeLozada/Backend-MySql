// models/Category.js
import { DataTypes } from 'sequelize';

const Category = (sequelize) => {
  const CategoryModel = sequelize.define('Category', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    imagen: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ''
    },
    activa: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'categories',
    timestamps: true
  });

  CategoryModel.associate = (models) => {
    CategoryModel.hasMany(models.Product, {
      foreignKey: 'categoryId',
      as: 'products'
    });
  };

  return CategoryModel;
};

export default Category;