import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import createResponse from '../../../common/application/utils/createResponse';
import Response from '../../../common/application/api/Response';
import Logger from '../application/Logger';
import LogMessage from './LogMessage';
import transformLogMessages from './transformLogMessages';
import { createLogger } from './createLogger';

let logger: Logger | null = null;

export async function handler(event: APIGatewayProxyEvent, fnCtx: Context): Promise<Response> {
  if (logger === null) {
    logger = await createLogger('LogsServiceLogger', process.env.MOBILE_APP_LOGS_CWLG_NAME);
  }

  if (event.body) {
    const logMessages = <LogMessage[] | LogMessage>JSON.parse(event.body);
    const logEvents = transformLogMessages(logMessages);
    const numOfLogEvents = logEvents.length;

    await logger.logEvents(logEvents);
    logger.customMetric('LogsPosted', 'Number of logs posted', numOfLogEvents);
    return createResponse({ message: `${numOfLogEvents} log messages were received and saved.` });
  }

  return createResponse(
    { message: 'Bad Request: request body should contain JSON array of log messages.' },
    400);
}

/**
 * Ability to explicitly set the Logger, for use by the tests.
 */
export async function setLogger(loggerOverride: Logger | null) {
  logger = loggerOverride;
}
