const LogLevels = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

const getTimestamp = () => {
  return new Date().toISOString();
};

const formatLog = (level, message, data = null) => {
  try {
    const log = {
      timestamp: getTimestamp(),
      level,
      message
    };
    
    if (data) {
      log.data = data;
    }
    
    return JSON.stringify(log);
  } catch (error) {
    // Fallback if JSON.stringify fails
    return `${getTimestamp()} [${level}] ${message}`;
  }
};

const safeLog = (logFunction, message, data) => {
  try {
    logFunction(formatLog('INFO', message, data));
  } catch (error) {
    // If logging fails, don't crash - just try console.log directly
    try {
      console.log(`[LOGGER ERROR] Failed to log: ${message}`);
    } catch (e) {
      // Silently fail if even this doesn't work
    }
  }
};

export const logger = {
  error: (message, data) => {
    try {
      console.error(formatLog(LogLevels.ERROR, message, data));
    } catch (error) {
      console.error(`[LOGGER ERROR] ${message}`);
    }
  },
  
  warn: (message, data) => {
    try {
      console.warn(formatLog(LogLevels.WARN, message, data));
    } catch (error) {
      console.warn(`[LOGGER ERROR] ${message}`);
    }
  },
  
  info: (message, data) => {
    try {
      console.log(formatLog(LogLevels.INFO, message, data));
    } catch (error) {
      console.log(`[LOGGER ERROR] ${message}`);
    }
  },
  
  debug: (message, data) => {
    if (process.env.DEBUG === 'true') {
      try {
        console.log(formatLog(LogLevels.DEBUG, message, data));
      } catch (error) {
        console.log(`[LOGGER ERROR] ${message}`);
      }
    }
  }
};
