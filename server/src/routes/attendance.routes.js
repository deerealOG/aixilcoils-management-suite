/**
 * Attendance Routes
 * 
 * Employee attendance tracking
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { asyncHandler } = require('../middleware/errorHandler');
const { paginate, createPaginationMeta, getPeriodDates } = require('../utils/helpers');

/**
 * GET /api/attendance
 * Get attendance records
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { page, limit, userId, startDate, endDate, status } = req.query;
  const { skip, take, page: pageNum, limit: limitNum } = paginate(page, limit);

  const where = {};
  if (userId) where.userId = userId;
  if (status) where.status = status;
  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  // Employees see only their own attendance
  if (req.user.role === 'EMPLOYEE') {
    where.userId = req.user.id;
  }

  const [records, total] = await Promise.all([
    global.prisma.attendance.findMany({
      where,
      skip,
      take,
      orderBy: { date: 'desc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    }),
    global.prisma.attendance.count({ where }),
  ]);

  res.json({
    data: records,
    pagination: createPaginationMeta(total, pageNum, limitNum),
  });
}));

/**
 * GET /api/attendance/my-attendance
 * Get current user's attendance for current month
 */
router.get('/my-attendance', authenticate, asyncHandler(async (req, res) => {
  const { startDate, endDate } = getPeriodDates('month');

  const records = await global.prisma.attendance.findMany({
    where: {
      userId: req.user.id,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: 'asc' },
  });

  // Calculate summary
  const summary = {
    present: records.filter(r => r.status === 'PRESENT').length,
    absent: records.filter(r => r.status === 'ABSENT').length,
    late: records.filter(r => r.status === 'LATE').length,
    halfDay: records.filter(r => r.status === 'HALF_DAY').length,
    wfh: records.filter(r => r.status === 'WORK_FROM_HOME').length,
    onLeave: records.filter(r => r.status === 'ON_LEAVE').length,
    totalHours: records.reduce((sum, r) => sum + (Number(r.hoursWorked) || 0), 0),
  };

  res.json({ records, summary });
}));

/**
 * GET /api/attendance/today
 * Get today's attendance status
 */
router.get('/today', authenticate, asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const record = await global.prisma.attendance.findFirst({
    where: {
      userId: req.user.id,
      date: today,
    },
  });

  res.json(record || { status: 'NOT_RECORDED' });
}));

/**
 * POST /api/attendance/check-in
 * Record check-in
 */
router.post('/check-in', authenticate, asyncHandler(async (req, res) => {
  const { notes, status } = req.body;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if already checked in
  const existing = await global.prisma.attendance.findFirst({
    where: {
      userId: req.user.id,
      date: today,
    },
  });

  if (existing?.checkIn) {
    return res.status(400).json({ error: 'Already checked in today' });
  }

  const checkInTime = new Date();
  
  // Determine status based on check-in time (9 AM as default start)
  const lateThreshold = new Date(today);
  lateThreshold.setHours(9, 15, 0, 0); // 9:15 AM

  const attendanceStatus = status || (checkInTime > lateThreshold ? 'LATE' : 'PRESENT');

  const record = existing
    ? await global.prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkIn: checkInTime,
          status: attendanceStatus,
          notes,
        },
      })
    : await global.prisma.attendance.create({
        data: {
          userId: req.user.id,
          date: today,
          checkIn: checkInTime,
          status: attendanceStatus,
          notes,
        },
      });

  res.json(record);
}));

/**
 * POST /api/attendance/check-out
 * Record check-out
 */
router.post('/check-out', authenticate, asyncHandler(async (req, res) => {
  const { notes } = req.body;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const record = await global.prisma.attendance.findFirst({
    where: {
      userId: req.user.id,
      date: today,
    },
  });

  if (!record?.checkIn) {
    return res.status(400).json({ error: 'Must check in first' });
  }

  if (record.checkOut) {
    return res.status(400).json({ error: 'Already checked out today' });
  }

  const checkOutTime = new Date();
  const hoursWorked = (checkOutTime - new Date(record.checkIn)) / (1000 * 60 * 60);

  const updated = await global.prisma.attendance.update({
    where: { id: record.id },
    data: {
      checkOut: checkOutTime,
      hoursWorked: Math.round(hoursWorked * 100) / 100,
      notes: notes ? (record.notes ? `${record.notes}; ${notes}` : notes) : record.notes,
    },
  });

  res.json(updated);
}));

/**
 * POST /api/attendance
 * Manual attendance entry (HR/Admin)
 */
router.post('/', authenticate, authorize('attendance:create'), asyncHandler(async (req, res) => {
  const { userId, date, checkIn, checkOut, status, notes } = req.body;

  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  // Check for existing record
  const existing = await global.prisma.attendance.findFirst({
    where: { userId, date: attendanceDate },
  });

  let hoursWorked = null;
  if (checkIn && checkOut) {
    hoursWorked = (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60);
  }

  const record = existing
    ? await global.prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkIn: checkIn ? new Date(checkIn) : null,
          checkOut: checkOut ? new Date(checkOut) : null,
          status,
          hoursWorked,
          notes,
        },
      })
    : await global.prisma.attendance.create({
        data: {
          userId,
          date: attendanceDate,
          checkIn: checkIn ? new Date(checkIn) : null,
          checkOut: checkOut ? new Date(checkOut) : null,
          status,
          hoursWorked,
          notes,
        },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

  res.status(201).json(record);
}));

/**
 * PUT /api/attendance/:id
 * Update attendance record
 */
router.put('/:id', authenticate, authorize('attendance:update'), asyncHandler(async (req, res) => {
  const { checkIn, checkOut, status, notes } = req.body;

  const updateData = {};
  if (checkIn) updateData.checkIn = new Date(checkIn);
  if (checkOut) updateData.checkOut = new Date(checkOut);
  if (status) updateData.status = status;
  if (notes !== undefined) updateData.notes = notes;

  if (checkIn && checkOut) {
    updateData.hoursWorked = (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60);
  }

  const record = await global.prisma.attendance.update({
    where: { id: req.params.id },
    data: updateData,
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  res.json(record);
}));

/**
 * GET /api/attendance/report
 * Get attendance report
 */
router.get('/report', authenticate, authorize('attendance:read'), asyncHandler(async (req, res) => {
  const { departmentId, startDate, endDate } = req.query;
  const { startDate: defaultStart, endDate: defaultEnd } = getPeriodDates('month');

  const start = startDate ? new Date(startDate) : defaultStart;
  const end = endDate ? new Date(endDate) : defaultEnd;

  // Get users
  const userWhere = departmentId ? { departmentId } : {};
  if (req.user.role === 'MANAGER') {
    userWhere.departmentId = req.user.departmentId;
  }

  const users = await global.prisma.user.findMany({
    where: { ...userWhere, status: 'ACTIVE' },
    select: { id: true, firstName: true, lastName: true, department: { select: { name: true } } },
  });

  // Get attendance for each user
  const report = await Promise.all(
    users.map(async (user) => {
      const attendance = await global.prisma.attendance.findMany({
        where: {
          userId: user.id,
          date: { gte: start, lte: end },
        },
      });

      return {
        user,
        present: attendance.filter(a => a.status === 'PRESENT').length,
        absent: attendance.filter(a => a.status === 'ABSENT').length,
        late: attendance.filter(a => a.status === 'LATE').length,
        wfh: attendance.filter(a => a.status === 'WORK_FROM_HOME').length,
        totalHours: attendance.reduce((sum, a) => sum + (Number(a.hoursWorked) || 0), 0),
      };
    })
  );

  res.json({
    period: { start, end },
    report,
  });
}));

module.exports = router;
