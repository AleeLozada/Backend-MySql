// config/database.js - VERSIÓN CORREGIDA
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const getDatabaseConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const config = {
    database: process.env.MYSQL_DATABASE,
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    dialect: 'mysql',
    logging: process.env.SQL_LOGGING === 'true' ? console.log : false,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
    // ✅ CONFIGURACIÓN GLOBAL DESHABILITANDO TIMESTAMPS
    define: {
      timestamps: false, // ← ESTO ES CLAVE
      underscored: false,
    }
  };

  if (isProduction && process.env.CLOUD_SQL_INSTANCE) {
    config.host = null;
    config.dialectOptions = {
      socketPath: `/cloudsql/${process.env.CLOUD_SQL_INSTANCE}`,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    };
  } else {
    config.host = process.env.MYSQL_HOST || 'localhost';
    config.port = process.env.MYSQL_PORT || 3306;
  }

  return config;
};

const sequelize = new Sequelize(getDatabaseConfig());

// ✅ VERIFICAR CONFIGURACIÓN
console.log('🔧 Sequelize config - timestamps:', sequelize.options.define?.timestamps);

export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a BD establecida');
    return true;
  } catch (error) {
    console.error('❌ Error de conexión a BD:', error.message);
    return false;
  }
};
console.log('✅ Sequelize config - timestamps:', sequelize.options.define.timestamps);
console.log('✅ Sequelize config - createdAt:', sequelize.options.define.createdAt);
console.log('✅ Sequelize config - updatedAt:', sequelize.options.define.updatedAt);

export default sequelize;