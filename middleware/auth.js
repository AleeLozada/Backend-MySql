// middleware/auth.js
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado - Token requerido'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token válido pero usuario no existe'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para esta acción'
      });
    }
    next();
  };
};