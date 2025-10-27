// models/category.js (versión con validaciones mejoradas)
import { DataTypes } from 'sequelize';

const category = (sequelize) => {
  const category_model = sequelize.define('category', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        name: 'categories_nombre_unique',
        msg: 'Ya existe una categoría con este nombre'
      },
      validate: {
        notEmpty: {
          msg: 'El nombre de la categoría no puede estar vacío'
        },
        len: {
          args: [2, 50],
          msg: 'El nombre debe tener entre 2 y 50 caracteres'
        }
      }
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        name: 'categories_slug_unique',
        msg: 'Ya existe una categoría con este slug'
      },
      validate: {
        notEmpty: {
          msg: 'El slug no puede estar vacío'
        },
        is: {
          args: /^[a-z0-9-]+$/,
          msg: 'El slug solo puede contener letras minúsculas, números y guiones'
        }
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
    timestamps: false,
    createdAt: false,
    updatedAt: false,
    underscored: true
  });

  category_model.associate = (models) => {
    category_model.hasMany(models.product, {
      foreignKey: 'category_id',
      as: 'products'
    });
  };

  return category_model;
};

export default category;