/**
 * Expense Routes
 * 
 * Manage employee expenses and approvals
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { asyncHandler } = require('../middleware/errorHandler');

// Get all expenses (Admin/Lead: all/team, Member: own)
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { status, limit = 50 } = req.query;
  const where = {};
  
  if (status) where.status = status;

  // Security & Filtering: Role-based data access
  if (req.user.role === 'OWNER' || req.user.role === 'ADMIN') {
      // Sees everything by default, filters by status if provided
  } else if (req.user.role === 'LEAD') {
      // Lead sees their own + department expenses or subordinates
      where.OR = [
          { userId: req.user.id },
          { user: { departmentId: req.user.departmentId } },
          { user: { managerId: req.user.id } }
      ];
  } else {
      // Member/Guest only see their own
      where.userId = req.user.id;
  }

  const expenses = await global.prisma.expense.findMany({
    where,
    take: Number(limit),
    orderBy: { date: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          department: { select: { name: true } }
        }
      }
    }
  });

  res.json(expenses);
}));

// Create new expense
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { description, amount, category, date, notes } = req.body;

  const expense = await global.prisma.expense.create({
    data: {
      userId: req.user.id,
      description,
      amount,
      category,
      date: date ? new Date(date) : new Date(),
      notes,
      status: 'PENDING',
    }
  });

  res.status(201).json(expense);
}));

// Update expense (Approve/Reject for Admins, Edit for owner if pending)
router.patch('/:id', authenticate, asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  const expenseId = req.params.id;

  const expense = await global.prisma.expense.findUnique({ where: { id: expenseId } });
  if (!expense) return res.status(404).json({ error: 'Expense not found' });

  // Approval logic
  if (status) {
    if (!['OWNER', 'ADMIN', 'LEAD'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized to update status' });
    }

    // LEAD hardening: Verify target user is a subordinate
    if (req.user.role === 'LEAD') {
       if (expense.userId !== req.user.id) { // Leads can approve their own if allowed? usually not, but check hierarchy
          const targetUser = await global.prisma.user.findUnique({
              where: { id: expense.userId },
              select: { managerId: true }
          });
          if (targetUser?.managerId !== req.user.id) {
              return res.status(403).json({ error: 'Leads can only approve expenses for their direct reports' });
          }
       }
    }
  }

  const updatedExpense = await global.prisma.expense.update({
    where: { id: expenseId },
    data: { 
        ...(status && { status }),
        ...(notes && { notes })
    }
  });

  res.json(updatedExpense);
}));

// Delete expense
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const expense = await global.prisma.expense.findUnique({ where: { id: req.params.id } });
  
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  
  if (expense.userId !== req.user.id && !['OWNER', 'ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  if (expense.status !== 'PENDING' && req.user.role === 'MEMBER') {
    return res.status(400).json({ error: 'Cannot delete processed expense' });
  }

  await global.prisma.expense.delete({ where: { id: req.params.id } });
  res.json({ message: 'Expense deleted' });
}));

module.exports = router;
