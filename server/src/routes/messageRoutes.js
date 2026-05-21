import express from 'express';
import { getRoomMessages } from '../controllers/messageController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protectRoute); // All message history fetching requires authentication

router.get('/:roomId', getRoomMessages);

export default router;
