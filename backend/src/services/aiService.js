/**
 * AI Service for generating task breakdowns and schedules using AWS Bedrock
 */

const AWS = require('aws-sdk');

const bedrock = new AWS.BedrockRuntime({
  region: process.env.AWS_REGION_CUSTOM || process.env.AWS_REGION || 'us-east-1',
});

// Use Claude 3 Sonnet as the default model
const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0';

/**
 * Generate a task plan with subtasks and schedule using AWS Bedrock
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

  // Create the prompt for Bedrock
  const prompt = `You are a task planning assistant. Generate a detailed task breakdown for the following:

Task: ${taskName}
Time Constraint: ${amount} ${timeMode}
Max Hours Per Day: ${maxHoursPerDay}
Work Days: ${workDays.join(', ')}

Generate a task plan with 3-10 subtasks. Each subtask should have:
- id: sequential number as string (e.g., "1", "2", "3")
- name: descriptive name for the subtask
- duration: estimated time in format like "2h" or "45m"
- priority: "High", "Medium", or "Low"
- done: false (boolean)

Also create a schedule that distributes subtasks across ${timeMode === 'days' ? 'days' : 'sessions'}, respecting the ${maxHoursPerDay} hours per day limit.

Return ONLY a valid JSON object with this exact structure:
{
  "subtasks": [
    {
      "id": "1",
      "name": "Subtask name",
      "duration": "2h",
      "priority": "High",
      "done": false
    }
  ],
  "schedule": {
    "${timeMode === 'days' ? 'day1' : 'session1'}": ["1", "2"],
    "${timeMode === 'days' ? 'day2' : 'session2'}": ["3"]
  },
  "totalEstimatedTime": "10h",
  "notes": "Brief description of the plan"
}`;

  try {
    // Call Bedrock with Claude 3
    const params = {
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    };

    const response = await bedrock.invokeModel(params).promise();
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    // Extract the generated text from Claude's response
    const generatedText = responseBody.content[0].text;

    // Parse the JSON from the response
    // Claude might wrap it in markdown code blocks, so we need to extract it
    let jsonText = generatedText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const plan = JSON.parse(jsonText);

    // Validate the plan structure
    if (!validatePlan(plan)) {
      throw new Error('Generated plan does not meet validation requirements');
    }

    return plan;
  } catch (error) {
    console.error('Bedrock API error:', error);

    // Fallback to a simple generated plan if Bedrock fails
    return generateFallbackPlan(taskName, timeMode, amount, maxHoursPerDay);
  }
}

/**
 * Fallback plan generator if Bedrock is unavailable
 */
function generateFallbackPlan(taskName, timeMode, amount, maxHoursPerDay) {
  const subtasks = [
    {
      id: '1',
      name: `Research and planning for ${taskName}`,
      duration: '2h',
      priority: 'High',
      done: false,
    },
    {
      id: '2',
      name: `Initial setup for ${taskName}`,
      duration: '1h',
      priority: 'High',
      done: false,
    },
    {
      id: '3',
      name: `Core implementation of ${taskName}`,
      duration: '3h',
      priority: 'High',
      done: false,
    },
    {
      id: '4',
      name: `Testing ${taskName}`,
      duration: '2h',
      priority: 'Medium',
      done: false,
    },
    {
      id: '5',
      name: `Documentation for ${taskName}`,
      duration: '1h',
      priority: 'Medium',
      done: false,
    },
  ];

  // Distribute subtasks respecting maxHoursPerDay
  const schedule = {};
  let currentDay = 1;
  let currentDayHours = 0;
  let subtaskIndex = 0;

  while (subtaskIndex < subtasks.length) {
    const dayKey = timeMode === 'days' ? `day${currentDay}` : `session${currentDay}`;
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

  return {
    subtasks,
    schedule,
    totalEstimatedTime: '9h',
    notes: `Basic task plan for "${taskName}" (fallback mode). Customize as needed.`,
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
