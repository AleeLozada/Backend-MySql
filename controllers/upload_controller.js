// controllers/upload_controller.js
import path from 'path';
import fs from 'fs';
import { delete_file } from '../middleware/upload.js';

export const upload_product_image_controller = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha subido ningún archivo'
      });
    }

    res.json({
      success: true,
      message: 'Imagen de producto subida correctamente',
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        path: `/uploads/products/${req.file.filename}`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al subir la imagen'
    });
  }
};

export const upload_user_avatar_controller = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha subido ningún archivo'
      });
    }

    res.json({
      success: true,
      message: 'Avatar subido correctamente',
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        path: `/uploads/users/${req.file.filename}`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al subir el avatar'
    });
  }
};

export const delete_file_controller = (req, res) => {
  try {
    const { type, filename } = req.params;
    
    const valid_types = ['products', 'users', 'categories'];
    if (!valid_types.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de archivo no válido'
      });
    }

    const file_path = `${type}/${filename}`;
    delete_file(file_path);

    res.json({
      success: true,
      message: 'Archivo eliminado correctamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el archivo'
    });
  }
};

export const get_file_info_controller = (req, res) => {
  try {
    const { type, filename } = req.params;
    
    const valid_types = ['products', 'users', 'categories'];
    if (!valid_types.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de archivo no válido'
      });
    }

    const file_path = path.join(process.cwd(), `uploads/${type}/${filename}`);
    
    if (!fs.existsSync(file_path)) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado'
      });
    }

    const stats = fs.statSync(file_path);
    res.json({
      success: true,
      file: {
        filename,
        type,
        size: stats.size,
        created: stats.birthtime,
        path: `/uploads/${type}/${filename}`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener información del archivo'
    });
  }
};