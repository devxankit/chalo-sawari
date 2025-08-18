const express = require('express');
const { body, param, query } = require('express-validator');
const {
  createTicket,
  getUserTickets,
  getTicketById,
  addReply,
  updateTicketStatus,
  getAllTickets,
  getSupportStats,
  assignTicket
} = require('../controllers/supportController');
const { protect, protectDriver, protectAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// User and Driver routes
router.post('/tickets', [
  body('subject').trim().isLength({ min: 5, max: 200 }).withMessage('Subject must be between 5 and 200 characters'),
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
  body('category').isIn(['technical', 'billing', 'booking', 'safety', 'general', 'other']).withMessage('Invalid category'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('attachments').optional().isArray().withMessage('Attachments must be an array')
], validate, createTicket);

router.get('/tickets', [
  query('status').optional().isIn(['open', 'assigned', 'in_progress', 'waiting_for_customer', 'resolved', 'closed']).withMessage('Invalid status'),
  query('category').optional().isIn(['technical', 'billing', 'booking', 'safety', 'general', 'other']).withMessage('Invalid category'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], validate, getUserTickets);

router.get('/tickets/:id', [
  param('id').isMongoId().withMessage('Invalid ticket ID')
], validate, getTicketById);

router.post('/tickets/:id/replies', [
  param('id').isMongoId().withMessage('Invalid ticket ID'),
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be between 1 and 1000 characters'),
  body('isInternal').optional().isBoolean().withMessage('isInternal must be a boolean')
], validate, addReply);

// Admin routes
router.get('/admin/tickets', [
  protectAdmin,
  query('status').optional().isIn(['open', 'assigned', 'in_progress', 'waiting_for_customer', 'resolved', 'closed']).withMessage('Invalid status'),
  query('category').optional().isIn(['technical', 'billing', 'booking', 'safety', 'general', 'other']).withMessage('Invalid category'),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  query('assignedTo').optional().isMongoId().withMessage('Invalid assignedTo ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sortBy').optional().isString().withMessage('Sort by must be a string'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
], validate, getAllTickets);

router.get('/admin/stats', [
  protectAdmin,
  query('period').optional().isIn(['week', 'month', 'year']).withMessage('Period must be week, month, or year')
], validate, getSupportStats);

router.put('/admin/tickets/:id/status', [
  protectAdmin,
  param('id').isMongoId().withMessage('Invalid ticket ID'),
  body('status').optional().isIn(['open', 'assigned', 'in_progress', 'waiting_for_customer', 'resolved', 'closed']).withMessage('Invalid status'),
  body('assignedTo').optional().isMongoId().withMessage('Invalid assignedTo ID'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority')
], validate, updateTicketStatus);

router.put('/admin/tickets/:id/assign', [
  protectAdmin,
  param('id').isMongoId().withMessage('Invalid ticket ID'),
  body('assignedTo').isMongoId().withMessage('Invalid assignedTo ID'),
  body('reason').optional().isString().withMessage('Reason must be a string')
], validate, assignTicket);

module.exports = router;
