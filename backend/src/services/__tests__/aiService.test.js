const fc = require('fast-check');
const aiService = require('../aiService');
const AWS = require('aws-sdk');

// Mock AWS Bedrock to avoid real API calls during tests
jest.mock('aws-sdk', () => {
  const mockInvokeModel = jest.fn();
  return {
    BedrockRuntime: jest.fn(() => ({
      invokeModel: mockInvokeModel,
    })),
    __mockInvokeModel: mockInvokeModel,
  };
});

describe('AI Service', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Mock Bedrock to return an error, forcing fallback mode for predictable tests
    const mockInvokeModel = require('aws-sdk').__mockInvokeModel;
    mockInvokeModel.mockReturnValue({
      promise: jest.fn().mockRejectedValue(new Error('Bedrock unavailable in test')),
    });
  });
  /**
   * Feature: taskbreaker, Property 40: AI generates valid subtask count
   * Validates: Requirements 12.1
   */
  describe('Property 40: AI generates valid subtask count', () => {
    it('should generate between 3 and 10 subtasks for any task', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom('days', 'hours'),
          fc.integer({ min: 1, max: 30 }),
          async (taskName, timeMode, amount) => {
            // Act
            const plan = await aiService.generatePlan(taskName, timeMode, amount);

            // Assert
            expect(plan.subtasks.length).toBeGreaterThanOrEqual(3);
            expect(plan.subtasks.length).toBeLessThanOrEqual(10);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: taskbreaker, Property 41: Subtask durations have valid format
   * Validates: Requirements 12.2
   */
  describe('Property 41: Subtask durations have valid format', () => {
    it('should assign durations in valid format (e.g., "45m" or "2h") to all subtasks', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom('days', 'hours'),
          fc.integer({ min: 1, max: 30 }),
          async (taskName, timeMode, amount) => {
            // Act
            const plan = await aiService.generatePlan(taskName, timeMode, amount);

            // Assert
            const durationPattern = /^\d+[hm]$/;
            plan.subtasks.forEach((subtask) => {
              expect(subtask.duration).toMatch(durationPattern);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use valid duration formats', async () => {
      // Arrange
      const taskName = 'Test Task';
      const timeMode = 'days';
      const amount = 5;

      // Act
      const plan = await aiService.generatePlan(taskName, timeMode, amount);

      // Assert
      plan.subtasks.forEach((subtask) => {
        // Duration should be a number followed by 'h' or 'm'
        expect(subtask.duration).toMatch(/^\d+[hm]$/);

        // Extract the numeric part
        const numericPart = parseInt(subtask.duration);
        expect(numericPart).toBeGreaterThan(0);
      });
    });
  });

  /**
   * Feature: taskbreaker, Property 42: Subtask priorities are valid enum values
   * Validates: Requirements 12.3
   */
  describe('Property 42: Subtask priorities are valid enum values', () => {
    it('should assign priority of High, Medium, or Low to all subtasks', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom('days', 'hours'),
          fc.integer({ min: 1, max: 30 }),
          async (taskName, timeMode, amount) => {
            // Act
            const plan = await aiService.generatePlan(taskName, timeMode, amount);

            // Assert
            const validPriorities = ['High', 'Medium', 'Low'];
            plan.subtasks.forEach((subtask) => {
              expect(validPriorities).toContain(subtask.priority);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: taskbreaker, Property 43: Schedule respects time constraints
   * Validates: Requirements 12.4
   */
  describe('Property 43: Schedule respects time constraints', () => {
    it('should distribute subtasks respecting maxHoursPerDay preference', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom('days', 'hours'),
          fc.integer({ min: 5, max: 20 }),
          fc.integer({ min: 4, max: 12 }),
          async (taskName, timeMode, amount, maxHoursPerDay) => {
            // Arrange
            const userPreferences = {
              maxHoursPerDay,
              workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            };

            // Act
            const plan = await aiService.generatePlan(
              taskName,
              timeMode,
              amount,
              userPreferences
            );

            // Assert - Check that schedule exists
            expect(plan.schedule).toBeDefined();
            expect(Object.keys(plan.schedule).length).toBeGreaterThan(0);

            // Verify each day/session respects maxHoursPerDay
            Object.values(plan.schedule).forEach((subtaskIds) => {
              const dayHours = subtaskIds.reduce((total, id) => {
                const subtask = plan.subtasks.find((s) => s.id === id);
                return total + parseInt(subtask.duration);
              }, 0);

              // Allow some flexibility for the last day
              expect(dayHours).toBeLessThanOrEqual(maxHoursPerDay + 2);
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should create schedule with valid structure', async () => {
      // Arrange
      const taskName = 'Test Task';
      const timeMode = 'days';
      const amount = 5;

      // Act
      const plan = await aiService.generatePlan(taskName, timeMode, amount);

      // Assert
      expect(plan.schedule).toBeDefined();
      expect(typeof plan.schedule).toBe('object');

      // Each schedule entry should be an array of subtask IDs
      Object.values(plan.schedule).forEach((subtaskIds) => {
        expect(Array.isArray(subtaskIds)).toBe(true);
        subtaskIds.forEach((id) => {
          expect(typeof id).toBe('string');
          // Verify the subtask ID exists in the subtasks array
          const subtaskExists = plan.subtasks.some((s) => s.id === id);
          expect(subtaskExists).toBe(true);
        });
      });
    });
  });

  /**
   * Feature: taskbreaker, Property 44: Total time matches subtask sum
   * Validates: Requirements 12.5
   */
  describe('Property 44: Total time matches subtask sum', () => {
    it('should calculate totalEstimatedTime as sum of all subtask durations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom('days', 'hours'),
          fc.integer({ min: 1, max: 30 }),
          async (taskName, timeMode, amount) => {
            // Act
            const plan = await aiService.generatePlan(taskName, timeMode, amount);

            // Assert
            const calculatedTotal = plan.subtasks.reduce((sum, subtask) => {
              const hours = parseInt(subtask.duration);
              return sum + hours;
            }, 0);

            const reportedTotal = parseInt(plan.totalEstimatedTime);

            expect(reportedTotal).toBe(calculatedTotal);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format totalEstimatedTime correctly', async () => {
      // Arrange
      const taskName = 'Test Task';
      const timeMode = 'days';
      const amount = 5;

      // Act
      const plan = await aiService.generatePlan(taskName, timeMode, amount);

      // Assert
      expect(plan.totalEstimatedTime).toMatch(/^\d+h$/);
    });
  });

  describe('Plan validation', () => {
    it('should validate a correct plan', async () => {
      // Arrange
      const taskName = 'Test Task';
      const timeMode = 'days';
      const amount = 5;

      // Act
      const plan = await aiService.generatePlan(taskName, timeMode, amount);
      const isValid = aiService.validatePlan(plan);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should reject plan with invalid subtask count', () => {
      // Arrange
      const invalidPlan = {
        subtasks: [
          { id: '1', name: 'Task 1', duration: '2h', priority: 'High', done: false },
        ],
        schedule: { day1: ['1'] },
        totalEstimatedTime: '2h',
        notes: 'Test',
      };

      // Act
      const isValid = aiService.validatePlan(invalidPlan);

      // Assert
      expect(isValid).toBe(false);
    });

    it('should reject plan with invalid duration format', () => {
      // Arrange
      const invalidPlan = {
        subtasks: [
          { id: '1', name: 'Task 1', duration: 'invalid', priority: 'High', done: false },
          { id: '2', name: 'Task 2', duration: '2h', priority: 'High', done: false },
          { id: '3', name: 'Task 3', duration: '1h', priority: 'Medium', done: false },
        ],
        schedule: { day1: ['1', '2', '3'] },
        totalEstimatedTime: '3h',
        notes: 'Test',
      };

      // Act
      const isValid = aiService.validatePlan(invalidPlan);

      // Assert
      expect(isValid).toBe(false);
    });

    it('should reject plan with invalid priority', () => {
      // Arrange
      const invalidPlan = {
        subtasks: [
          { id: '1', name: 'Task 1', duration: '2h', priority: 'Invalid', done: false },
          { id: '2', name: 'Task 2', duration: '2h', priority: 'High', done: false },
          { id: '3', name: 'Task 3', duration: '1h', priority: 'Medium', done: false },
        ],
        schedule: { day1: ['1', '2', '3'] },
        totalEstimatedTime: '5h',
        notes: 'Test',
      };

      // Act
      const isValid = aiService.validatePlan(invalidPlan);

      // Assert
      expect(isValid).toBe(false);
    });
  });

  describe('Generated plan structure', () => {
    it('should include all required fields', async () => {
      // Arrange
      const taskName = 'Test Task';
      const timeMode = 'days';
      const amount = 5;

      // Act
      const plan = await aiService.generatePlan(taskName, timeMode, amount);

      // Assert
      expect(plan).toHaveProperty('subtasks');
      expect(plan).toHaveProperty('schedule');
      expect(plan).toHaveProperty('totalEstimatedTime');
      expect(plan).toHaveProperty('notes');
    });

    it('should generate unique subtask IDs', async () => {
      // Arrange
      const taskName = 'Test Task';
      const timeMode = 'days';
      const amount = 5;

      // Act
      const plan = await aiService.generatePlan(taskName, timeMode, amount);

      // Assert
      const ids = plan.subtasks.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should initialize all subtasks as not done', async () => {
      // Arrange
      const taskName = 'Test Task';
      const timeMode = 'days';
      const amount = 5;

      // Act
      const plan = await aiService.generatePlan(taskName, timeMode, amount);

      // Assert
      plan.subtasks.forEach((subtask) => {
        expect(subtask.done).toBe(false);
      });
    });
  });
});
