import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_DIR = path.join(__dirname, '../../logs');
const ERROR_LOG = path.join(LOG_DIR, 'errors.log');
const ACCESS_LOG = path.join(LOG_DIR, 'access.log');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Error levels
const LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL'
};

// Format log entry
const formatLog = (level, message, metadata = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...metadata
  };
  return JSON.stringify(logEntry) + '\n';
};

// Write to log file
const writeLog = (logFile, entry) => {
  try {
    fs.appendFileSync(logFile, entry);
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
};

// Log error
export const logError = (error, context = {}) => {
  const entry = formatLog(LEVELS.ERROR, error.message, {
    stack: error.stack,
    name: error.name,
    ...context
  });
  
  writeLog(ERROR_LOG, entry);
  console.error('❌ ERROR:', error.message, context);
};

// Log critical error (requires immediate attention)
export const logCritical = (error, context = {}) => {
  const entry = formatLog(LEVELS.CRITICAL, error.message, {
    stack: error.stack,
    name: error.name,
    ...context
  });
  
  writeLog(ERROR_LOG, entry);
  console.error('🚨 CRITICAL:', error.message, context);
};

// Log warning
export const logWarning = (message, context = {}) => {
  const entry = formatLog(LEVELS.WARN, message, context);
  writeLog(ERROR_LOG, entry);
  console.warn('⚠️  WARNING:', message, context);
};

// Log info (for important events)
export const logInfo = (message, context = {}) => {
  const entry = formatLog(LEVELS.INFO, message, context);
  writeLog(ACCESS_LOG, entry);
  
  // Only log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('ℹ️  INFO:', message, context);
  }
};

// Log API request
export const logRequest = (req, statusCode, responseTime) => {
  const entry = formatLog(LEVELS.INFO, 'API Request', {
    method: req.method,
    path: req.path,
    statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  writeLog(ACCESS_LOG, entry);
};

// Get recent errors (for monitoring endpoint)
export const getRecentErrors = (limit = 50) => {
  try {
    if (!fs.existsSync(ERROR_LOG)) {
      return [];
    }
    
    const content = fs.readFileSync(ERROR_LOG, 'utf-8');
    const lines = content.trim().split('\n');
    const errors = lines
      .slice(-limit)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .reverse();
    
    return errors;
  } catch (err) {
    console.error('Failed to read error log:', err);
    return [];
  }
};

// Get error statistics
export const getErrorStats = () => {
  try {
    const errors = getRecentErrors(1000);
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    const recentErrors = {
      lastHour: errors.filter(e => new Date(e.timestamp).getTime() > oneHourAgo).length,
      last24Hours: errors.filter(e => new Date(e.timestamp).getTime() > oneDayAgo).length,
      total: errors.length
    };
    
    const errorsByLevel = errors.reduce((acc, error) => {
      acc[error.level] = (acc[error.level] || 0) + 1;
      return acc;
    }, {});
    
    return {
      recentErrors,
      errorsByLevel,
      lastError: errors[0] || null
    };
  } catch (err) {
    console.error('Failed to get error stats:', err);
    return null;
  }
};

// Clear old logs (keep last 7 days)
export const cleanOldLogs = () => {
  try {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    [ERROR_LOG, ACCESS_LOG].forEach(logFile => {
      if (!fs.existsSync(logFile)) return;
      
      const content = fs.readFileSync(logFile, 'utf-8');
      const lines = content.trim().split('\n');
      
      const recentLines = lines.filter(line => {
        try {
          const entry = JSON.parse(line);
          return new Date(entry.timestamp).getTime() > sevenDaysAgo;
        } catch {
          return false;
        }
      });
      
      fs.writeFileSync(logFile, recentLines.join('\n') + '\n');
    });
    
    logInfo('Cleaned old logs', { retainedDays: 7 });
  } catch (err) {
    console.error('Failed to clean old logs:', err);
  }
};

// Schedule daily log cleanup
setInterval(cleanOldLogs, 24 * 60 * 60 * 1000);

export default {
  logError,
  logCritical,
  logWarning,
  logInfo,
  logRequest,
  getRecentErrors,
  getErrorStats,
  cleanOldLogs
};
