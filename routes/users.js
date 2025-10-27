import express from 'express';
import { 
  get_profile,
  update_profile,
  change_password,
  get_users,
  get_user_by_id,
  update_user_role,
  delete_user,
  create_user,
  get_users_stats,
  promote_to_admin
} from '../controllers/user_controller.js';
import { protect, restrict_to } from '../middleware/auth.js';

const router = express.Router();

// Rutas protegidas para usuarios autenticados
router.use(protect);

// Perfil del usuario autenticado
router.get('/profile', get_profile);
router.put('/profile', update_profile);
router.put('/change-password', change_password);

// Rutas solo para admin
router.use(restrict_to('admin'));

// Administración de usuarios (admin)
router.get('/', get_users);
router.get('/stats', get_users_stats);
router.get('/:id', get_user_by_id);
router.post('/', create_user);
router.put('/:id/role', update_user_role);
router.delete('/:id', delete_user);
router.put('/promote', promote_to_admin);

export default router;