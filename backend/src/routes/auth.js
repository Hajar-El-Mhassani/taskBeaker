const express = require('express');
const router = express.Router();
const cognitoService = require('../services/cognitoService');
const dynamoService = require('../services/dynamoService');
const authMiddleware = require('../middleware/authMiddleware');
const {
  success,
  validationError,
  serverError,
  conflict,
  notFound,
} = require('../utils/response');

/**
 * POST /auth/signup
 * Register a new user
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password) {
      return validationError(res, 'Email and password are required');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return validationError(res, 'Invalid email format');
    }

    // Password validation
    if (password.length < 8) {
      return validationError(res, 'Password must be at least 8 characters long');
    }

    // Sign up with Cognito
    const cognitoResult = await cognitoService.signUp(email, password);

    // Create user record in DynamoDB
    const user = await dynamoService.createUser(
      cognitoResult.userId,
      email,
      name
    );

    // Log in the user to get tokens
    const tokens = await cognitoService.login(email, password);

    return success(
      res,
      {
        user: {
          userId: user.userId,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          preferences: user.preferences,
        },
        ...tokens,
      },
      201
    );
  } catch (error) {
    if (error.code === 'EMAIL_EXISTS') {
      return conflict(res, error.message);
    }
    if (error.code === 'INVALID_PASSWORD') {
      return validationError(res, error.message);
    }
    console.error('Signup error:', error);
    return serverError(res, 'Failed to create account', error.message);
  }
});

/**
 * POST /auth/login
 * Authenticate a user
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return validationError(res, 'Email and password are required');
    }

    // Authenticate with Cognito
    const tokens = await cognitoService.login(email, password);

    // Get user data from DynamoDB
    // First, we need to get the userId from the token
    const decoded = await cognitoService.verifyToken(tokens.idToken);
    const user = await dynamoService.getUser(decoded.sub);

    return success(res, {
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        preferences: user.preferences,
      },
      ...tokens,
    });
  } catch (error) {
    if (error.code === 'INVALID_CREDENTIALS') {
      return validationError(res, error.message, null);
    }
    if (error.code === 'USER_NOT_FOUND') {
      return validationError(res, 'Invalid email or password', null);
    }
    console.error('Login error:', error);
    return serverError(res, 'Failed to authenticate', error.message);
  }
});

/**
 * GET /auth/me
 * Get current user profile (protected)
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await dynamoService.getUser(req.user.userId);

    return success(res, {
      userId: user.userId,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      preferences: user.preferences,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    if (error.code === 'USER_NOT_FOUND') {
      return notFound(res, 'User not found');
    }
    console.error('Get user error:', error);
    return serverError(res, 'Failed to retrieve user data', error.message);
  }
});

/**
 * PATCH /auth/profile
 * Update user profile (protected)
 */
router.patch('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, preferences } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return validationError(res, 'Name must be a non-empty string');
      }
      updates.name = name.trim();
    }

    if (preferences !== undefined) {
      // Validate preferences
      if (typeof preferences !== 'object') {
        return validationError(res, 'Preferences must be an object');
      }

      if (preferences.maxHoursPerDay !== undefined) {
        const maxHours = Number(preferences.maxHoursPerDay);
        if (isNaN(maxHours) || maxHours <= 0) {
          return validationError(
            res,
            'maxHoursPerDay must be a positive number'
          );
        }
        preferences.maxHoursPerDay = maxHours;
      }

      if (preferences.workDays !== undefined) {
        if (!Array.isArray(preferences.workDays)) {
          return validationError(res, 'workDays must be an array');
        }

        const validDays = [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ];
        const invalidDays = preferences.workDays.filter(
          (day) => !validDays.includes(day)
        );

        if (invalidDays.length > 0) {
          return validationError(
            res,
            `Invalid work days: ${invalidDays.join(', ')}`
          );
        }
      }

      updates.preferences = preferences;
    }

    if (Object.keys(updates).length === 0) {
      return validationError(res, 'No valid updates provided');
    }

    const updatedUser = await dynamoService.updateUser(req.user.userId, updates);

    return success(res, {
      userId: updatedUser.userId,
      email: updatedUser.email,
      name: updatedUser.name,
      avatarUrl: updatedUser.avatarUrl,
      preferences: updatedUser.preferences,
      updatedAt: updatedUser.updatedAt,
    });
  } catch (error) {
    if (error.code === 'USER_NOT_FOUND') {
      return notFound(res, 'User not found');
    }
    console.error('Update profile error:', error);
    return serverError(res, 'Failed to update profile', error.message);
  }
});

/**
 * POST /auth/avatar
 * Upload user avatar (protected)
 * Note: This route expects multipart/form-data with a file field named 'avatar'
 */
const multer = require('multer');
const s3Service = require('../services/s3Service');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'));
    }
  },
});

router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return validationError(res, 'No file uploaded');
    }

    // Upload to S3
    const result = await s3Service.uploadAvatar(
      req.user.userId,
      req.file.buffer,
      req.file.mimetype
    );

    // Update user record with avatar URL
    const updatedUser = await dynamoService.updateUser(req.user.userId, {
      avatarUrl: result.url,
    });

    return success(res, {
      avatarUrl: updatedUser.avatarUrl,
      message: 'Avatar uploaded successfully',
    });
  } catch (error) {
    if (error.message && error.message.includes('Only image files')) {
      return validationError(res, error.message);
    }
    if (error.code === 'LIMIT_FILE_SIZE') {
      return validationError(res, 'File size must be less than 5MB');
    }
    console.error('Avatar upload error:', error);
    return serverError(res, 'Failed to upload avatar', error.message);
  }
});

module.exports = router;
