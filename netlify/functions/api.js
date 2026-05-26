const serverless = require('serverless-http');
const app = require('../../server/src/index');

// Create the serverless handler
const handler = serverless(app);

// Export the handler wrapped in an async function to fix path routing.
// Netlify redirects /api/* to /.netlify/functions/api/*
// This intercepts the event and changes the path back to /api/* so Express routes match correctly.
module.exports.handler = async (event, context) => {
  if (event.path && event.path.startsWith('/.netlify/functions/api')) {
    event.path = event.path.replace('/.netlify/functions/api', '/api');
  }
  return await handler(event, context);
};
