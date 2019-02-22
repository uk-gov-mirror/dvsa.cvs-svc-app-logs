import { CloudWatchLogs } from 'aws-sdk';
import { randomBytes } from 'crypto';

export type LogEvent = { timestamp: number, message: object | string };
export type Logger = (logEvents: LogEvent[] | LogEvent) => Promise<number>;

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
      logGroupName,
      logStreamName,
      sequenceToken,
      logEvents: logEvents.map(logEvent => {
        return {
          message: JSON.stringify(logEvent.message),
          timestamp: logEvent.timestamp
        };
      }),
    }).promise();

    sequenceToken = logResult.nextSequenceToken;
  };

  console.log(`Initialised Custom CloudWatch logging to: ${logGroupName}/${logStreamName}`);
  return cloudWatchLogger;
}

export async function createLogger(loggerName: string, cloudWatchLogGroupName: string | undefined): Promise<Logger> {
  // If the `cloudWatchLogGroupName` variable is set then log to that CloudWatch log group.
  // This is also used to indicate we are running in the infrastructure, so the Amazon SDK will
  // automatically pull access credentials from IAM Role.
  const cloudWatchLogger = (cloudWatchLogGroupName && cloudWatchLogGroupName.length > 0)
    ? await createCloudWatchLogger(loggerName, cloudWatchLogGroupName)
    : null;

  // Create and return the logging delegate
  const logger: Logger = async (logEvents: LogEvent[] | LogEvent) => {
    logEvents = logEvents ?
      (Array.isArray(logEvents) ? logEvents : [ logEvents ])
      : [];

    const logEventsFormatted = logEvents.map(logEvent => {
      return {
        message: typeof(logEvent.message) === "string" ? logEvent.message : JSON.stringify(logEvent.message),
        timestamp: logEvent.timestamp
      };
    });

    if (logEventsFormatted.length > 0) {
      if (cloudWatchLogger) {
        await cloudWatchLogger(logEventsFormatted);
      }
      else {
        console.log('logEvents: %O', logEventsFormatted);
      }
    }

    return logEventsFormatted.length;
  };

  return logger;
}
