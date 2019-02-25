import { HttpStatus } from './../../../../common/application/api/HttpStatus';
import { Mock, It, Times } from 'typemoq';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import * as createLogger from '../createLogger';
import * as handler from '../handler';

describe('handler', () => {
  const moqEvent = Mock.ofType<APIGatewayProxyEvent>();
  const moqContext = Mock.ofType<Context>();

  const sut = handler.handler;

  beforeEach(() => {
    moqEvent.reset();
    moqContext.reset();

    moqEvent.setup(x => x.body).returns(() => null);

    delete process.env.MOBILE_APP_LOGS_CWLG_NAME;
  });

  it('should call `createLogger` as expected', async () => {
    handler.setLogger(null);

    delete process.env.MOBILE_APP_LOGS_CWLG_NAME;
    process.env.MOBILE_APP_LOGS_CWLG_NAME = 'example-mobile-app-cwlg-name';

    const moqCreateLogger = Mock.ofInstance(createLogger.createLogger);
    spyOn(createLogger, 'createLogger').and.callFake(moqCreateLogger.object);

    // ACT
    await sut(moqEvent.object, moqContext.object);

    // ASSERT
    moqCreateLogger.verify(
      x => x('LogsServiceLogger', 'example-mobile-app-cwlg-name'),
      Times.once());
  });

  it('should return 400 Bad Request if the HTTP request body is null', async () => {
    moqEvent.setup(x => x.body).returns(() => null);

    // ACT
    const result = await sut(moqEvent.object, moqContext.object);

    // ASSERT
    expect(result.statusCode).toEqual(400);
    expect(result.statusCode).toEqual(HttpStatus.BAD_REQUEST);
    expect(result.body).toMatch(/Bad Request: request body should contain JSON array of log messages/);
  });

  it('should return 400 Bad Request if the HTTP request body is undefined', async () => {
    moqEvent.setup(x => x.body).returns(() => <any><unknown>undefined);

    // ACT
    const result = await sut(moqEvent.object, moqContext.object);

    // ASSERT
    expect(result.statusCode).toEqual(400);
    expect(result.statusCode).toEqual(HttpStatus.BAD_REQUEST);
    expect(result.body).toMatch(/Bad Request: request body should contain JSON array of log messages/);
  });

  // rs-todo: resume here: handler tests
});
