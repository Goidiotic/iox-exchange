import { Router } from 'express';
import { tokenController } from '../controllers/token.controller.js';

const router = Router();

router.get('/', tokenController.list);
router.get('/:tokenId/balance', tokenController.balance);

export default router;
