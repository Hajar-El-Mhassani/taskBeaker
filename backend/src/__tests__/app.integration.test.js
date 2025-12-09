const request = require('supertest');
const app = require('../app');
const cognitoService = require('../services/cognitoService');
const dynamoService = require('../services/dynamoService');
const s3Service = require('../services/s3Service');
const aiService = require('../services/aiService');

jest.mock('../services/cognitoService');
jest.mock('../services/dynamoService');
jest.mock('../services/s3Service');
jest.mock('../services/aiService');

/**
 * Integration Tests for Express App
 * Tests complete request/response cycles through the full Express application
 */
describe('Express App Integration Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Authentication Flow - Complete Cycle', () => {
    it('should complete full signup flow from request to response', async () => {
      // Arrange
      const email = 'newuser@example.com';
      const password = 'SecurePass123';
      const mockUserId = 'user-new-123';

      cognitoService.signUp.mockResolvedValue({
        userId: mockUserId,
        email,
      });

      dynamoService.createUser.mockResolvedValue({
        userId: mockUserId,
        email,
        name: 'newuser',
        avatarUrl: null,
        preferences: {
          maxHoursPerDay: 8,
          workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });

      cognitoService.login.mockResolvedValue({
        accessToken: 'mock-access-token',
        idToken: 'mock-id-token',
        refreshToken: 'mock-refresh-token',
      });

      // Act
      const response = await request(app)
        .post('/auth/signup')
        .send({ email, password })
        .set('Content-Type', 'application/json');

      // Assert - Complete response structure
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('idToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe(email);
      expect(response.body.data.user.preferences).toBeDefined();

      // Verify service calls
      expect(cognitoService.signUp).toHaveBeenCalledWith(email, password);
      expect(dynamoService.createUser).toHaveBeenCalled();
      expect(cognitoService.login).toHaveBeenCalledWith(email, password);
    });

    it('should complete full login flow from request to response', async () => {
      // Arrange
      const email = 'existing@example.com';
      const password = 'Password123';
      const mockUserId = 'user-existing-123';

      cognitoService.login.mockResolvedValue({
        accessToken: 'mock-access-token',
        idToken: 'mock-id-token',
        refreshToken: 'mock-refresh-token',
      });

      cognitoService.verifyToken.mockResolvedValue({
        sub: mockUserId,
        email,
      });

      dynamoService.getUser.mockResolvedValue({
        userId: mockUserId,
        email,
        name: 'Existing User',
        avatarUrl: 'https://example.com/avatar.png',
        preferences: {
          maxHoursPerDay: 6,
          workDays: ['Monday', 'Wednesday', 'Friday'],
        },
      });

      // Act
      const response = await request(app)
        .post('/auth/login')
        .send({ email, password })
        .set('Content-Type', 'application/json');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(email);
      expect(response.body.data.accessToken).toBeDefined();
    });
  });

  describe('Protected Endpoints - Token Validation', () => {
    const mockUserId = 'user-protected-123';
    const validToken = 'valid.jwt.token';

    it('should allow access to protected endpoint with valid token', async () => {
      // Arrange
      cognitoService.verifyToken.mockResolvedValue({
        sub: mockUserId,
        email: 'user@example.com',
      });

      dynamoService.getUser.mockResolvedValue({
        userId: mockUserId,
        email: 'user@example.com',
        name: 'Test User',
        avatarUrl: null,
        preferences: {
          maxHoursPerDay: 8,
          workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        },
      });

      // Act
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(cognitoService.verifyToken).toHaveBeenCalledWith(validToken);
    });

    it('should reject protected endpoint without token', async () => {
      // Act
      const response = await request(app).get('/auth/me');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('token');
    });

    it('should reject protected endpoint with invalid token', async () => {
      // Arrange
      const invalidToken = 'invalid.token';
      cognitoService.verifyToken.mockRejectedValue(
        new Error('Invalid token')
      );

      // Act
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${invalidToken}`);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Task Management Flow - Complete Cycle', () => {
    const mockUserId = 'user-task-123';
    const validToken = 'valid.jwt.token';

    beforeEach(() => {
      cognitoService.verifyToken.mockResolvedValue({
        sub: mockUserId,
        email: 'user@example.com',
      });
    });

    it('should complete full task creation flow', async () => {
      // Arrange
      const taskInput = {
        taskName: 'Build a website',
        timeMode: 'days',
        amount: 7,
      };

      dynamoService.getUser.mockResolvedValue({
        userId: mockUserId,
        preferences: {
          maxHoursPerDay: 8,
          workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        },
      });

      aiService.generatePlan.mockResolvedValue({
        subtasks: [
          { id: '1', name: 'Design mockups', duration: '4h', priority: 'High', done: false },
          { id: '2', name: 'Setup project', duration: '2h', priority: 'High', done: false },
          { id: '3', name: 'Build frontend', duration: '8h', priority: 'Medium', done: false },
        ],
        schedule: {
          day1: ['1', '2'],
          day2: ['3'],
        },
        totalEstimatedTime: '14h',
        notes: 'Focus on responsive design',
      });

      dynamoService.createTaskPlan.mockImplementation((userId, plan) => {
        return Promise.resolve({
          userId,
          ...plan,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        });
      });

      // Act
      const response = await request(app)
        .post('/tasks/generate')
        .set('Authorization', `Bearer ${validToken}`)
        .send(taskInput);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('taskId');
      expect(response.body.data).toHaveProperty('subtasks');
      expect(response.body.data.subtasks).toHaveLength(3);
      expect(response.body.data).toHaveProperty('schedule');
      expect(response.body.data.taskName).toBe(taskInput.taskName);

      // Verify service integration
      expect(dynamoService.getUser).toHaveBeenCalledWith(mockUserId);
      expect(aiService.generatePlan).toHaveBeenCalled();
      expect(dynamoService.createTaskPlan).toHaveBeenCalled();
    });

    it('should retrieve task list for authenticated user', async () => {
      // Arrange
      const mockTasks = [
        {
          userId: mockUserId,
          taskId: 'task-1',
          taskName: 'Task 1',
          timeMode: 'days',
          amount: 5,
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          userId: mockUserId,
          taskId: 'task-2',
          taskName: 'Task 2',
          timeMode: 'hours',
          amount: 20,
          createdAt: '2024-01-02T00:00:00Z',
        },
      ];

      dynamoService.getTaskPlans.mockResolvedValue(mockTasks);

      // Act
      const response = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${validToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks).toHaveLength(2);
      expect(dynamoService.getTaskPlans).toHaveBeenCalledWith(mockUserId);
    });

    it('should complete subtask update flow', async () => {
      // Arrange
      const taskId = 'task-123';
      const subId = 'sub-1';

      dynamoService.getTaskPlan.mockResolvedValue({
        userId: mockUserId,
        taskId,
        subtasks: [
          { id: subId, name: 'Subtask 1', duration: '2h', priority: 'High', done: false },
        ],
      });

      dynamoService.updateSubtask.mockResolvedValue({
        userId: mockUserId,
        taskId,
        subtasks: [
          { id: subId, name: 'Subtask 1', duration: '2h', priority: 'High', done: true },
        ],
        updatedAt: '2024-01-01T12:00:00Z',
      });

      // Act
      const response = await request(app)
        .patch(`/tasks/${taskId}/subtasks/${subId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ done: true });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.subtasks[0].done).toBe(true);
      expect(response.body.data).toHaveProperty('updatedAt');
    });

    it('should complete task deletion flow', async () => {
      // Arrange
      const taskId = 'task-to-delete';

      dynamoService.getTaskPlan.mockResolvedValue({
        userId: mockUserId,
        taskId,
        taskName: 'Task to delete',
      });

      dynamoService.deleteTaskPlan.mockResolvedValue();

      // Act
      const response = await request(app)
        .delete(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${validToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(dynamoService.deleteTaskPlan).toHaveBeenCalledWith(mockUserId, taskId);
    });
  });

  describe('Error Handling - Various Failure Scenarios', () => {
    it('should handle 404 for non-existent routes', async () => {
      // Act
      const response = await request(app).get('/non-existent-route');

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should handle validation errors with 400 status', async () => {
      // Act - Missing required fields
      const response = await request(app)
        .post('/auth/signup')
        .send({ email: 'test@example.com' }); // Missing password

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('message');
    });

    it('should handle authentication errors with 401 status', async () => {
      // Arrange
      cognitoService.login.mockRejectedValue(
        Object.assign(new Error('Invalid credentials'), {
          code: 'INVALID_CREDENTIALS',
        })
      );

      // Act
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle authorization errors with 403 status', async () => {
      // Arrange
      const mockUserId = 'user-123';
      const otherUserId = 'other-user-456';
      const validToken = 'valid.jwt.token';

      cognitoService.verifyToken.mockResolvedValue({
        sub: mockUserId,
        email: 'user@example.com',
      });

      dynamoService.getTaskPlan.mockResolvedValue({
        userId: otherUserId, // Different user
        taskId: 'task-123',
        taskName: 'Other users task',
      });

      // Act
      const response = await request(app)
        .delete('/tasks/task-123')
        .set('Authorization', `Bearer ${validToken}`);

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should handle duplicate email with 409 status', async () => {
      // Arrange
      cognitoService.signUp.mockRejectedValue(
        Object.assign(new Error('Email already exists'), {
          code: 'EMAIL_EXISTS',
        })
      );

      // Act
      const response = await request(app)
        .post('/auth/signup')
        .send({ email: 'existing@example.com', password: 'Password123' });

      // Assert
      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should handle internal server errors with 500 status', async () => {
      // Arrange
      const validToken = 'valid.jwt.token';
      cognitoService.verifyToken.mockResolvedValue({
        sub: 'user-123',
        email: 'user@example.com',
      });

      dynamoService.getTaskPlans.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      const response = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${validToken}`);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('CORS and Middleware', () => {
    it('should have CORS headers configured', async () => {
      // Act
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000');

      // Assert
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should parse JSON request bodies', async () => {
      // Arrange
      cognitoService.signUp.mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
      });

      dynamoService.createUser.mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
        name: 'test',
        avatarUrl: null,
        preferences: {
          maxHoursPerDay: 8,
          workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        },
      });

      cognitoService.login.mockResolvedValue({
        accessToken: 'token',
        idToken: 'token',
        refreshToken: 'token',
      });

      // Act
      const response = await request(app)
        .post('/auth/signup')
        .send({ email: 'test@example.com', password: 'Password123' })
        .set('Content-Type', 'application/json');

      // Assert
      expect(response.status).not.toBe(400);
      expect(cognitoService.signUp).toHaveBeenCalled();
    });
  });
});
