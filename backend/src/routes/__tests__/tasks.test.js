const fc = require('fast-check');
const request = require('supertest');
const express = require('express');
const tasksRoutes = require('../tasks');
const cognitoService = require('../../services/cognitoService');
const dynamoService = require('../../services/dynamoService');
const aiService = require('../../services/aiService');

jest.mock('../../services/cognitoService');
jest.mock('../../services/dynamoService');
jest.mock('../../services/aiService');

describe('Tasks Routes', () => {
  let app;
  const mockToken = 'valid.jwt.token';
  const mockUserId = 'user-123';

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/tasks', tasksRoutes);

    // Mock auth middleware
    cognitoService.verifyToken.mockResolvedValue({
      sub: mockUserId,
      email: 'test@example.com',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Feature: taskbreaker, Property 13-17: Task creation properties
   * Validates: Requirements 3.1-3.5
   */
  describe('POST /tasks/generate', () => {
    it('should validate input and create task plan', async () => {
      // Arrange
      const mockUser = {
        userId: mockUserId,
        preferences: {
          maxHoursPerDay: 8,
          workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        },
      };

      const mockAIPlan = {
        subtasks: [
          { id: '1', name: 'Task 1', duration: '2h', priority: 'High', done: false },
          { id: '2', name: 'Task 2', duration: '3h', priority: 'Medium', done: false },
          { id: '3', name: 'Task 3', duration: '1h', priority: 'Low', done: false },
        ],
        schedule: { day1: ['1', '2'], day2: ['3'] },
        totalEstimatedTime: '6h',
        notes: 'Test notes',
      };

      dynamoService.getUser.mockResolvedValue(mockUser);
      aiService.generatePlan.mockResolvedValue(mockAIPlan);
      dynamoService.createTaskPlan.mockResolvedValue({
        userId: mockUserId,
        taskId: 'task-123',
        taskName: 'Test Task',
        timeMode: 'days',
        amount: 5,
        ...mockAIPlan,
      });

      // Act
      const response = await request(app)
        .post('/tasks/generate')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          taskName: 'Test Task',
          timeMode: 'days',
          amount: 5,
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('taskId');
      expect(response.body.data).toHaveProperty('subtasks');
      expect(response.body.data).toHaveProperty('schedule');
    });

    it('should reject invalid timeMode', async () => {
      // Act
      const response = await request(app)
        .post('/tasks/generate')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          taskName: 'Test Task',
          timeMode: 'invalid',
          amount: 5,
        });

      // Assert
      expect(response.status).toBe(400);
    });
  });

  /**
   * Feature: taskbreaker, Property 18-19: Task queries filter and sort
   * Validates: Requirements 4.1, 4.2
   */
  describe('GET /tasks', () => {
    it('should return all tasks for authenticated user sorted by date', async () => {
      // Arrange
      const mockTasks = [
        {
          userId: mockUserId,
          taskId: 'task-2',
          taskName: 'Task 2',
          createdAt: '2024-01-02T00:00:00Z',
        },
        {
          userId: mockUserId,
          taskId: 'task-1',
          taskName: 'Task 1',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];

      dynamoService.getTaskPlans.mockResolvedValue(mockTasks);

      // Act
      const response = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${mockToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks).toHaveLength(2);
      expect(response.body.data.tasks.every(t => t.userId === mockUserId)).toBe(true);
    });
  });

  /**
   * Feature: taskbreaker, Property 21-22: Subtask updates persist with timestamps
   * Validates: Requirements 5.1, 5.2
   */
  describe('PATCH /tasks/:taskId/subtasks/:subId', () => {
    it('should update subtask status and timestamp', async () => {
      // Arrange
      const taskId = 'task-123';
      const subId = '1';
      const mockTask = {
        userId: mockUserId,
        taskId,
        subtasks: [
          { id: '1', name: 'Task 1', duration: '2h', priority: 'High', done: false },
        ],
      };

      dynamoService.getTaskPlan.mockResolvedValue(mockTask);
      dynamoService.updateSubtask.mockResolvedValue({
        ...mockTask,
        subtasks: [{ ...mockTask.subtasks[0], done: true }],
        updatedAt: new Date().toISOString(),
      });

      // Act
      const response = await request(app)
        .patch(`/tasks/${taskId}/subtasks/${subId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ done: true });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.subtasks[0].done).toBe(true);
      expect(response.body.data).toHaveProperty('updatedAt');
    });
  });

  /**
   * Feature: taskbreaker, Property 25-26: Deletion authorization and removal
   * Validates: Requirements 6.1, 6.2
   */
  describe('DELETE /tasks/:taskId', () => {
    it('should verify ownership and delete task', async () => {
      // Arrange
      const taskId = 'task-123';
      const mockTask = {
        userId: mockUserId,
        taskId,
        taskName: 'Test Task',
      };

      dynamoService.getTaskPlan.mockResolvedValue(mockTask);
      dynamoService.deleteTaskPlan.mockResolvedValue();

      // Act
      const response = await request(app)
        .delete(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${mockToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(dynamoService.deleteTaskPlan).toHaveBeenCalledWith(mockUserId, taskId);
    });

    it('should reject deletion of other users tasks', async () => {
      // Arrange
      const taskId = 'task-123';
      const mockTask = {
        userId: 'other-user',
        taskId,
        taskName: 'Test Task',
      };

      dynamoService.getTaskPlan.mockResolvedValue(mockTask);

      // Act
      const response = await request(app)
        .delete(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${mockToken}`);

      // Assert
      expect(response.status).toBe(403);
    });
  });
});
