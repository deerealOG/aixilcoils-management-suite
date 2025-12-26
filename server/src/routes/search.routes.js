/**
 * Global Search Routes
 * 
 * Unified search across all entities in the system
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * GET /api/search
 * Global search across all entities
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { q, type, limit = 20 } = req.query;
  const userId = req.user.id;
  const userRole = req.user.role;
  
  if (!q || q.trim().length < 2) {
    return res.json({ results: [], total: 0 });
  }

  const searchTerm = q.trim().toLowerCase();
  const searchLimit = Math.min(parseInt(limit) || 20, 50);
  const results = [];

  // Search filters based on type parameter
  const searchTypes = type ? type.split(',') : ['users', 'projects', 'tasks', 'documents', 'channels', 'departments'];

  // Search Users (if admin/manager or searching for self)
  if (searchTypes.includes('users')) {
    const users = await global.prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { position: { contains: searchTerm, mode: 'insensitive' } },
        ],
        status: 'ACTIVE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        position: true,
        department: { select: { name: true } },
      },
      take: searchLimit,
    });

    results.push(...users.map(u => ({
      id: u.id,
      type: 'user',
      title: `${u.firstName} ${u.lastName}`,
      subtitle: u.position || u.email,
      description: u.department?.name,
      avatar: u.avatar,
      url: `/profile/${u.id}`,
      icon: 'user',
    })));
  }

  // Search Projects
  if (searchTypes.includes('projects')) {
    const projectWhere = {
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ],
    };

    // Non-admins can only see their projects
    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(userRole)) {
      projectWhere.members = { some: { userId } };
    }

    const projects = await global.prisma.project.findMany({
      where: projectWhere,
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        progress: true,
        department: { select: { name: true } },
      },
      take: searchLimit,
    });

    results.push(...projects.map(p => ({
      id: p.id,
      type: 'project',
      title: p.name,
      subtitle: `${p.status} • ${p.progress}% complete`,
      description: p.description?.substring(0, 100),
      department: p.department?.name,
      url: `/projects/${p.id}`,
      icon: 'folder',
    })));
  }

  // Search Tasks
  if (searchTypes.includes('tasks')) {
    const taskWhere = {
      OR: [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ],
    };

    // Non-admins can only see their tasks or tasks in their projects
    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(userRole)) {
      taskWhere.OR = [
        { assigneeId: userId },
        { creatorId: userId },
        { project: { members: { some: { userId } } } },
      ];
    }

    const tasks = await global.prisma.task.findMany({
      where: taskWhere,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        project: { select: { id: true, name: true } },
        assignee: { select: { firstName: true, lastName: true } },
      },
      take: searchLimit,
    });

    results.push(...tasks.map(t => ({
      id: t.id,
      type: 'task',
      title: t.title,
      subtitle: `${t.status} • ${t.priority} priority`,
      description: t.project?.name,
      assignee: t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : null,
      dueDate: t.dueDate,
      url: `/projects/${t.project?.id}?task=${t.id}`,
      icon: 'check-square',
    })));
  }

  // Search Documents
  if (searchTypes.includes('documents')) {
    const docWhere = {
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ],
    };

    // Non-admins can only see public docs or their own
    if (!['SUPER_ADMIN', 'ADMIN', 'HR_OFFICER'].includes(userRole)) {
      docWhere.OR = [
        { isPublic: true },
        { uploaderId: userId },
        { userId: userId },
      ];
    }

    const documents = await global.prisma.document.findMany({
      where: docWhere,
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        fileSize: true,
        createdAt: true,
        uploader: { select: { firstName: true, lastName: true } },
      },
      take: searchLimit,
    });

    results.push(...documents.map(d => ({
      id: d.id,
      type: 'document',
      title: d.name,
      subtitle: d.type,
      description: d.description,
      uploader: d.uploader ? `${d.uploader.firstName} ${d.uploader.lastName}` : null,
      fileSize: d.fileSize,
      url: `/documents/${d.id}`,
      icon: 'file-text',
    })));
  }

  // Search Channels
  if (searchTypes.includes('channels')) {
    const channelWhere = {
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ],
      // Only show channels user is a member of, or public channels
      OR: [
        { isPrivate: false },
        { members: { some: { userId } } },
      ],
    };

    const channels = await global.prisma.channel.findMany({
      where: channelWhere,
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        isPrivate: true,
        _count: { select: { members: true } },
      },
      take: searchLimit,
    });

    results.push(...channels.map(c => ({
      id: c.id,
      type: 'channel',
      title: c.name,
      subtitle: `${c.type} • ${c._count.members} members`,
      description: c.description,
      isPrivate: c.isPrivate,
      url: `/chat?channel=${c.id}`,
      icon: c.isPrivate ? 'lock' : 'hash',
    })));
  }

  // Search Departments
  if (searchTypes.includes('departments')) {
    const departments = await global.prisma.department.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { code: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        _count: { select: { users: true } },
      },
      take: searchLimit,
    });

    results.push(...departments.map(d => ({
      id: d.id,
      type: 'department',
      title: d.name,
      subtitle: `${d.code} • ${d._count.users} members`,
      description: d.description,
      url: `/hr?department=${d.id}`,
      icon: 'building',
    })));
  }

  // Sort results by relevance (exact matches first)
  results.sort((a, b) => {
    const aExact = a.title.toLowerCase().includes(searchTerm) ? 0 : 1;
    const bExact = b.title.toLowerCase().includes(searchTerm) ? 0 : 1;
    return aExact - bExact;
  });

  res.json({
    results: results.slice(0, searchLimit),
    total: results.length,
    query: q,
  });
}));

/**
 * GET /api/search/recent
 * Get recent searches and frequently accessed items
 */
