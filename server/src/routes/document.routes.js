/**
 * Document Routes
 * 
 * HR document management
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { uploadDocument } = require('../middleware/upload');
const { asyncHandler } = require('../middleware/errorHandler');
const { paginate, createPaginationMeta } = require('../utils/helpers');
const path = require('path');
const fs = require('fs').promises;

/**
 * GET /api/documents
 * Get documents
 */
router.get('/', authenticate, authorize('documents:read'), asyncHandler(async (req, res) => {
  const { page, limit, type, userId, isPublic } = req.query;
  const { skip, take, page: pageNum, limit: limitNum } = paginate(page, limit);

  const where = {};
  if (type) where.type = type;
  if (userId) where.userId = userId;
  if (isPublic !== undefined) where.isPublic = isPublic === 'true';

  // Employees can only see their own documents and public documents
  if (req.user.role === 'EMPLOYEE') {
    where.OR = [
      { userId: req.user.id },
      { isPublic: true },
    ];
  }

  const [documents, total] = await Promise.all([
    global.prisma.document.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: {
          select: { id: true, firstName: true, lastName: true },
        },
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    }),
    global.prisma.document.count({ where }),
  ]);

  res.json({
    data: documents,
    pagination: createPaginationMeta(total, pageNum, limitNum),
  });
}));

/**
 * GET /api/documents/my-documents
 * Get current user's documents
 */
router.get('/my-documents', authenticate, asyncHandler(async (req, res) => {
  const documents = await global.prisma.document.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      uploader: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  res.json(documents);
}));

/**
 * GET /api/documents/policies
 * Get public policy documents
 */
router.get('/policies', authenticate, asyncHandler(async (req, res) => {
  const documents = await global.prisma.document.findMany({
    where: {
      type: 'POLICY',
      isPublic: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(documents);
}));

/**
 * GET /api/documents/:id
 * Get document details
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const document = await global.prisma.document.findUnique({
    where: { id: req.params.id },
    include: {
      uploader: {
        select: { id: true, firstName: true, lastName: true },
      },
      user: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // Check access
  if (!document.isPublic && 
      req.user.role === 'EMPLOYEE' && 
      document.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json(document);
}));

/**
 * GET /api/documents/:id/download
 * Download document
 */
router.get('/:id/download', authenticate, asyncHandler(async (req, res) => {
  const document = await global.prisma.document.findUnique({
    where: { id: req.params.id },
  });

  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // Check access
  if (!document.isPublic && 
      req.user.role === 'EMPLOYEE' && 
      document.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const filePath = path.join(process.cwd(), document.filePath);
  
  try {
    await fs.access(filePath);
    res.download(filePath, document.fileName);
  } catch (error) {
    res.status(404).json({ error: 'File not found' });
  }
}));

/**
 * POST /api/documents
 * Upload a new document
 */
router.post('/', authenticate, authorize('documents:upload'), uploadDocument, asyncHandler(async (req, res) => {
  const { type, userId, description, expiryDate, isPublic } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const document = await global.prisma.document.create({
    data: {
      name: req.body.name || req.file.originalname.replace(/\.[^/.]+$/, ''),
      type: type || 'OTHER',
      fileName: req.file.originalname,
      filePath: `/uploads/${req.file.filename}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploaderId: req.user.id,
      userId,
      description,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      isPublic: isPublic === 'true' || isPublic === true,
    },
    include: {
      uploader: {
        select: { id: true, firstName: true, lastName: true },
      },
      user: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  res.status(201).json(document);
}));

/**
 * PUT /api/documents/:id
 * Update document metadata
 */
router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const { name, description, type, expiryDate, isPublic } = req.body;

  const document = await global.prisma.document.findUnique({
    where: { id: req.params.id },
  });

  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // Check permissions
  if (document.uploaderId !== req.user.id && 
      !['SUPER_ADMIN', 'ADMIN', 'HR_OFFICER'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (type) updateData.type = type;
  if (expiryDate !== undefined) updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;
  if (isPublic !== undefined) updateData.isPublic = isPublic;

  const updated = await global.prisma.document.update({
    where: { id: req.params.id },
    data: updateData,
  });

  res.json(updated);
}));

/**
 * DELETE /api/documents/:id
 * Delete document
 */
router.delete('/:id', authenticate, authorize('documents:delete'), asyncHandler(async (req, res) => {
  const document = await global.prisma.document.findUnique({
    where: { id: req.params.id },
  });

  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // Delete file from filesystem
  try {
    const filePath = path.join(process.cwd(), document.filePath);
    await fs.unlink(filePath);
  } catch (error) {
    // Log but don't fail if file doesn't exist
    console.warn('Could not delete file:', error.message);
  }

  await global.prisma.document.delete({
    where: { id: req.params.id },
  });

  res.json({ message: 'Document deleted successfully' });
}));

module.exports = router;
