/**
 * AI Service for generating task breakdowns and schedules
 * This is a placeholder implementation with mock data
 * In production, this would integrate with AWS Bedrock or another AI service
 */

/**
 * Generate a task plan with subtasks and schedule
 * @param {string} taskName - Name of the task
 * @param {string} timeMode - "days" or "hours"
 * @param {number} amount - Number of days or hours
 * @param {Object} userPreferences - User preferences (maxHoursPerDay, workDays)
 * @returns {Promise<Object>} Generated task plan
 */
async function generatePlan(taskName, timeMode, amount, userPreferences = {}) {
  // Default preferences
  const maxHoursPerDay = userPreferences.maxHoursPerDay || 8;
  const workDays = userPreferences.workDays || [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ];

  // Generate a random number of subtasks (3-10)
  const numSubtasks = Math.floor(Math.random() * 8) + 3;

  // Sample subtask templates
  const subtaskTemplates = [
    { name: 'Research and planning', duration: '2h', priority: 'High' },
    { name: 'Initial setup and configuration', duration: '1h', priority: 'High' },
    { name: 'Core implementation', duration: '4h', priority: 'High' },
    { name: 'Testing and validation', duration: '2h', priority: 'Medium' },
    { name: 'Documentation', duration: '1h', priority: 'Medium' },
    { name: 'Code review', duration: '1h', priority: 'Medium' },
    { name: 'Bug fixes and refinements', duration: '2h', priority: 'Medium' },
    { name: 'Performance optimization', duration: '3h', priority: 'Low' },
    { name: 'Final review and cleanup', duration: '1h', priority: 'Low' },
    { name: 'Deployment preparation', duration: '2h', priority: 'Medium' },
  ];

  // Generate subtasks
  const subtasks = [];
  const usedTemplates = new Set();

  for (let i = 0; i < numSubtasks; i++) {
    let template;
    do {
      template = subtaskTemplates[Math.floor(Math.random() * subtaskTemplates.length)];
    } while (usedTemplates.has(template.name) && usedTemplates.size < subtaskTemplates.length);

    usedTemplates.add(template.name);

    // Vary the duration slightly
    const baseDuration = parseInt(template.duration);
    const variance = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
    const duration = Math.max(1, baseDuration + variance);

    subtasks.push({
      id: String(i + 1),
      name: `${template.name} for ${taskName}`,
      duration: `${duration}h`,
      priority: template.priority,
      done: false,
    });
  }

  // Calculate total estimated time
  const totalHours = subtasks.reduce((sum, subtask) => {
    return sum + parseInt(subtask.duration);
  }, 0);

  // Generate schedule based on time mode
  const schedule = {};

  if (timeMode === 'days') {
    // Distribute subtasks across days
    let currentDay = 1;
    let currentDayHours = 0;
    let subtaskIndex = 0;

    while (subtaskIndex < subtasks.length && currentDay <= amount) {
      const dayKey = `day${currentDay}`;
      schedule[dayKey] = [];

      while (subtaskIndex < subtasks.length && currentDayHours < maxHoursPerDay) {
        const subtask = subtasks[subtaskIndex];
        const subtaskHours = parseInt(subtask.duration);

        if (currentDayHours + subtaskHours <= maxHoursPerDay) {
          schedule[dayKey].push(subtask.id);
          currentDayHours += subtaskHours;
          subtaskIndex++;
        } else {
          break;
        }
      }

      currentDay++;
      currentDayHours = 0;
    }

    // If there are remaining subtasks, add them to the last day
    if (subtaskIndex < subtasks.length) {
      const lastDayKey = `day${currentDay - 1}`;
      while (subtaskIndex < subtasks.length) {
        schedule[lastDayKey].push(subtasks[subtaskIndex].id);
        subtaskIndex++;
      }
    }
  } else if (timeMode === 'hours') {
    // Distribute subtasks to fit within total hours
    let remainingHours = amount;
    let subtaskIndex = 0;
    let dayCounter = 1;

    while (subtaskIndex < subtasks.length && remainingHours > 0) {
      const dayKey = `session${dayCounter}`;
      schedule[dayKey] = [];
      let sessionHours = 0;

      while (
        subtaskIndex < subtasks.length &&
        sessionHours < maxHoursPerDay &&
        remainingHours > 0
      ) {
        const subtask = subtasks[subtaskIndex];
        const subtaskHours = parseInt(subtask.duration);

        if (sessionHours + subtaskHours <= Math.min(maxHoursPerDay, remainingHours)) {
          schedule[dayKey].push(subtask.id);
          sessionHours += subtaskHours;
          remainingHours -= subtaskHours;
          subtaskIndex++;
        } else {
          break;
        }
      }

      dayCounter++;
    }
  }

  // Generate notes
  const notes = `This task plan was generated for "${taskName}" with a ${timeMode} constraint of ${amount} ${timeMode}. The plan includes ${numSubtasks} subtasks with an estimated total time of ${totalHours} hours. Adjust the schedule based on your actual progress and priorities.`;

  return {
    subtasks,
    schedule,
    totalEstimatedTime: `${totalHours}h`,
    notes,
  };
}

/**
 * Validate that a generated plan meets all requirements
 * @param {Object} plan - Generated plan
 * @returns {boolean} True if valid
 */
function validatePlan(plan) {
  // Check that plan has required fields
  if (!plan.subtasks || !plan.schedule || !plan.totalEstimatedTime || !plan.notes) {
    return false;
  }

  // Check subtask count (3-10)
  if (plan.subtasks.length < 3 || plan.subtasks.length > 10) {
    return false;
  }

  // Check each subtask has required fields
  for (const subtask of plan.subtasks) {
    if (!subtask.id || !subtask.name || !subtask.duration || !subtask.priority) {
      return false;
    }

    // Check duration format (e.g., "2h", "45m")
    if (!/^\d+[hm]$/.test(subtask.duration)) {
      return false;
    }

    // Check priority is valid
    if (!['High', 'Medium', 'Low'].includes(subtask.priority)) {
      return false;
    }

    // Check done is boolean
    if (typeof subtask.done !== 'boolean') {
      return false;
    }
  }

  return true;
}

module.exports = {
  generatePlan,
  validatePlan,
};
