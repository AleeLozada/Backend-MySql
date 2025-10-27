// routes/products.js - VERSIÓN CORREGIDA
import express from 'express';
import { 
  get_products,
  get_product_by_id,
  get_product_categories,
  create_product,
  update_product,
  delete_product
} from '../controllers/product_controller.js';
import { protect, restrict_to } from '../middleware/auth.js';
// ✅ CORREGIR: Usar exportaciones nombradas directamente
import { upload_product_image, handle_upload_error } from '../middleware/upload.js';
import { validate_product } from '../middleware/validation.js';

const router = express.Router();

// Rutas públicas
router.get('/', get_products);
router.get('/categories', get_product_categories);
router.get('/:id', get_product_by_id);

// Rutas protegidas solo para admin
router.use(protect);
router.use(restrict_to('admin'));
router.post('/', upload_product_image.single('imagen'), create_product); // ✅
router.put('/:id', upload_product_image.single('imagen'), update_product); // ✅
router.delete('/:id', delete_product); // ✅

// Crear producto con upload de imagen
router.post('/', 
  upload_product_image.single('imagen'), // ✅ Usar directamente
  handle_upload_error,
  validate_product,
  create_product
);

// Actualizar producto
router.put('/:id',
  upload_product_image.single('imagen'), // ✅ Usar directamente
  handle_upload_error,
  validate_product,
  update_product
);

// Eliminar producto
router.delete('/:id', delete_product);

export default router;