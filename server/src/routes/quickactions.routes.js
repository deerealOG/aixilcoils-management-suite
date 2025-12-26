/**
 * Quick Actions Routes
 * 
 * Rapid CRUD operations for common entities
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * POST /api/quick/task
 * Quick create a task
 */
router.post('/task', authenticate, asyncHandler(async (req, res) => {
  const { title, projectId, description, priority, dueDate, assigneeId } = req.body;
  const userId = req.user.id;

  if (!title || !projectId) {
    return res.status(400).json({ error: 'Title and project are required' });
  }

  // Verify project exists and user has access
  const project = await global.prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { members: { some: { userId } } },
        { department: { users: { some: { id: userId } } } },
      ],
    },
  });

  if (!project) {
    return res.status(404).json({ error: 'Project not found or access denied' });
  }

  const task = await global.prisma.task.create({
    data: {
      title,
      description,
      priority: priority || 'MEDIUM',
      dueDate: dueDate ? new Date(dueDate) : null,
      projectId,
      assigneeId: assigneeId || userId,
      creatorId: userId,
      status: 'TODO',
    },
    include: {
      project: { select: { name: true } },
      assignee: { select: { firstName: true, lastName: true } },
    },
  });

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    task,
    url: `/projects/${projectId}?task=${task.id}`,
  });
}));

/**
 * POST /api/quick/note
 * Quick create a note/document
 */
router.post('/note', authenticate, asyncHandler(async (req, res) => {
  const { title, content, isPublic = false } = req.body;
  const userId = req.user.id;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  // Create as a document with type 'OTHER'
  const document = await global.prisma.document.create({
    data: {
      name: title,
      description: content,
      type: 'OTHER',
      fileName: `note_${Date.now()}.txt`,
      filePath: '', // Notes don't have file paths
      fileSize: Buffer.byteLength(content || '', 'utf8'),
      mimeType: 'text/plain',
      uploaderId: userId,
      isPublic,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Note created successfully',
    document,
    url: `/documents/${document.id}`,
  });
}));

/**
 * POST /api/quick/leave
 * Quick submit leave request
 */
router.post('/leave', authenticate, asyncHandler(async (req, res) => {
  const { type, startDate, endDate, reason } = req.body;
  const userId = req.user.id;

  if (!type || !startDate || !endDate) {
    return res.status(400).json({ error: 'Type, start date, and end date are required' });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  if (days <= 0) {
    return res.status(400).json({ error: 'End date must be after start date' });
  }

  const leave = await global.prisma.leaveRequest.create({
    data: {
      employeeId: userId,
      type,
      startDate: start,
      endDate: end,
      days,
      reason,
      status: 'PENDING',
    },
    include: {
      employee: { select: { firstName: true, lastName: true } },
    },
  });

  res.status(201).json({
    success: true,
    message: 'Leave request submitted',
    leave,
    url: `/hr?tab=leave`,
  });
}));

/**
 * POST /api/quick/message
 * Quick send a message
 */
router.post('/message', authenticate, asyncHandler(async (req, res) => {
  const { channelId, content, recipientId } = req.body;
  const userId = req.user.id;

  if (!content) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  let targetChannelId = channelId;

  // If recipientId is provided, find or create a DM channel
  if (recipientId && !channelId) {
    // Look for existing DM channel
    let dmChannel = await global.prisma.channel.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: recipientId } } },
        ],
      },
    });

    if (!dmChannel) {
      // Get recipient info
      const recipient = await global.prisma.user.findUnique({
        where: { id: recipientId },
        select: { firstName: true, lastName: true },
      });

      if (!recipient) {
        return res.status(404).json({ error: 'Recipient not found' });
      }

      // Create DM channel
      dmChannel = await global.prisma.channel.create({
        data: {
          name: `DM`,
          type: 'DIRECT',
          isPrivate: true,
          members: {
            create: [
              { userId, role: 'MEMBER' },
              { userId: recipientId, role: 'MEMBER' },
            ],
          },
        },
      });
    }

    targetChannelId = dmChannel.id;
  }

  if (!targetChannelId) {
    return res.status(400).json({ error: 'Channel or recipient is required' });
  }

  // Verify user has access to channel
  const membership = await global.prisma.channelMember.findFirst({
    where: { channelId: targetChannelId, userId },
  });

  if (!membership) {
    return res.status(403).json({ error: 'Not a member of this channel' });
  }

  const message = await global.prisma.message.create({
    data: {
      content,
      channelId: targetChannelId,
      senderId: userId,
    },
    include: {
      sender: { select: { firstName: true, lastName: true, avatar: true } },
    },
  });

  res.status(201).json({
    success: true,
    message: 'Message sent',
    data: message,
    url: `/chat?channel=${targetChannelId}`,
  });
}));

