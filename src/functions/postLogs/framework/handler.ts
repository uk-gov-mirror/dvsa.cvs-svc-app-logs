import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import createResponse from '../../../common/application/utils/createResponse';
import Response from '../../../common/application/api/Response';

export async function handler(event: APIGatewayProxyEvent, fnCtx: Context): Promise<Response> {
  return createResponse({});
}
