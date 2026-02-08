/**
 * Logging utility for better debugging and error tracking
 */

const isDev = import.meta.env.DEV;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  message: string;
  data?: any;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private log(level: LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const entry: LogEntry = { level, timestamp, message, data };

    // Keep logs in memory (max 1000)
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output with colors
    const prefix = this.getPrefix(level);
    if (isDev) {
      if (data) {
        console.log(`${prefix} ${message}`, data);
      } else {
        console.log(`${prefix} ${message}`);
      }
    }

    // Store in localStorage for debugging
    try {
      const existingLogs = localStorage.getItem('mindmap_logs');
      const logsArray = existingLogs ? JSON.parse(existingLogs) : [];
      logsArray.push(entry);

      // Keep only last 500 logs in localStorage
      if (logsArray.length > 500) {
        logsArray.shift();
      }

      localStorage.setItem('mindmap_logs', JSON.stringify(logsArray));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  private getPrefix(level: LogLevel): string {
    const icons: Record<LogLevel, string> = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    };
    return `[${icons[level]} ${level.toUpperCase()}]`;
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, data?: any) {
    if (data instanceof Error) {
      this.log('error', message, {
        message: data.message,
        stack: data.stack,
        name: data.name,
      });
    } else {
      this.log('error', message, data);
    }
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  getRecentLogs(count: number = 20): LogEntry[] {
    return this.logs.slice(-count);
  }

  getErrorLogs(): LogEntry[] {
    return this.logs.filter(log => log.level === 'error' || log.level === 'warn');
  }

  clearLogs() {
    this.logs = [];
    try {
      localStorage.removeItem('mindmap_logs');
    } catch (e) {
      // Ignore
    }
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  downloadLogs() {
    const logsJson = this.exportLogs();
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindmap-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const logger = new Logger();
