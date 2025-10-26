// middleware/validation.js
import { body, validationResult } from 'express-validator';

export const validateRegister = [
  body('nombre')
    .trim()
    .isLength({ min: 2 })
    .withMessage('El nombre debe tener al menos 2 caracteres')
    .isLength({ max: 50 })
    .withMessage('El nombre no puede tener más de 50 caracteres'),
  body('email')
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('El email no puede tener más de 100 caracteres'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .isLength({ max: 100 })
    .withMessage('La contraseña no puede tener más de 100 caracteres'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array()
      });
    }
    next();
  }
];

export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array()
      });
    }
    next();
  }
];

export const validateProduct = [
  body('nombre')
    .trim()
    .isLength({ min: 2 })
    .withMessage('El nombre del producto debe tener al menos 2 caracteres')
    .isLength({ max: 100 })
    .withMessage('El nombre no puede tener más de 100 caracteres'),
  body('precio')
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número mayor o igual a 0'),
  body('categoria')
    .isIn(['bebidas', 'golosinas', 'sandwiches', 'snacks', 'postres'])
    .withMessage('Categoría no válida'),
  body('descripcion')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede tener más de 500 caracteres'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array()
      });
    }
    next();
  }
];

export const validateOrder = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('El pedido debe contener al menos un producto'),
  body('items.*.producto')
    .isInt({ min: 1 })
    .withMessage('ID de producto inválido'),
  body('items.*.cantidad')
    .isInt({ min: 1 })
    .withMessage('La cantidad debe ser al menos 1'),
  body('metodoPago')
    .optional()
    .isIn(['efectivo', 'tarjeta', 'qr'])
    .withMessage('Método de pago no válido'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array()
      });
    }
    next();
  }
];