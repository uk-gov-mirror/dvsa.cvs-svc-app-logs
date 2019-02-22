import { CloudWatchLogs } from 'aws-sdk';
import { randomBytes } from 'crypto';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type Bag = { [propName: string]: any };

export type LogMessage = { timestamp?: number, [propName: string]: any };

type LogDelegate = (logMessages: LogMessage[] | LogMessage) => Promise<number>;

export class Logger {
  private logDelegate: LogDelegate;

  constructor(logDelegate: LogDelegate) {
    this.logDelegate = logDelegate;
  }

  /**
   * Sends the specified `LogMessage(s)` to the logging system.
   * @param logMessages The messages to log; either a single `LogMessage`, or an array of `LogMessages`.
   * @returns `Promise` for completing the action, which returns the number of `LogMessages` that were
   * supplied and saved.
   */
  logMessages(logMessages: LogMessage[] | LogMessage): Promise<number> {
    return this.logDelegate(logMessages);
  }

  /**
   * Sends a `LogMessage`, with the specified message string, log level and
   * optional additional log data, to the logging system.
   * @param message The message string to log.
   * @param logLevel The severity of the `LogMessage`.
   * @param logData Optional, any additional data to include in the `LogMessage`.
   * @returns Promise for completing the action, which returns the number of `LogMessages` that were
   * saved (for this function, always 1).
   */
  log(message: string, logLevel: LogLevel, logData?: Bag): Promise<number> {
    return this.logMessages(Object.assign(
      {
        message,
        logLevel,
        timestamp: new Date().getTime(),
      },
      logData));
  }
}

export const uniqueLogStreamName = (loggerName: string): string => {
  const date = new Date();
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  const randomUuid = randomBytes(16).toString('hex');
  return `${loggerName}-${year}-${month}-${day}-${randomUuid}`;
};

function ignoreResourceAlreadyExistsException(err: any) {
  if ((err.errorType || err.code) !== 'ResourceAlreadyExistsException') {
    throw err;
  }
}

async function createCloudWatchLogger(loggerName: string, logGroupName: string) {
  const cloudWatchLogs = new CloudWatchLogs();
  const logStreamName = uniqueLogStreamName(loggerName);

  await cloudWatchLogs.createLogStream({ logGroupName, logStreamName }).promise()
    .catch(ignoreResourceAlreadyExistsException);

  let sequenceToken: CloudWatchLogs.SequenceToken | undefined = undefined;

  const cloudWatchLogger = async (logEvents: CloudWatchLogs.InputLogEvents) => {
    const logResult = await cloudWatchLogs.putLogEvents({
      logEvents,
      logGroupName,
      logStreamName,
      sequenceToken,
    }).promise();

    sequenceToken = logResult.nextSequenceToken;
  };

  console.log(`Initialised Custom CloudWatch logging to: ${logGroupName}/${logStreamName}`);
  return cloudWatchLogger;
}

/**
 * Creates a `Logger` object, which can be used to send `LogMessage(s)` to the logging system.
 * @param loggerName The name for the logger.
 * @param cloudWatchLogGroupName The name for the AWS CloudWatch log group to send logs to.
 * @returns `Promise` for completing the action, which returns the created `Logger`.
 */
export async function createLogger(loggerName: string, cloudWatchLogGroupName: string | undefined): Promise<Logger> {
  // If the `cloudWatchLogGroupName` variable is set then log to that CloudWatch log group.
  // This is also used to indicate we are running in the infrastructure, so the Amazon SDK will
  // automatically pull access credentials from IAM Role.
  const cloudWatchLogger = (cloudWatchLogGroupName && cloudWatchLogGroupName.length > 0)
    ? await createCloudWatchLogger(loggerName, cloudWatchLogGroupName)
    : null;

  // Create and return the logging delegate
  const logDelegate: LogDelegate = async (logMessages: LogMessage[] | LogMessage) => {
    const awsLogEvents = (logMessages
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

    if (awsLogEvents.length > 0) {
      if (cloudWatchLogger) {
        await cloudWatchLogger(awsLogEvents);
      } else {
        console.log('awsLogEvents: %O', awsLogEvents);
      }
    }

    return awsLogEvents.length;
  };

  return new Logger(logDelegate);
}
