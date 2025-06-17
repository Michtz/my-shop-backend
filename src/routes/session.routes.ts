import { Request, Response, Router } from 'express';
import {
  createSession,
  getSession,
  getAllSessions,
  updateSession,
  convertToAuthSession,
  deleteSession,
  getCurrentSession,
  updateCurrentSession,
  deleteCurrentSession,
} from '../controllers/session.controller';

const router = Router();

router
  .route('/')
  .post((req: Request, res: Response) => createSession(req, res))
  .get((req: Request, res: Response) => getAllSessions(req, res));

router
  .route('/current')
  .get((req: Request, res: Response) => getCurrentSession(req, res))
  .put((req: Request, res: Response) => updateCurrentSession(req, res))
  .delete((req: Request, res: Response) => deleteCurrentSession(req, res));

router
  .route('/:sessionId')
  .get((req: Request, res: Response) => getSession(req, res))
  .put((req: Request, res: Response) => updateSession(req, res))
  .delete((req: Request, res: Response) => deleteSession(req, res));

router.route('/:sessionId/auth').post(convertToAuthSession);

export default router;
