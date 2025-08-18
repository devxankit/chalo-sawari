const Support = require('../models/Support');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Admin = require('../models/Admin');
const { sendEmail } = require('../utils/notifications');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Create support ticket
// @route   POST /api/support/tickets
// @access  Private (User/Driver)
const createTicket = asyncHandler(async (req, res) => {
  const {
    subject,
    description,
    category,
    priority = 'medium',
    attachments
  } = req.body;

  // Determine user type and ID
  let userId, userType, userEmail, userName;
  
  if (req.user) {
    userId = req.user.id;
    userType = 'user';
    const user = await User.findById(userId).select('email firstName lastName');
    userEmail = user.email;
    userName = `${user.firstName} ${user.lastName}`;
  } else if (req.driver) {
    userId = req.driver.id;
    userType = 'driver';
    const driver = await Driver.findById(userId).select('email firstName lastName');
    userEmail = driver.email;
    userName = `${driver.firstName} ${driver.lastName}`;
  } else {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Create support ticket
  const ticket = await Support.create({
    user: userId,
    userType,
    subject,
    description,
    category,
    priority,
    attachments,
    status: 'open',
    ticketNumber: generateTicketNumber()
  });

  // Send confirmation email
  await sendEmail(
    userEmail,
    'Support Ticket Created',
    `Your support ticket #${ticket.ticketNumber} has been created successfully. We'll get back to you soon.`
  );

  // Notify support team
  await notifySupportTeam(ticket);

  res.status(201).json({
    success: true,
    data: ticket
  });
});

// @desc    Get user tickets
// @route   GET /api/support/tickets
// @access  Private (User/Driver)
const getUserTickets = asyncHandler(async (req, res) => {
  const { status, category, page = 1, limit = 10 } = req.query;

  // Determine user type and ID
  let userId, userType;
  
  if (req.user) {
    userId = req.user.id;
    userType = 'user';
  } else if (req.driver) {
    userId = req.driver.id;
    userType = 'driver';
  } else {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const query = { user: userId, userType };
  if (status) query.status = status;
  if (category) query.category = category;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: {
      path: 'assignedTo',
      select: 'firstName lastName email'
    }
  };

  const tickets = await Support.paginate(query, options);

  res.json({
    success: true,
    data: tickets
  });
});

// @desc    Get ticket by ID
// @route   GET /api/support/tickets/:id
// @access  Private (User/Driver/Admin)
const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await Support.findById(req.params.id)
    .populate('user', 'firstName lastName email')
    .populate('assignedTo', 'firstName lastName email')
    .populate('replies.user', 'firstName lastName email');

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Ticket not found'
    });
  }

  // Check authorization
  let isAuthorized = false;
  
  if (req.admin) {
    isAuthorized = true;
  } else if (req.user && ticket.userType === 'user' && ticket.user._id.toString() === req.user.id) {
    isAuthorized = true;
  } else if (req.driver && ticket.userType === 'driver' && ticket.user._id.toString() === req.driver.id) {
    isAuthorized = true;
  }

  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this ticket'
    });
  }

  res.json({
    success: true,
    data: ticket
  });
});

// @desc    Add reply to ticket
// @route   POST /api/support/tickets/:id/replies
// @access  Private (User/Driver/Admin)
const addReply = asyncHandler(async (req, res) => {
  const { message, isInternal = false } = req.body;

  const ticket = await Support.findById(req.params.id);
  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Ticket not found'
    });
  }

  // Check authorization
  let userId, userType, userEmail, userName;
  
  if (req.admin) {
    userId = req.admin.id;
    userType = 'admin';
    const admin = await Admin.findById(userId).select('email firstName lastName');
    userEmail = admin.email;
    userName = `${admin.firstName} ${admin.lastName}`;
  } else if (req.user && ticket.userType === 'user' && ticket.user.toString() === req.user.id) {
    userId = req.user.id;
    userType = 'user';
    const user = await User.findById(userId).select('email firstName lastName');
    userEmail = user.email;
    userName = `${user.firstName} ${user.lastName}`;
  } else if (req.driver && ticket.userType === 'driver' && ticket.user.toString() === req.driver.id) {
    userId = req.driver.id;
    userType = 'driver';
    const driver = await Driver.findById(userId).select('email firstName lastName');
    userEmail = driver.email;
    userName = `${driver.firstName} ${driver.lastName}`;
  } else {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to reply to this ticket'
    });
  }

  // Add reply
  ticket.replies.push({
    user: userId,
    userType,
    message,
    isInternal,
    timestamp: new Date()
  });

  // Update ticket status if user replied
  if (userType !== 'admin' && ticket.status === 'waiting_for_customer') {
    ticket.status = 'in_progress';
  }

  await ticket.save();

  // Send notification email
  if (!isInternal) {
    if (userType === 'admin') {
      // Notify user/driver about admin reply
      const user = await (ticket.userType === 'user' ? User : Driver).findById(ticket.user);
      await sendEmail(
        user.email,
        'Support Ticket Updated',
        `Your support ticket #${ticket.ticketNumber} has received a new reply.`
      );
    } else {
      // Notify support team about user/driver reply
      await notifySupportTeam(ticket, 'User replied to ticket');
    }
  }

  res.json({
    success: true,
    data: ticket.replies[ticket.replies.length - 1]
  });
});

