import { logRequest } from '../services/errorLogger.js';

export const requestLoggerMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Capture response finish
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logRequest(req, res.statusCode, responseTime);
  });
  
  next();
};
