import { getRecentErrors, getErrorStats } from '../services/errorLogger.js';
import os from 'os';

// Health check endpoint
export const healthCheck = (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime / 60)} minutes`,
    memory: {
      used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
    },
    system: {
      platform: os.platform(),
      cpus: os.cpus().length,
      loadAverage: os.loadavg()[0].toFixed(2)
    }
  });
};

// Get error statistics (protected endpoint)
export const getErrors = (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const errors = getRecentErrors(limit);
    const stats = getErrorStats();
    
    res.json({
      success: true,
      data: {
        errors,
        stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve errors'
    });
  }
};

// Get system stats
export const getSystemStats = (req, res) => {
  try {
    const stats = getErrorStats();
    const uptime = process.uptime();
    
    res.json({
      success: true,
      data: {
        uptime: Math.floor(uptime),
        errors: stats,
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve stats'
    });
  }
};
