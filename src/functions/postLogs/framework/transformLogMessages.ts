import LogEvent from '../application/LogEvent';
import LogMessage from './LogMessage';

export default function transformLogMessages(logMessages: LogMessage[] | LogMessage): LogEvent[] {
  return (logMessages
    ? (Array.isArray(logMessages) ? logMessages : [logMessages])
    : [])
    .map((logMessage) => {
      let timestamp: number = new Date().getTime();

      if (logMessage !== null && logMessage !== undefined) {
        if (logMessage.timestamp === null || logMessage.timestamp === undefined) {
          if (typeof (logMessage) === 'object') {
            logMessage['timestampProvidedByLogService'] = true;
          }
        } else {
          timestamp = logMessage.timestamp;
        }
      }

      return {
        timestamp,
        message: JSON.stringify(logMessage),
      };
    });
}
