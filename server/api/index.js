/**
 * Vercel Serverless Entry Point
 * 
 * This file re-exports the Express app for Vercel's serverless functions.
 * Vercel routes /api/* requests here via vercel.json rewrites.
 */
const app = require('../src/index');

module.exports = app;
