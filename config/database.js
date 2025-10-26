// config/database.js
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || 'Buffet_UNAB',
  process.env.MYSQL_USER || 'root',
  process.env.MYSQL_PASSWORD,
  {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: process.env.MYSQL_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connected via Sequelize.');
  } catch (err) {
    console.error('❌ Unable to connect to MySQL:', err);
    process.exit(1);
  }
};

testConnection();

export default sequelize;