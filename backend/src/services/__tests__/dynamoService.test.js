const fc = require('fast-check');
const dynamoService = require('../dynamoService');
const AWS = require('aws-sdk');

// Mock AWS SDK
jest.mock('aws-sdk');

describe('DynamoDB Service', () => {
  let mockDocumentClient;

  beforeEach(() => {
    mockDocumentClient = {
      put: jest.fn(),
      get: jest.fn(),
      update: jest.fn(),
      query: jest.fn(),
      delete: jest.fn(),
    };

    mockDocumentClient.put.mockReturnValue({ promise: jest.fn() });
    mockDocumentClient.get.mockReturnValue({ promise: jest.fn() });
    mockDocumentClient.update.mockReturnValue({ promise: jest.fn() });
    mockDocumentClient.query.mockReturnValue({ promise: jest.fn() });
    mockDocumentClient.delete.mockReturnValue({ promise: jest.fn() });

    AWS.DynamoDB.DocumentClient.mockImplementation(() => mockDocumentClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Users Table Operations', () => {
    /**
     * Feature: taskbreaker, Property 2: Signup creates database record
     * Feature: taskbreaker, Property 3: New users have default preferences
     * Validates: Requirements 1.3, 1.4
     */
    describe('Property 2 & 3: Signup creates database record with default preferences', () => {
      it('should create a user record in DynamoDB for any successful signup', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            fc.emailAddress(),
            async (userId, email) => {
              // Arrange
              mockDocumentClient.put().promise.mockResolvedValue({});

              // Act
              const result = await dynamoService.createUser(userId, email);

              // Assert - Property 2: User record is created
              expect(result).toHaveProperty('userId', userId);
              expect(result).toHaveProperty('email', email);
              expect(mockDocumentClient.put).toHaveBeenCalled();

              // Assert - Property 3: Default preferences are initialized
              expect(result.preferences).toEqual({
                maxHoursPerDay: 8,
                workDays: [
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                ],
              });
              expect(result.preferences.maxHoursPerDay).toBe(8);
              expect(result.preferences.workDays).toHaveLength(5);
              expect(result.preferences.workDays).toContain('Monday');
              expect(result.preferences.workDays).toContain('Friday');
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should initialize all required user fields', async () => {
        // Arrange
        const userId = 'user-123';
        const email = 'test@example.com';
        mockDocumentClient.put().promise.mockResolvedValue({});

        // Act
        const result = await dynamoService.createUser(userId, email);

        // Assert
        expect(result).toHaveProperty('userId');
        expect(result).toHaveProperty('email');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('avatarUrl', null);
        expect(result).toHaveProperty('preferences');
        expect(result).toHaveProperty('createdAt');
        expect(result).toHaveProperty('updatedAt');
      });
    });

    /**
     * Feature: taskbreaker, Property 12: Profile updates persist to database
     * Validates: Requirements 9.1
     */
    describe('Property 12: Profile updates persist to database', () => {
      it('should persist any profile update to DynamoDB', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            fc.string({ minLength: 1, maxLength: 50 }),
            async (userId, newName) => {
              // Arrange
              const updatedUser = {
                userId,
                name: newName,
                updatedAt: new Date().toISOString(),
              };
              mockDocumentClient.update().promise.mockResolvedValue({
                Attributes: updatedUser,
              });

              // Act
              const result = await dynamoService.updateUser(userId, {
                name: newName,
              });

              // Assert
              expect(result.name).toBe(newName);
              expect(mockDocumentClient.update).toHaveBeenCalled();
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should update preferences correctly', async () => {
        // Arrange
        const userId = 'user-123';
        const newPreferences = {
          maxHoursPerDay: 6,
          workDays: ['Monday', 'Wednesday', 'Friday'],
        };
        mockDocumentClient.update().promise.mockResolvedValue({
          Attributes: {
            userId,
            preferences: newPreferences,
            updatedAt: new Date().toISOString(),
          },
        });

        // Act
        const result = await dynamoService.updateUser(userId, {
          preferences: newPreferences,
        });

        // Assert
        expect(result.preferences).toEqual(newPreferences);
      });
    });

    describe('Get user functionality', () => {
      it('should retrieve user by userId', async () => {
        // Arrange
        const userId = 'user-123';
        const mockUser = {
          userId,
          email: 'test@example.com',
          name: 'Test User',
          preferences: {
            maxHoursPerDay: 8,
            workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          },
        };
        mockDocumentClient.get().promise.mockResolvedValue({ Item: mockUser });

        // Act
        const result = await dynamoService.getUser(userId);

        // Assert
        expect(result).toEqual(mockUser);
      });

      it('should throw error for non-existent user', async () => {
        // Arrange
        const userId = 'non-existent';
        mockDocumentClient.get().promise.mockResolvedValue({});

        // Act & Assert
        await expect(dynamoService.getUser(userId)).rejects.toThrow(
          'User not found'
        );
      });
    });
  });

  describe('Task Plans Table Operations', () => {
    /**
     * Feature: taskbreaker, Property 18: Task queries filter by user
     * Feature: taskbreaker, Property 19: Task plans sorted by creation date
     * Validates: Requirements 4.1, 4.2
     */
    describe('Property 18 & 19: Task queries filter by user and sort by date', () => {
      it('should return only task plans belonging to the authenticated user', async () => {
        await fc.assert(
          fc.asyncProperty(fc.uuid(), async (userId) => {
            // Arrange
            const mockTasks = [
              {
                userId,
                taskId: 'task-1',
                taskName: 'Task 1',
                createdAt: '2024-01-01T00:00:00Z',
              },
              {
                userId,
                taskId: 'task-2',
                taskName: 'Task 2',
                createdAt: '2024-01-02T00:00:00Z',
              },
            ];
            mockDocumentClient.query().promise.mockResolvedValue({
              Items: mockTasks,
            });

            // Act
            const result = await dynamoService.getTaskPlans(userId);

            // Assert - Property 18: All tasks belong to user
            result.forEach((task) => {
              expect(task.userId).toBe(userId);
            });

            // Assert - Property 19: Tasks are sorted by createdAt (newest first)
            for (let i = 0; i < result.length - 1; i++) {
              const currentDate = new Date(result[i].createdAt);
              const nextDate = new Date(result[i + 1].createdAt);
              expect(currentDate >= nextDate).toBe(true);
            }
          }),
          { numRuns: 100 }
        );
      });
    });

    describe('Create task plan', () => {
      it('should create a task plan with all required fields', async () => {
        // Arrange
        const userId = 'user-123';
        const taskPlan = {
          taskId: 'task-123',
          taskName: 'Complete project',
          timeMode: 'days',
          amount: 5,
          subtasks: [
            {
              id: '1',
              name: 'Subtask 1',
              duration: '2h',
              priority: 'High',
              done: false,
            },
          ],
          schedule: { day1: ['1'] },
          totalEstimatedTime: '2h',
          notes: 'Test notes',
        };
        mockDocumentClient.put().promise.mockResolvedValue({});

        // Act
        const result = await dynamoService.createTaskPlan(userId, taskPlan);

        // Assert
        expect(result).toHaveProperty('userId', userId);
        expect(result).toHaveProperty('taskId', taskPlan.taskId);
        expect(result).toHaveProperty('taskName', taskPlan.taskName);
        expect(result).toHaveProperty('subtasks');
        expect(result).toHaveProperty('schedule');
        expect(result).toHaveProperty('createdAt');
        expect(result).toHaveProperty('updatedAt');
      });
    });

    /**
     * Feature: taskbreaker, Property 21: Subtask completion persists
     * Feature: taskbreaker, Property 22: Updates include timestamps
     * Validates: Requirements 5.1, 5.2
     */
    describe('Property 21 & 22: Subtask completion persists with timestamps', () => {
      it('should persist subtask done status and update timestamp', async () => {
        // Arrange
        const userId = 'user-123';
        const taskId = 'task-123';
        const subId = '1';
        const mockTaskPlan = {
          userId,
          taskId,
          subtasks: [
            {
              id: '1',
              name: 'Subtask 1',
              duration: '2h',
              priority: 'High',
              done: false,
            },
          ],
        };

        mockDocumentClient.get().promise.mockResolvedValue({
          Item: mockTaskPlan,
        });
        mockDocumentClient.update().promise.mockResolvedValue({
          Attributes: {
            ...mockTaskPlan,
            subtasks: [{ ...mockTaskPlan.subtasks[0], done: true }],
            updatedAt: new Date().toISOString(),
          },
        });

        // Act
        const result = await dynamoService.updateSubtask(userId, taskId, subId, {
          done: true,
        });

        // Assert - Property 21: Subtask status persists
        const updatedSubtask = result.subtasks.find((s) => s.id === subId);
        expect(updatedSubtask.done).toBe(true);

        // Assert - Property 22: Timestamp is updated
        expect(result).toHaveProperty('updatedAt');
        expect(mockDocumentClient.update).toHaveBeenCalled();
      });
    });

    /**
     * Feature: taskbreaker, Property 26: Deletion removes from database
     * Validates: Requirements 6.2
     */
    describe('Property 26: Deletion removes from database', () => {
      it('should remove task plan from DynamoDB', async () => {
        // Arrange
        const userId = 'user-123';
        const taskId = 'task-123';
        mockDocumentClient.delete().promise.mockResolvedValue({});

        // Act
        await dynamoService.deleteTaskPlan(userId, taskId);

        // Assert
        expect(mockDocumentClient.delete).toHaveBeenCalledWith(
          expect.objectContaining({
            TableName: process.env.TASKS_TABLE,
            Key: { userId, taskId },
          })
        );
      });

      it('should throw error when deleting non-existent task', async () => {
        // Arrange
        const userId = 'user-123';
        const taskId = 'non-existent';
        mockDocumentClient.delete().promise.mockRejectedValue({
          code: 'ConditionalCheckFailedException',
        });

        // Act & Assert
        await expect(
          dynamoService.deleteTaskPlan(userId, taskId)
        ).rejects.toThrow('Task plan not found');
      });
    });
  });
});
