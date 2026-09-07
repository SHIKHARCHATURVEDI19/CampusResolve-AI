import { Router } from 'express';
import {
  getColleges,
  loginUser,
  getAllUsers,
  registerStaff,
  updateUserRole,
  processIncomingIssue,
  getIssues,
  getHotspots,
  updateIssueStatus,
  upvoteIssue,
  getWorkers,
  handleSendOTP,
  handleVerifyOTP
} from '../controllers/issueController.ts';

const router = Router();

router.get('/colleges', getColleges);
router.post('/auth/login', loginUser);
router.post('/auth/send-otp', handleSendOTP);
router.post('/auth/verify-otp', handleVerifyOTP);

router.get('/users', getAllUsers);
router.post('/staff', registerStaff);
router.patch('/users/:id/role', updateUserRole);

router.post('/issues', processIncomingIssue);
router.get('/issues', getIssues);
router.get('/issues/hotspots', getHotspots);
router.patch('/issues/:id/status', updateIssueStatus);
router.post('/issues/:id/upvote', upvoteIssue);
router.get('/workers', getWorkers);

export default router;
