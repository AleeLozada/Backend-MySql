import { DataTypes } from 'sequelize';

const User = (sequelize) => {
  const UserModel = sequelize.define('User', {
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
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 100]
      }
    },
    telefono: {
      type: DataTypes.STRING,
      allowNull: true
    },
    direccion: {
      type: DataTypes.STRING,
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user'
    }
  }, {
    tableName: 'users',
    timestamps: true
  });

  UserModel.associate = (models) => {
    UserModel.hasMany(models.Order, {
      foreignKey: 'userId',
      as: 'orders'
    });
  };

  return UserModel;
};

export default User;