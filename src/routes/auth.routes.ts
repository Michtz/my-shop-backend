import { Router, Response } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser,
  changePassword,
  validateToken,
  updateUserController,
  googleLogin,
} from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { AuthRequest } from '../models/auth.model';

const router = Router();

router
  .route('/register')
  .post((req: AuthRequest, res: Response) => register(req, res)); // last test

router
  .route('/login')
  .post((req: AuthRequest, res: Response) => login(req, res));

router
  .route('/google-login')
  .post((req: AuthRequest, res: Response) => googleLogin(req, res));

router
  .route('/refresh-token')
  .post((req: AuthRequest, res: Response) => refreshToken(req, res)); // todo: needs some work in refrestoken validation

router
  .route('/validate-token')
  .post((req: AuthRequest, res: Response) => validateToken(req, res)); // last test

router
  .route('/logout')
  .post(authenticate, (req: AuthRequest, res: Response) => logout(req, res));

router
  .route('/me')
  .get(authenticate, (req: AuthRequest, res: Response) =>
    getCurrentUser(req, res),
  );

router
  .route('/change-password')
  .post(authenticate, (req: AuthRequest, res: Response) =>
    changePassword(req, res),
  );
router
  .route('/change-user-info')
  .post(authenticate, (req: AuthRequest, res: Response) =>
    updateUserController(req, res),
  );

router
  .route('/admin/users')
  .get(
    authenticate,
    authorize(['admin']),
    (req: AuthRequest, res: Response) => {
      res.status(200).json({
        success: true,
        message: 'Admin route accessed successfully',
      });
    },
  );

export default router;
