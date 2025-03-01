
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create production log file with timestamp in name
const timestamp = format(new Date(), 'yyyy-MM-dd');
const productionLogPath = path.join(logsDir, `production-${timestamp}.log`);

// Create a write stream for production logs
const productionLogStream = fs.createWriteStream(productionLogPath, { flags: 'a' });

export function log(message: string, type: 'info' | 'error' | 'warn' = 'info') {
  const timestamp = format(new Date(), 'HH:mm:ss');
  const logLine = `${timestamp} [${type.toUpperCase()}] ${message}`;
  
  // Always console log
  console.log(logLine);
  
  // Write to production log file
  productionLogStream.write(logLine + '\n');
}

export function error(message: string, err?: any) {
  let logMessage = message;
  if (err) {
    logMessage += `: ${err.message || err}`;
    if (err.stack) {
      logMessage += `\n${err.stack}`;
    }
  }
  log(logMessage, 'error');
}

export function warn(message: string) {
  log(message, 'warn');
}

// Function to get all log files
export function getLogFiles(): string[] {
  try {
    return fs.readdirSync(logsDir)
      .filter(file => file.startsWith('production-') && file.endsWith('.log'))
      .sort()
      .reverse(); // Most recent first
  } catch (err) {
    console.error('Error reading log directory:', err);
    return [];
  }
}

// Function to read a specific log file
export function readLogFile(filename: string): string {
  try {
    const filePath = path.join(logsDir, filename);
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error('Error reading log file:', err);
    return 'Error reading log file';
  }
}

// Close the log stream on process exit
process.on('exit', () => {
  productionLogStream.end();
});
