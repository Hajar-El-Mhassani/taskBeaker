const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const dynamoService = require('../services/dynamoService');
const aiService = require('../services/aiService');
const authMiddleware = require('../middleware/authMiddleware');
const {
  success,
  validationError,
  serverError,
  notFound,
  forbidden,
} = require('../utils/response');

// All task routes require authentication
router.use(authMiddleware);

/**
 * POST /tasks/generate
 * Create a new task plan with AI generation
 */
router.post('/generate', async (req, res) => {
  try {
    const { taskName, timeMode, amount } = req.body;

    // Validate input
    if (!taskName || typeof taskName !== 'string' || taskName.trim().length === 0) {
      return validationError(res, 'taskName is required and must be a non-empty string');
    }

    if (!timeMode || !['days', 'hours'].includes(timeMode)) {
      return validationError(res, 'timeMode must be either "days" or "hours"');
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return validationError(res, 'amount must be a positive number');
    }

    // Get user preferences
    const user = await dynamoService.getUser(req.user.userId);

    // Generate task plan using AI service
    const aiPlan = await aiService.generatePlan(
      taskName.trim(),
      timeMode,
      amount,
      user.preferences
    );

    // Create task plan object
    const taskPlan = {
      taskId: uuidv4(),
      taskName: taskName.trim(),
      timeMode,
      amount,
      subtasks: aiPlan.subtasks,
      schedule: aiPlan.schedule,
      totalEstimatedTime: aiPlan.totalEstimatedTime,
      notes: aiPlan.notes,
    };

    // Save to DynamoDB
    const savedPlan = await dynamoService.createTaskPlan(req.user.userId, taskPlan);

    return success(res, savedPlan, 201);
  } catch (error) {
    console.error('Generate task error:', error);
    return serverError(res, 'Failed to generate task plan', error.message);
  }
});

/**
 * GET /tasks
 * List all task plans for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const taskPlans = await dynamoService.getTaskPlans(req.user.userId);

    return success(res, {
      tasks: taskPlans,
      count: taskPlans.length,
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    return serverError(res, 'Failed to retrieve task plans', error.message);
  }
});

/**
 * GET /tasks/:taskId
 * Get a specific task plan
 */
router.get('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;

    const taskPlan = await dynamoService.getTaskPlan(req.user.userId, taskId);

    // Verify ownership (should already be enforced by getTaskPlan, but double-check)
    if (taskPlan.userId !== req.user.userId) {
      return forbidden(res, "You don't have permission to access this task plan");
    }

    return success(res, taskPlan);
  } catch (error) {
    if (error.code === 'TASK_NOT_FOUND') {
      return notFound(res, 'Task plan not found');
    }
    console.error('Get task error:', error);
    return serverError(res, 'Failed to retrieve task plan', error.message);
  }
});

/**
 * PATCH /tasks/:taskId/subtasks/:subId
 * Update a subtask's status
 */
router.patch('/:taskId/subtasks/:subId', async (req, res) => {
  try {
    const { taskId, subId } = req.params;
    const { done } = req.body;

    // Validate input
    if (typeof done !== 'boolean') {
      return validationError(res, 'done must be a boolean value');
    }

    // Verify task ownership first
    const taskPlan = await dynamoService.getTaskPlan(req.user.userId, taskId);

    if (taskPlan.userId !== req.user.userId) {
      return forbidden(res, "You don't have permission to modify this task plan");
    }

    // Update the subtask
    const updatedPlan = await dynamoService.updateSubtask(
      req.user.userId,
      taskId,
      subId,
      { done }
    );

    return success(res, updatedPlan);
  } catch (error) {
    if (error.code === 'TASK_NOT_FOUND') {
      return notFound(res, 'Task plan not found');
    }
    if (error.code === 'SUBTASK_NOT_FOUND') {
      return notFound(res, 'Subtask not found');
    }
    console.error('Update subtask error:', error);
    return serverError(res, 'Failed to update subtask', error.message);
  }
});

/**
 * DELETE /tasks/:taskId
 * Delete a task plan
 */
router.delete('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;

    // Verify task ownership first
    const taskPlan = await dynamoService.getTaskPlan(req.user.userId, taskId);

    if (taskPlan.userId !== req.user.userId) {
      return forbidden(res, "You don't have permission to delete this task plan");
    }

    // Delete the task plan
    await dynamoService.deleteTaskPlan(req.user.userId, taskId);

    return success(res, {
      message: 'Task plan deleted successfully',
      taskId,
    });
  } catch (error) {
    if (error.code === 'TASK_NOT_FOUND') {
      return notFound(res, 'Task plan not found');
    }
    console.error('Delete task error:', error);
    return serverError(res, 'Failed to delete task plan', error.message);
  }
});

module.exports = router;
