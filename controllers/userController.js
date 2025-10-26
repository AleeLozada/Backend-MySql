// controllers/userController.js
import { User } from '../models/index.js';

export const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      cantidad: users.length,
      users
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar usuarios'
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar usuario'
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { nombre, telefono, direccion } = req.body;
    
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    await user.update({
      nombre: nombre || user.nombre,
      telefono: telefono || user.telefono,
      direccion: direccion || user.direccion
    });

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono,
        direccion: user.direccion,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil'
    });
  }
};