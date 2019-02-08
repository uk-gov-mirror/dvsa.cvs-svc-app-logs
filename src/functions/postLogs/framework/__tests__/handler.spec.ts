import { HttpStatus } from './../../../../common/application/api/HttpStatus';
import * as aws from 'aws-sdk-mock';
import { handler } from '../handler';
const lambdaTestUtils = require('aws-lambda-test-utils');
import * as createResponse from '../../../../common/application/utils/createResponse';
import { APIGatewayEvent, Context } from 'aws-lambda';

describe('post handler', () => {
  let dummyApigwEvent: APIGatewayEvent;
  let dummyContext: Context;
  let createResponseSpy: jasmine.Spy;

  beforeEach(() => {
    createResponseSpy = spyOn(createResponse, 'default');
    dummyApigwEvent = lambdaTestUtils.mockEventCreator.createAPIGatewayEvent({
    });
    dummyContext = lambdaTestUtils.mockContextCreator(() => null);
  });

  describe('given the handler recieves a log', () => {
    it('should return a successful response', async () => {
      createResponseSpy.and.returnValue({ statusCode: 200 });

      const resp: any = await handler(dummyApigwEvent, dummyContext);

      expect(resp.statusCode).toBe(200);
    });
  });
});
