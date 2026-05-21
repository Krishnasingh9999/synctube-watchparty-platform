import express from 'express';
import {
  createRoom,
  joinRoom,
  getRoom,
  deleteRoom,
  transferHost,
  assignRole,
  removeUser,
} from '../controllers/roomController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protectRoute); // All room management routes require authentication

router.post('/create', createRoom);
router.post('/join', joinRoom);
router.get('/:roomId', getRoom);
router.delete('/:roomId', deleteRoom);
router.patch('/:roomId/transfer-host', transferHost);
router.patch('/:roomId/assign-role', assignRole);
router.patch('/:roomId/remove-user', removeUser);

export default router;
