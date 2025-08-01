import { Router } from 'express';
import { auth, canModifyUser, optionalAuth } from '../middleware/auth';
import { validateUser, validateLogin } from '../middleware/validation';
import {
  register,
  login,
  logout,
  getUsers,
  getUser,
  updateUser,
  deleteUser
} from '../controllers/authController';

const router = Router();

router.get('/', getUsers);
router.get('/:id', optionalAuth, getUser);

router.post('/register', validateUser, register);
router.post('/login', validateLogin, login);
router.post('/logout', logout);

router.patch('/:id', auth, canModifyUser, updateUser);
router.delete('/:id', auth, canModifyUser, deleteUser);

export default router;
