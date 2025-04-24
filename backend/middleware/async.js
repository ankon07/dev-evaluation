/**
 * Async handler to wrap async functions
 * This eliminates the need for try-catch blocks in controllers
 * @param {Function} fn - Async function to execute
 * @returns {Function} - Express middleware function
 */
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
