/**
 * Time Tracking Routes
 * 
 * Track time spent on tasks and projects
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * GET /api/timetracking
 * Get time entries for the current user
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate, taskId, projectId, status, page = 1, limit = 50 } = req.query;

  const where = { userId };

  if (taskId) where.taskId = taskId;
  if (projectId) where.projectId = projectId;
  if (status) where.status = status;
  
  if (startDate || endDate) {
    where.startTime = {};
    if (startDate) where.startTime.gte = new Date(startDate);
    if (endDate) where.startTime.lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [entries, total] = await Promise.all([
    global.prisma.timeEntry.findMany({
      where,
      include: {
        task: { select: { id: true, title: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { startTime: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    global.prisma.timeEntry.count({ where }),
  ]);

  // Calculate total hours
  const totalMinutes = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0);

  res.json({
    entries,
    total,
    totalHours: (totalMinutes / 60).toFixed(2),
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
  });
}));

/**
 * GET /api/timetracking/active
 * Get currently running time entry
 */
router.get('/active', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const activeEntry = await global.prisma.timeEntry.findFirst({
    where: {
      userId,
      endTime: null,
    },
    include: {
      task: { select: { id: true, title: true } },
      project: { select: { id: true, name: true } },
    },
  });

  res.json({ activeEntry });
}));

/**
 * POST /api/timetracking/start
 * Start a new time entry
 */
router.post('/start', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { taskId, projectId, description, billable = true } = req.body;

  // Check for existing running timer
  const existingEntry = await global.prisma.timeEntry.findFirst({
    where: { userId, endTime: null },
  });

  if (existingEntry) {
    return res.status(400).json({
      error: 'A timer is already running. Please stop it first.',
      activeEntry: existingEntry,
    });
  }

  // Get projectId from task if not provided
  let finalProjectId = projectId;
  if (taskId && !projectId) {
    const task = await global.prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });
    if (task) finalProjectId = task.projectId;
  }

  const entry = await global.prisma.timeEntry.create({
    data: {
      userId,
      taskId,
      projectId: finalProjectId,
      description,
      billable,
      startTime: new Date(),
    },
    include: {
      task: { select: { id: true, title: true } },
      project: { select: { id: true, name: true } },
    },
  });

  res.status(201).json({
    message: 'Timer started',
    entry,
  });
}));

/**
 * POST /api/timetracking/stop
 * Stop the current running timer
 */
router.post('/stop', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { description } = req.body;

  const activeEntry = await global.prisma.timeEntry.findFirst({
    where: { userId, endTime: null },
  });

  if (!activeEntry) {
    return res.status(400).json({ error: 'No active timer found' });
  }

  const endTime = new Date();
  const duration = Math.round((endTime - new Date(activeEntry.startTime)) / 60000); // in minutes

  const entry = await global.prisma.timeEntry.update({
    where: { id: activeEntry.id },
    data: {
      endTime,
      duration,
      description: description || activeEntry.description,
    },
    include: {
      task: { select: { id: true, title: true } },
      project: { select: { id: true, name: true } },
    },
  });

  res.json({
    message: `Timer stopped. Logged ${Math.floor(duration / 60)}h ${duration % 60}m`,
    entry,
  });
}));

/**
 * POST /api/timetracking
 * Create a manual time entry
 */
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { taskId, projectId, description, startTime, endTime, duration, billable = true } = req.body;

  if (!startTime) {
    return res.status(400).json({ error: 'startTime is required' });
  }

  const start = new Date(startTime);
  let end = endTime ? new Date(endTime) : null;
  let finalDuration = duration;

  // Calculate duration if endTime is provided but duration is not
  if (end && !finalDuration) {
    finalDuration = Math.round((end - start) / 60000);
  }

  // Get projectId from task if not provided
  let finalProjectId = projectId;
  if (taskId && !projectId) {
    const task = await global.prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });
    if (task) finalProjectId = task.projectId;
  }

  const entry = await global.prisma.timeEntry.create({
    data: {
      userId,
      taskId,
      projectId: finalProjectId,
      description,
      startTime: start,
      endTime: end,
      duration: finalDuration,
      billable,
    },
    include: {
      task: { select: { id: true, title: true } },
      project: { select: { id: true, name: true } },
    },
  });

  res.status(201).json({ entry });
}));

/**
 * PUT /api/timetracking/:id
 * Update a time entry
 */
router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { taskId, projectId, description, startTime, endTime, duration, billable, status } = req.body;

  const existing = await global.prisma.timeEntry.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return res.status(404).json({ error: 'Time entry not found' });
  }

  // Only allow editing if not approved
  if (existing.status === 'APPROVED') {
    return res.status(403).json({ error: 'Cannot edit approved time entries' });
  }

  // Recalculate duration if times changed
  let finalDuration = duration;
  if (startTime && endTime && !duration) {
    finalDuration = Math.round((new Date(endTime) - new Date(startTime)) / 60000);
  }

  const entry = await global.prisma.timeEntry.update({
    where: { id },
    data: {
      taskId,
      projectId,
      description,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      duration: finalDuration,
      billable,
      status,
    },
    include: {
      task: { select: { id: true, title: true } },
      project: { select: { id: true, name: true } },
    },
  });

  res.json({ entry });
}));

/**
 * DELETE /api/timetracking/:id
 * Delete a time entry
 */
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const existing = await global.prisma.timeEntry.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return res.status(404).json({ error: 'Time entry not found' });
  }

  if (existing.status === 'APPROVED') {
    return res.status(403).json({ error: 'Cannot delete approved time entries' });
  }

  await global.prisma.timeEntry.delete({ where: { id } });

  res.json({ message: 'Time entry deleted' });
}));

/**
 * POST /api/timetracking/submit
 * Submit time entries for approval
 */
router.post('/submit', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { entryIds, startDate, endDate } = req.body;

  let where = { userId, status: 'DRAFT' };

  if (entryIds && entryIds.length > 0) {
    where.id = { in: entryIds };
  } else if (startDate && endDate) {
    where.startTime = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  const result = await global.prisma.timeEntry.updateMany({
    where,
    data: { status: 'SUBMITTED' },
  });

  res.json({
    message: `Submitted ${result.count} time entries for approval`,
    count: result.count,
  });
}));

/**
 * GET /api/timetracking/summary
 * Get time tracking summary for dashboard
 */
router.get('/summary', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [todayEntries, weekEntries, monthEntries] = await Promise.all([
    global.prisma.timeEntry.aggregate({
      where: { userId, startTime: { gte: today } },
      _sum: { duration: true },
    }),
    global.prisma.timeEntry.aggregate({
      where: { userId, startTime: { gte: weekStart } },
      _sum: { duration: true },
    }),
    global.prisma.timeEntry.aggregate({
      where: { userId, startTime: { gte: monthStart } },
      _sum: { duration: true },
    }),
  ]);

  res.json({
    today: {
      minutes: todayEntries._sum.duration || 0,
      hours: ((todayEntries._sum.duration || 0) / 60).toFixed(2),
    },
    thisWeek: {
      minutes: weekEntries._sum.duration || 0,
      hours: ((weekEntries._sum.duration || 0) / 60).toFixed(2),
    },
    thisMonth: {
      minutes: monthEntries._sum.duration || 0,
      hours: ((monthEntries._sum.duration || 0) / 60).toFixed(2),
    },
  });
}));

module.exports = router;