/**
 * POST /api/quick/clockin
 * Quick clock in/out
 */
router.post('/clockin', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check for existing attendance record today
  let attendance = await global.prisma.attendance.findFirst({
    where: {
      userId,
      date: today,
    },
  });

  if (!attendance) {
    // Clock in
    attendance = await global.prisma.attendance.create({
      data: {
        userId,
        date: today,
        checkIn: new Date(),
        status: 'PRESENT',
      },
    });

    res.json({
      success: true,
      action: 'clocked_in',
      message: 'Clocked in successfully',
      attendance,
    });
  } else if (!attendance.checkOut) {
    // Clock out
    const checkOut = new Date();
    const checkIn = new Date(attendance.checkIn);
    const hoursWorked = ((checkOut - checkIn) / (1000 * 60 * 60)).toFixed(2);

    attendance = await global.prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut,
        hoursWorked: parseFloat(hoursWorked),
      },
    });

    res.json({
      success: true,
      action: 'clocked_out',
      message: `Clocked out. Worked ${hoursWorked} hours today.`,
      attendance,
    });
  } else {
    res.json({
      success: false,
      action: 'already_complete',
      message: 'Already clocked in and out for today',
      attendance,
    });
  }
}));

/**
 * GET /api/quick/status
 * Get quick status overview for current user
 */
router.get('/status', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    pendingTasks,
    overdueTasks,
    pendingLeaves,
    unreadNotifications,
    todayAttendance,
    activeProjects,
  ] = await Promise.all([
    global.prisma.task.count({
      where: { assigneeId: userId, status: { in: ['TODO', 'IN_PROGRESS'] } },
    }),
    global.prisma.task.count({
      where: {
        assigneeId: userId,
        status: { in: ['TODO', 'IN_PROGRESS'] },
        dueDate: { lt: new Date() },
      },
    }),
    global.prisma.leaveRequest.count({
      where: { employeeId: userId, status: 'PENDING' },
    }),
    global.prisma.notification.count({
      where: { userId, isRead: false },
    }),
    global.prisma.attendance.findFirst({
      where: { userId, date: today },
    }),
    global.prisma.projectMember.count({
      where: {
        userId,
        project: { status: 'IN_PROGRESS' },
      },
    }),
  ]);

  res.json({
    tasks: {
      pending: pendingTasks,
      overdue: overdueTasks,
    },
    leaves: {
      pending: pendingLeaves,
    },
    notifications: {
      unread: unreadNotifications,
    },
    attendance: {
      clockedIn: !!todayAttendance?.checkIn,
      clockedOut: !!todayAttendance?.checkOut,
      hoursWorked: todayAttendance?.hoursWorked || 0,
    },
    projects: {
      active: activeProjects,
    },
  });
}));

/**
 * GET /api/quick/upcoming
 * Get upcoming deadlines and events
 */
router.get('/upcoming', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [upcomingTasks, upcomingLeaves, upcomingReviews] = await Promise.all([
    global.prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: { in: ['TODO', 'IN_PROGRESS'] },
        dueDate: { gte: now, lte: nextWeek },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        priority: true,
        project: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    }),
    global.prisma.leaveRequest.findMany({
      where: {
        employeeId: userId,
        status: 'APPROVED',
        startDate: { gte: now, lte: nextWeek },
      },
      select: {
        id: true,
        type: true,
        startDate: true,
        endDate: true,
      },
      orderBy: { startDate: 'asc' },
      take: 3,
    }),
    global.prisma.performanceReview.findMany({
      where: {
        OR: [
          { employeeId: userId },
          { reviewerId: userId },
        ],
        status: { in: ['DRAFT', 'SUBMITTED'] },
      },
      select: {
        id: true,
        period: true,
        type: true,
        status: true,
        employee: { select: { firstName: true, lastName: true } },
      },
      take: 3,
    }),
  ]);

  res.json({
    tasks: upcomingTasks.map(t => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate,
      priority: t.priority,
      project: t.project?.name,
      url: `/projects/${t.project?.id}?task=${t.id}`,
    })),
    leaves: upcomingLeaves,
    reviews: upcomingReviews.map(r => ({
      id: r.id,
      period: r.period,
      type: r.type,
      status: r.status,
      employee: `${r.employee.firstName} ${r.employee.lastName}`,
    })),
  });
}));

module.exports = router;
