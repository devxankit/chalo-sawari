const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const supportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userType'
  },
  userType: {
    type: String,
    required: true,
    enum: ['User', 'Driver']
  },
  ticketNumber: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  category: {
    type: String,
    required: true,
    enum: ['technical', 'billing', 'booking', 'safety', 'general', 'other']
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    required: true,
    enum: ['open', 'assigned', 'in_progress', 'waiting_for_customer', 'resolved', 'closed'],
    default: 'open'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'replies.userType'
    },
    userType: {
      type: String,
      required: true,
      enum: ['User', 'Driver', 'Admin']
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    isInternal: {
      type: Boolean,
      default: false
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    reason: String
  }],
  tags: [{
    type: String,
    trim: true
  }],
  estimatedResolutionTime: {
    type: Date
  },
  actualResolutionTime: {
    type: Date
  },
  customerSatisfaction: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    submittedAt: Date
  },
  escalation: {
    escalated: {
      type: Boolean,
      default: false
    },
    escalatedAt: Date,
    escalatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    escalatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    reason: String
  },
  sla: {
    targetResolutionTime: {
      type: Number, // in hours
      default: 24
    },
    actualResolutionTime: Number, // in hours
    breached: {
      type: Boolean,
      default: false
    },
    breachReason: String
  },
  metadata: {
    source: {
      type: String,
      enum: ['web', 'mobile_app', 'phone', 'email', 'chat'],
      default: 'web'
    },
    deviceInfo: {
      userAgent: String,
      deviceType: String,
      browser: String,
      os: String
    },
    location: {
      country: String,
      city: String,
      coordinates: [Number] // [longitude, latitude]
    },
    ipAddress: String
  }
}, {
  timestamps: true
});

// Indexes
supportSchema.index({ user: 1, userType: 1, createdAt: -1 });
supportSchema.index({ ticketNumber: 1 });
supportSchema.index({ status: 1, priority: 1, createdAt: -1 });
supportSchema.index({ assignedTo: 1, status: 1 });
supportSchema.index({ category: 1, status: 1 });
supportSchema.index({ 'statusHistory.updatedAt': -1 });

// Virtual for ticket age
supportSchema.virtual('ageInHours').get(function() {
  const now = new Date();
  const created = this.createdAt;
  return Math.floor((now - created) / (1000 * 60 * 60));
});

// Virtual for response time
supportSchema.virtual('firstResponseTime').get(function() {
  if (this.replies.length > 0) {
    const firstReply = this.replies[0];
    return Math.floor((firstReply.timestamp - this.createdAt) / (1000 * 60 * 60));
  }
  return null;
});

// Virtual for resolution time
supportSchema.virtual('resolutionTimeInHours').get(function() {
  if (this.status === 'resolved' && this.actualResolutionTime) {
    return Math.floor((this.actualResolutionTime - this.createdAt) / (1000 * 60 * 60));
  }
  return null;
});

// Virtual for SLA status
supportSchema.virtual('slaStatus').get(function() {
  if (this.status === 'resolved') {
    const resolutionTime = this.resolutionTimeInHours;
    if (resolutionTime > this.sla.targetResolutionTime) {
      return 'breached';
    } else if (resolutionTime <= this.sla.targetResolutionTime * 0.8) {
      return 'excellent';
    } else {
      return 'met';
    }
  }
  return 'pending';
});

// Methods
supportSchema.methods.addReply = function(userId, userType, message, isInternal = false) {
  this.replies.push({
    user: userId,
    userType,
    message,
    isInternal,
    timestamp: new Date()
  });

  // Update status based on reply
  if (userType !== 'Admin' && this.status === 'waiting_for_customer') {
    this.status = 'in_progress';
  }

  return this.save();
};

supportSchema.methods.updateStatus = function(newStatus, adminId, assignedTo = null, reason = null) {
  this.status = newStatus;
  
  if (assignedTo) {
    this.assignedTo = assignedTo;
  }

  this.statusHistory.push({
    status: newStatus,
    updatedBy: adminId,
    updatedAt: new Date(),
    assignedTo: this.assignedTo,
    reason
  });

  // Update resolution time if resolved
  if (newStatus === 'resolved') {
    this.actualResolutionTime = new Date();
    this.sla.actualResolutionTime = this.resolutionTimeInHours;
    this.sla.breached = this.sla.actualResolutionTime > this.sla.targetResolutionTime;
  }

  return this.save();
};

supportSchema.methods.escalate = function(adminId, escalatedTo, reason) {
  this.escalation.escalated = true;
  this.escalation.escalatedAt = new Date();
  this.escalation.escalatedBy = adminId;
  this.escalation.escalatedTo = escalatedTo;
  this.escalation.reason = reason;
  
  this.status = 'assigned';
  this.assignedTo = escalatedTo;
  
  this.statusHistory.push({
    status: 'escalated',
    updatedBy: adminId,
    updatedAt: new Date(),
    assignedTo: escalatedTo,
    reason: `Escalated: ${reason}`
  });

  return this.save();
};

supportSchema.methods.addSatisfactionRating = function(rating, feedback) {
  this.customerSatisfaction = {
    rating,
    feedback,
    submittedAt: new Date()
  };
  return this.save();
};

// Static methods
supportSchema.statics.getTicketStats = async function(period = 'month') {
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

  const stats = await this.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: null,
        totalTickets: { $sum: 1 },
        openTickets: {
          $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] }
        },
        resolvedTickets: {
          $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
        },
        avgResolutionTime: {
          $avg: {
            $cond: [
              { $eq: ['$status', 'resolved'] },
              { $subtract: ['$actualResolutionTime', '$createdAt'] },
              null
            ]
          }
        }
      }
    }
  ]);

  return stats[0] || {
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    avgResolutionTime: 0
  };
};

supportSchema.statics.getCategoryStats = async function(period = 'month') {
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

  return await this.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgResolutionTime: {
          $avg: {
            $cond: [
              { $eq: ['$status', 'resolved'] },
              { $subtract: ['$actualResolutionTime', '$createdAt'] },
              null
            ]
          }
        }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Pre-save middleware
supportSchema.pre('save', function(next) {
  // Auto-assign priority based on category and keywords
  if (this.isNew && this.priority === 'medium') {
    if (this.category === 'safety' || this.subject.toLowerCase().includes('urgent')) {
      this.priority = 'high';
    } else if (this.category === 'billing' || this.subject.toLowerCase().includes('payment')) {
      this.priority = 'medium';
    }
  }

  // Set estimated resolution time based on priority
  if (this.isNew) {
    const now = new Date();
    let hours = 24; // default
    
    switch (this.priority) {
      case 'urgent':
        hours = 4;
        break;
      case 'high':
        hours = 8;
        break;
      case 'medium':
        hours = 24;
        break;
      case 'low':
        hours = 48;
        break;
    }
    
    this.estimatedResolutionTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
  }

  next();
});

// Pre-remove middleware
supportSchema.pre('remove', async function(next) {
  // Clean up any related data if needed
  next();
});

// Add pagination plugin
supportSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Support', supportSchema);
