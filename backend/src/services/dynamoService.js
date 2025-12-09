const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION_CUSTOM || process.env.AWS_REGION,
});

const USERS_TABLE = process.env.USERS_TABLE;
const TASKS_TABLE = process.env.TASKS_TABLE;

// ==================== USERS TABLE OPERATIONS ====================

/**
 * Create a new user in the Users table
 * @param {string} userId - User ID (Cognito sub)
 * @param {string} email - User email
 * @param {string} name - User name (optional, defaults to email)
 * @returns {Promise<Object>} Created user object
 */
async function createUser(userId, email, name = null) {
  const timestamp = new Date().toISOString();

  const user = {
    userId,
    email,
    name: name || email.split('@')[0],
    avatarUrl: null,
    preferences: {
      maxHoursPerDay: 8,
      workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const params = {
    TableName: USERS_TABLE,
    Item: user,
    ConditionExpression: 'attribute_not_exists(userId)',
  };

  try {
    await dynamodb.put(params).promise();
    return user;
  } catch (error) {
    if (error.code === 'ConditionalCheckFailedException') {
      const err = new Error('User already exists');
      err.code = 'USER_EXISTS';
      err.statusCode = 409;
      throw err;
    }
    throw error;
  }
}

/**
 * Get a user by userId
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User object
 */
async function getUser(userId) {
  const params = {
    TableName: USERS_TABLE,
    Key: { userId },
  };

  const result = await dynamodb.get(params).promise();

  if (!result.Item) {
    const err = new Error('User not found');
    err.code = 'USER_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  return result.Item;
}

/**
 * Update user information
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated user object
 */
async function updateUser(userId, updates) {
  const timestamp = new Date().toISOString();

  // Build update expression dynamically
  const updateExpressions = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  // Always update the updatedAt timestamp
  updateExpressions.push('#updatedAt = :updatedAt');
  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  expressionAttributeValues[':updatedAt'] = timestamp;

  // Handle name update
  if (updates.name !== undefined) {
    updateExpressions.push('#name = :name');
    expressionAttributeNames['#name'] = 'name';
    expressionAttributeValues[':name'] = updates.name;
  }

  // Handle avatarUrl update
  if (updates.avatarUrl !== undefined) {
    updateExpressions.push('#avatarUrl = :avatarUrl');
    expressionAttributeNames['#avatarUrl'] = 'avatarUrl';
    expressionAttributeValues[':avatarUrl'] = updates.avatarUrl;
  }

  // Handle preferences update
  if (updates.preferences !== undefined) {
    updateExpressions.push('#preferences = :preferences');
    expressionAttributeNames['#preferences'] = 'preferences';
    expressionAttributeValues[':preferences'] = updates.preferences;
  }

  const params = {
    TableName: USERS_TABLE,
    Key: { userId },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
    ConditionExpression: 'attribute_exists(userId)',
  };

  try {
    const result = await dynamodb.update(params).promise();
    return result.Attributes;
  } catch (error) {
    if (error.code === 'ConditionalCheckFailedException') {
      const err = new Error('User not found');
      err.code = 'USER_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }
    throw error;
  }
}

// ==================== TASK PLANS TABLE OPERATIONS ====================

/**
 * Create a new task plan
 * @param {string} userId - User ID
 * @param {Object} taskPlan - Task plan object
 * @returns {Promise<Object>} Created task plan
 */
async function createTaskPlan(userId, taskPlan) {
  const timestamp = new Date().toISOString();

  const plan = {
    userId,
    taskId: taskPlan.taskId,
    taskName: taskPlan.taskName,
    timeMode: taskPlan.timeMode,
    amount: taskPlan.amount,
    subtasks: taskPlan.subtasks,
    schedule: taskPlan.schedule,
    totalEstimatedTime: taskPlan.totalEstimatedTime,
    notes: taskPlan.notes || '',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const params = {
    TableName: TASKS_TABLE,
    Item: plan,
  };

  await dynamodb.put(params).promise();
  return plan;
}

/**
 * Get all task plans for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of task plans sorted by createdAt
 */
async function getTaskPlans(userId) {
  const params = {
    TableName: TASKS_TABLE,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
  };

  const result = await dynamodb.query(params).promise();

  // Sort by createdAt descending (newest first)
  const sortedPlans = (result.Items || []).sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return sortedPlans;
}

/**
 * Get a specific task plan
 * @param {string} userId - User ID
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>} Task plan object
 */
async function getTaskPlan(userId, taskId) {
  const params = {
    TableName: TASKS_TABLE,
    Key: {
      userId,
      taskId,
    },
  };

  const result = await dynamodb.get(params).promise();

  if (!result.Item) {
    const err = new Error('Task plan not found');
    err.code = 'TASK_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  return result.Item;
}

/**
 * Update a subtask's status
 * @param {string} userId - User ID
 * @param {string} taskId - Task ID
 * @param {string} subId - Subtask ID
 * @param {Object} updates - Subtask updates (e.g., { done: true })
 * @returns {Promise<Object>} Updated task plan
 */
async function updateSubtask(userId, taskId, subId, updates) {
  // First, get the current task plan
  const taskPlan = await getTaskPlan(userId, taskId);

  // Find and update the subtask
  const subtaskIndex = taskPlan.subtasks.findIndex((sub) => sub.id === subId);

  if (subtaskIndex === -1) {
    const err = new Error('Subtask not found');
    err.code = 'SUBTASK_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  // Update the subtask
  taskPlan.subtasks[subtaskIndex] = {
    ...taskPlan.subtasks[subtaskIndex],
    ...updates,
  };

  // Update the task plan with new subtasks and timestamp
  const timestamp = new Date().toISOString();

  const params = {
    TableName: TASKS_TABLE,
    Key: {
      userId,
      taskId,
    },
    UpdateExpression: 'SET subtasks = :subtasks, updatedAt = :updatedAt',
    ExpressionAttributeValues: {
      ':subtasks': taskPlan.subtasks,
      ':updatedAt': timestamp,
    },
    ReturnValues: 'ALL_NEW',
  };

  const result = await dynamodb.update(params).promise();
  return result.Attributes;
}

/**
 * Delete a task plan
 * @param {string} userId - User ID
 * @param {string} taskId - Task ID
 * @returns {Promise<void>}
 */
async function deleteTaskPlan(userId, taskId) {
  const params = {
    TableName: TASKS_TABLE,
    Key: {
      userId,
      taskId,
    },
    ConditionExpression: 'attribute_exists(userId) AND attribute_exists(taskId)',
  };

  try {
    await dynamodb.delete(params).promise();
  } catch (error) {
    if (error.code === 'ConditionalCheckFailedException') {
      const err = new Error('Task plan not found');
      err.code = 'TASK_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }
    throw error;
  }
}

module.exports = {
  // Users
  createUser,
  getUser,
  updateUser,
  // Task Plans
  createTaskPlan,
  getTaskPlans,
  getTaskPlan,
  updateSubtask,
  deleteTaskPlan,
};
