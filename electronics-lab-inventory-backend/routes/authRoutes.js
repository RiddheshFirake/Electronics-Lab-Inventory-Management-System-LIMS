const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');
const { adminOnly, canManageUsers } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

// Protected routes (require authentication)
router.use(protect); // Apply protect middleware to all routes below

router.get('/logout', logout);
router.get('/me', getMe);
router.put('/updatedetails', updateDetails);
router.put('/updatepassword', updatePassword);

// Admin only routes for user management
router.route('/users')
  .get(canManageUsers, getUsers)
  .post(canManageUsers, createUser);

router.route('/users/:id')
  .get(canManageUsers, getUser)
  .put(canManageUsers, updateUser)
  .delete(canManageUsers, deleteUser);

module.exports = router;