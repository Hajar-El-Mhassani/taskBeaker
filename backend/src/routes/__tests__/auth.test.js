const fc = require('fast-check');
const request = require('supertest');
const express = require('express');
const authRoutes = require('../auth');
const cognitoService = require('../../services/cognitoService');
const dynamoService = require('../../services/dynamoService');
const s3Service = require('../../services/s3Service');

jest.mock('../../services/cognitoService');
jest.mock('../../services/dynamoService');
jest.mock('../../services/s3Service');

describe('Auth Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Feature: taskbreaker, Property 4: Signup returns all tokens
   * Validates: Requirements 1.5
   */
  describe('Property 4: Signup returns all tokens', () => {
    it('should return accessToken, idToken, and refreshToken for any successful signup', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc
            .string({ minLength: 8, maxLength: 20 })
            .filter(
              (pwd) =>
                /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd)
            ),
          async (email, password) => {
            // Arrange
            const mockUserId = `user-${Date.now()}`;
            const mockTokens = {
              accessToken: 'mock-access-token',
              idToken: 'mock-id-token',
              refreshToken: 'mock-refresh-token',
            };

            cognitoService.signUp.mockResolvedValue({
              userId: mockUserId,
              email,
            });

            dynamoService.createUser.mockResolvedValue({
              userId: mockUserId,
              email,
              name: email.split('@')[0],
              avatarUrl: null,
              preferences: {
                maxHoursPerDay: 8,
                workDays: [
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                ],
              },
            });

            cognitoService.login.mockResolvedValue(mockTokens);

            // Act
            const response = await request(app)
              .post('/auth/signup')
              .send({ email, password });

            // Assert
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('accessToken');
            expect(response.body.data).toHaveProperty('idToken');
            expect(response.body.data).toHaveProperty('refreshToken');
            expect(response.body.data.accessToken).toBeTruthy();
            expect(response.body.data.idToken).toBeTruthy();
            expect(response.body.data.refreshToken).toBeTruthy();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Feature: taskbreaker, Property 5: Valid login returns tokens
   * Validates: Requirements 2.1, 2.3
   */
  describe('Property 5: Valid login returns tokens', () => {
    it('should return all tokens for any valid login', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 20 }),
          async (email, password) => {
            // Arrange
            const mockUserId = 'user-123';
            const mockTokens = {
              accessToken: 'mock-access-token',
              idToken: 'mock-id-token',
              refreshToken: 'mock-refresh-token',
            };

            cognitoService.login.mockResolvedValue(mockTokens);
            cognitoService.verifyToken.mockResolvedValue({
              sub: mockUserId,
              email,
            });
            dynamoService.getUser.mockResolvedValue({
              userId: mockUserId,
              email,
              name: 'Test User',
              avatarUrl: null,
              preferences: {
                maxHoursPerDay: 8,
                workDays: [
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                ],
              },
            });

            // Act
            const response = await request(app)
              .post('/auth/login')
              .send({ email, password });

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('accessToken');
            expect(response.body.data).toHaveProperty('idToken');
            expect(response.body.data).toHaveProperty('refreshToken');
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Feature: taskbreaker, Property 11: Profile retrieval returns complete data
   * Validates: Requirements 14.2, 14.3
   */
  describe('Property 11: Profile retrieval returns complete data', () => {
    it('should return complete user data including email, name, avatarUrl, and preferences', async () => {
      // Arrange
      const mockUserId = 'user-123';
      const mockToken = 'valid.jwt.token';
      const mockUser = {
        userId: mockUserId,
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.png',
        preferences: {
          maxHoursPerDay: 8,
          workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      cognitoService.verifyToken.mockResolvedValue({
        sub: mockUserId,
        email: mockUser.email,
      });
      dynamoService.getUser.mockResolvedValue(mockUser);

      // Act
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${mockToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('avatarUrl');
      expect(response.body.data).toHaveProperty('preferences');
      expect(response.body.data.preferences).toHaveProperty('maxHoursPerDay');
      expect(response.body.data.preferences).toHaveProperty('workDays');
    });
  });

  describe('POST /auth/signup', () => {
    it('should create a new user account', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'Password123';
      const mockUserId = 'user-123';

      cognitoService.signUp.mockResolvedValue({
        userId: mockUserId,
        email,
      });

      dynamoService.createUser.mockResolvedValue({
        userId: mockUserId,
        email,
        name: 'test',
        avatarUrl: null,
        preferences: {
          maxHoursPerDay: 8,
          workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        },
      });

      cognitoService.login.mockResolvedValue({
        accessToken: 'access',
        idToken: 'id',
        refreshToken: 'refresh',
      });

      // Act
      const response = await request(app)
        .post('/auth/signup')
        .send({ email, password });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(email);
    });

    it('should reject signup with missing email', async () => {
      // Act
      const response = await request(app)
        .post('/auth/signup')
        .send({ password: 'Password123' });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject signup with invalid email format', async () => {
      // Act
      const response = await request(app)
        .post('/auth/signup')
        .send({ email: 'invalid-email', password: 'Password123' });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject signup with short password', async () => {
      // Act
      const response = await request(app)
        .post('/auth/signup')
        .send({ email: 'test@example.com', password: 'short' });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle duplicate email error', async () => {
      // Arrange
      const error = new Error('Email already exists');
      error.code = 'EMAIL_EXISTS';
      cognitoService.signUp.mockRejectedValue(error);

      // Act
      const response = await request(app)
        .post('/auth/signup')
        .send({ email: 'existing@example.com', password: 'Password123' });

      // Assert
      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/login', () => {
    it('should authenticate user with valid credentials', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'Password123';
      const mockUserId = 'user-123';

      cognitoService.login.mockResolvedValue({
        accessToken: 'access',
        idToken: 'id',
        refreshToken: 'refresh',
      });

      cognitoService.verifyToken.mockResolvedValue({
        sub: mockUserId,
        email,
      });

      dynamoService.getUser.mockResolvedValue({
        userId: mockUserId,
        email,
        name: 'Test User',
        avatarUrl: null,
        preferences: {
          maxHoursPerDay: 8,
          workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        },
      });

      // Act
      const response = await request(app)
        .post('/auth/login')
        .send({ email, password });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(email);
    });

    it('should reject login with invalid credentials', async () => {
      // Arrange
      const error = new Error('Invalid email or password');
      error.code = 'INVALID_CREDENTIALS';
      cognitoService.login.mockRejectedValue(error);

      // Act
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'WrongPassword' });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /auth/me', () => {
    it('should return user profile for authenticated user', async () => {
      // Arrange
      const mockUserId = 'user-123';
      const mockToken = 'valid.jwt.token';

      cognitoService.verifyToken.mockResolvedValue({
        sub: mockUserId,
        email: 'test@example.com',
      });

      dynamoService.getUser.mockResolvedValue({
        userId: mockUserId,
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: null,
        preferences: {
          maxHoursPerDay: 8,
          workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });

      // Act
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${mockToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(mockUserId);
    });

    it('should reject request without token', async () => {
      // Act
      const response = await request(app).get('/auth/me');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /auth/profile', () => {
    it('should update user profile', async () => {
      // Arrange
      const mockUserId = 'user-123';
      const mockToken = 'valid.jwt.token';
      const updates = {
        name: 'Updated Name',
        preferences: {
          maxHoursPerDay: 6,
          workDays: ['Monday', 'Wednesday', 'Friday'],
        },
      };

      cognitoService.verifyToken.mockResolvedValue({
        sub: mockUserId,
        email: 'test@example.com',
      });

      dynamoService.updateUser.mockResolvedValue({
        userId: mockUserId,
        email: 'test@example.com',
        name: updates.name,
        avatarUrl: null,
        preferences: updates.preferences,
        updatedAt: new Date().toISOString(),
      });

      // Act
      const response = await request(app)
        .patch('/auth/profile')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(updates);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updates.name);
    });

    it('should reject invalid maxHoursPerDay', async () => {
      // Arrange
      const mockToken = 'valid.jwt.token';

      cognitoService.verifyToken.mockResolvedValue({
        sub: 'user-123',
        email: 'test@example.com',
      });

      // Act
      const response = await request(app)
        .patch('/auth/profile')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          preferences: {
            maxHoursPerDay: -5,
          },
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
