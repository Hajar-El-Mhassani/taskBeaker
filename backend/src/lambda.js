const serverless = require('serverless-http');
const app = require('./app');

// Wrap Express app for Lambda
const handler = serverless(app);

// Lambda handler
exports.handler = async (event, context) => {
  console.log('Lambda invoked:', {
    rawPath: event.rawPath,
    path: event.path,
    method: event.requestContext?.http?.method || event.httpMethod,
    headers: event.headers,
  });

  return await handler(event, context);
};
