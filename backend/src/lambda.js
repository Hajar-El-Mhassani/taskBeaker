const awsServerlessExpress = require('aws-serverless-express');
const app = require('./app');

// Create server
const server = awsServerlessExpress.createServer(app);

// Lambda handler
exports.handler = (event, context) => {
  console.log('Lambda invoked:', {
    path: event.rawPath || event.path,
    method: event.requestContext?.http?.method || event.httpMethod,
  });

  return awsServerlessExpress.proxy(server, event, context, 'PROMISE').promise;
};