// @desc    Update ticket status
// @route   PUT /api/support/tickets/:id/status
// @access  Private (Admin)
const updateTicketStatus = asyncHandler(async (req, res) => {
  const { status, assignedTo, priority } = req.body;

  const ticket = await Support.findById(req.params.id);
  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Ticket not found'
    });
  }

  // Update ticket
  if (status) ticket.status = status;
  if (assignedTo) ticket.assignedTo = assignedTo;
  if (priority) ticket.priority = priority;

  ticket.statusHistory.push({
    status: ticket.status,
    updatedBy: req.admin.id,
    updatedAt: new Date(),
    assignedTo: ticket.assignedTo
  });

  await ticket.save();

  // Send notification email
  const user = await (ticket.userType === 'user' ? User : Driver).findById(ticket.user);
  await sendEmail(
    user.email,
    'Support Ticket Status Updated',
    `Your support ticket #${ticket.ticketNumber} status has been updated to ${status}.`
  );

  res.json({
    success: true,
    data: ticket
  });
});

// @desc    Get all tickets (Admin)
// @route   GET /api/support/admin/tickets
// @access  Private (Admin)
const getAllTickets = asyncHandler(async (req, res) => {
  const { 
    status, 
    category, 
    priority, 
    assignedTo,
    page = 1, 
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  let query = {};
  
  if (status) query.status = status;
  if (category) query.category = category;
  if (priority) query.priority = priority;
  if (assignedTo) query.assignedTo = assignedTo;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
    populate: [
      { path: 'user', select: 'firstName lastName email' },
      { path: 'assignedTo', select: 'firstName lastName email' }
    ]
  };

  const tickets = await Support.paginate(query, options);

  res.json({
    success: true,
    data: tickets
  });
});

// @desc    Get support statistics
// @route   GET /api/support/admin/stats
// @access  Private (Admin)
const getSupportStats = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;
  
  let dateFilter = {};
  const now = new Date();
  
  if (period === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    dateFilter = { createdAt: { $gte: weekAgo } };
  } else if (period === 'month') {
    const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
    dateFilter = { createdAt: { $gte: monthAgo } };
  } else if (period === 'year') {
    const yearAgo = new Date(now.getFullYear(), 0, 1);
    dateFilter = { createdAt: { $gte: yearAgo } };
  }

  const [
    totalTickets,
    openTickets,
    resolvedTickets,
    avgResolutionTime,
    ticketsByCategory,
    ticketsByPriority
  ] = await Promise.all([
    Support.countDocuments(dateFilter),
    Support.countDocuments({ ...dateFilter, status: 'open' }),
    Support.countDocuments({ ...dateFilter, status: 'resolved' }),
    Support.aggregate([
      { $match: { ...dateFilter, status: 'resolved' } },
      {
        $group: {
          _id: null,
          avgTime: {
            $avg: {
              $subtract: ['$resolvedAt', '$createdAt']
            }
          }
        }
      }
    ]),
    Support.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]),
    Support.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ])
  ]);

  const avgResolutionHours = avgResolutionTime[0]?.avgTime 
    ? Math.round(avgResolutionTime[0].avgTime / (1000 * 60 * 60))
    : 0;

  res.json({
    success: true,
    data: {
      period,
      overview: {
        totalTickets,
        openTickets,
        resolvedTickets,
        resolutionRate: totalTickets > 0 ? (resolvedTickets / totalTickets * 100).toFixed(2) : 0
      },
      performance: {
        avgResolutionTime: avgResolutionHours,
        avgResolutionTimeUnit: 'hours'
      },
      distribution: {
        byCategory: ticketsByCategory,
        byPriority: ticketsByPriority
      }
    }
  });
});

// @desc    Assign ticket to support agent
// @route   PUT /api/support/admin/tickets/:id/assign
// @access  Private (Admin)
const assignTicket = asyncHandler(async (req, res) => {
  const { assignedTo, reason } = req.body;

  const ticket = await Support.findById(req.params.id);
  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Ticket not found'
    });
  }

  // Validate assignedTo (must be admin with support role)
  const admin = await Admin.findById(assignedTo);
  if (!admin || !admin.permissions.includes('support')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid support agent'
    });
  }

  ticket.assignedTo = assignedTo;
  ticket.status = 'assigned';
  ticket.statusHistory.push({
    status: 'assigned',
    updatedBy: req.admin.id,
    updatedAt: new Date(),
    assignedTo,
    reason
  });

  await ticket.save();

  // Send notification to assigned agent
  await sendEmail(
    admin.email,
    'New Ticket Assigned',
    `You have been assigned support ticket #${ticket.ticketNumber}. Please review and respond.`
  );

  res.json({
    success: true,
    data: ticket
  });
});

// Helper functions
function generateTicketNumber() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `TKT${timestamp}${random}`;
}

async function notifySupportTeam(ticket, message = 'New support ticket created') {
  // Find all admin users with support permissions
  const supportAdmins = await Admin.find({
    'permissions': 'support',
    'status': 'active'
  }).select('email');

  // Send notification to support team
  const emailPromises = supportAdmins.map(admin => 
    sendEmail(
      admin.email,
      'Support Ticket Notification',
      `${message}: #${ticket.ticketNumber} - ${ticket.subject}`
    )
  );

  await Promise.all(emailPromises);
}

module.exports = {
  createTicket,
  getUserTickets,
  getTicketById,
  addReply,
  updateTicketStatus,
  getAllTickets,
  getSupportStats,
  assignTicket
};
