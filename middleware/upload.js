// middleware/upload.js - SOLO EXPORTACIONES NOMBRADAS
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear directorios si no existen
const create_upload_dirs = () => {
  const dirs = [
    path.join(__dirname, '../uploads'),
    path.join(__dirname, '../uploads/products'),
    path.join(__dirname, '../uploads/users'),
    path.join(__dirname, '../uploads/categories')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

create_upload_dirs();

// Configuración de almacenamiento para productos
const product_storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/products'));
  },
  filename: (req, file, cb) => {
    const unique_suffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safe_name = file.originalname.replace(/[^a-zA-Z0-9.]/g, '-');
    cb(null, 'product-' + unique_suffix + path.extname(safe_name));
  }
});

// Configuración de almacenamiento para usuarios
const user_storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/users'));
  },
  filename: (req, file, cb) => {
    const unique_suffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + unique_suffix + path.extname(file.originalname));
  }
});

// Filtro de archivos
const image_filter = (req, file, cb) => {
  const allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowed_types.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (JPEG, JPG, PNG, WebP)'), false);
  }
};

// Instancias de upload para diferentes usos
export const upload_product_image = multer({
  storage: product_storage,
  limits: {
    file_size: 5 * 1024 * 1024 // 5MB
  },
  file_filter: image_filter
});

export const upload_user_avatar = multer({
  storage: user_storage,
  limits: {
    file_size: 2 * 1024 * 1024 // 2MB
  },
  file_filter: image_filter
});

// Middleware para manejar errores de Multer
export const handle_upload_error = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'El archivo es demasiado grande'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Tipo de archivo no permitido'
      });
    }
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

// Función para eliminar archivos (útil en controllers)
export const delete_file = (file_path) => {
  const full_path = path.join(__dirname, '../uploads', file_path);
  if (fs.existsSync(full_path)) {
    fs.unlinkSync(full_path);
  }
};