router.get('/recent', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get recent audit logs for this user (their recent activity)
  const recentActivity = await global.prisma.auditLog.findMany({
    where: {
      userId,
      action: { in: ['VIEW', 'UPDATE', 'CREATE'] },
    },
    select: {
      entityType: true,
      entityId: true,
      action: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    distinct: ['entityType', 'entityId'],
  });

  // Get recently assigned tasks
  const recentTasks = await global.prisma.task.findMany({
    where: {
      OR: [
        { assigneeId: userId },
        { creatorId: userId },
      ],
    },
    select: {
      id: true,
      title: true,
      status: true,
      project: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 5,
  });

  // Get user's projects
  const recentProjects = await global.prisma.project.findMany({
    where: {
      members: { some: { userId } },
    },
    select: {
      id: true,
      name: true,
      status: true,
    },
    orderBy: { updatedAt: 'desc' },
    take: 5,
  });

  res.json({
    recentTasks: recentTasks.map(t => ({
      id: t.id,
      type: 'task',
      title: t.title,
      subtitle: t.project?.name,
      url: `/projects/${t.project?.id}?task=${t.id}`,
      icon: 'check-square',
    })),
    recentProjects: recentProjects.map(p => ({
      id: p.id,
      type: 'project',
      title: p.name,
      subtitle: p.status,
      url: `/projects/${p.id}`,
      icon: 'folder',
    })),
  });
}));

/**
 * GET /api/search/suggestions
 * Get search suggestions based on partial input
 */
router.get('/suggestions', authenticate, asyncHandler(async (req, res) => {
  const { q } = req.query;
  
  if (!q || q.trim().length < 1) {
    return res.json({ suggestions: [] });
  }

  const searchTerm = q.trim().toLowerCase();
  const suggestions = [];

  // Quick suggestions from various sources
  const [users, projects, tasks] = await Promise.all([
    global.prisma.user.findMany({
      where: {
        OR: [
          { firstName: { startsWith: searchTerm, mode: 'insensitive' } },
          { lastName: { startsWith: searchTerm, mode: 'insensitive' } },
        ],
        status: 'ACTIVE',
      },
      select: { firstName: true, lastName: true },
      take: 3,
    }),
    global.prisma.project.findMany({
      where: { name: { startsWith: searchTerm, mode: 'insensitive' } },
      select: { name: true },
      take: 3,
    }),
    global.prisma.task.findMany({
      where: { title: { startsWith: searchTerm, mode: 'insensitive' } },
      select: { title: true },
      take: 3,
    }),
  ]);

  suggestions.push(...users.map(u => `${u.firstName} ${u.lastName}`));
  suggestions.push(...projects.map(p => p.name));
  suggestions.push(...tasks.map(t => t.title));

  // Remove duplicates and limit
  const uniqueSuggestions = [...new Set(suggestions)].slice(0, 8);

  res.json({ suggestions: uniqueSuggestions });
}));

module.exports = router;
