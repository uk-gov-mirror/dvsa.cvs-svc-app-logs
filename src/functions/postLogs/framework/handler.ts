import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import createResponse from '../../../common/application/utils/createResponse';
import Response from '../../../common/application/api/Response';
import { Logger, LogMessage, createLogger } from './logger';

let logger: Logger | null = null;

export async function handler(event: APIGatewayProxyEvent, fnCtx: Context): Promise<Response> {
  if (logger === null) {
    logger = await createLogger('LogsService', process.env.FAILED_LOGINS_CWLG_NAME);
  }

  if (event.body) {
    const logEvents = <LogMessage[] | LogMessage>JSON.parse(event.body);

    const numOfLogEvents = await logger(logEvents);

    return createResponse({ message: `${numOfLogEvents} log events were received and saved.` });
  }

  return createResponse(
    { message: 'Bad Request: request body should contain JSON array of log events.' },
    400);
}
