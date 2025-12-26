/**
 * File Upload Middleware
 * 
 * Multer configuration for handling file uploads
 */

const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
];
const ALLOWED_ALL_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

// Max file sizes
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter factory
const createFileFilter = (allowedTypes) => {
  return (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
  };
};

// Avatar upload configuration
const uploadAvatar = multer({
  storage,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 1,
  },
  fileFilter: createFileFilter(ALLOWED_IMAGE_TYPES),
}).single('avatar');

// Document upload configuration
const uploadDocument = multer({
  storage,
  limits: {
    fileSize: MAX_DOCUMENT_SIZE,
    files: 1,
  },
  fileFilter: createFileFilter(ALLOWED_ALL_TYPES),
}).single('document');

// Multiple files upload configuration
const uploadMultiple = multer({
  storage,
  limits: {
    fileSize: MAX_DOCUMENT_SIZE,
    files: 5,
  },
  fileFilter: createFileFilter(ALLOWED_ALL_TYPES),
}).array('files', 5);

// Chat attachment upload configuration
const uploadAttachment = multer({
  storage,
  limits: {
    fileSize: MAX_DOCUMENT_SIZE,
    files: 5,
  },
  fileFilter: createFileFilter(ALLOWED_ALL_TYPES),
}).array('attachments', 5);

/**
 * Wrap multer middleware with error handling
 */
const handleUpload = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        logger.error('Multer error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ error: 'Too many files' });
        }
        return res.status(400).json({ error: err.message });
      } else if (err) {
        logger.error('Upload error:', err);
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  };
};

module.exports = {
  uploadAvatar: handleUpload(uploadAvatar),
  uploadDocument: handleUpload(uploadDocument),
  uploadMultiple: handleUpload(uploadMultiple),
  uploadAttachment: handleUpload(uploadAttachment),
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_ALL_TYPES,
};
