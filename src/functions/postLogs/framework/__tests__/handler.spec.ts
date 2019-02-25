import { HttpStatus } from './../../../../common/application/api/HttpStatus';
import { Mock, It, Times } from 'typemoq';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import * as createLogger from '../createLogger';
import * as transformLogMessages from '../transformLogMessages';
import LogEvent from '../../application/LogEvent';
import * as handler from '../handler';
import Logger from '../../application/Logger';

describe('handler', () => {
  const moqEvent = Mock.ofType<APIGatewayProxyEvent>();
  const moqContext = Mock.ofType<Context>();
  const moqLogger = Mock.ofType<Logger>();

  const sut = handler.handler;

  beforeEach(() => {
    moqEvent.reset();
    moqContext.reset();
    moqLogger.reset();

    moqEvent.setup(x => x.body).returns(() => null);

    handler.setLogger(moqLogger.object);

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
    moqEvent.reset();
    moqEvent.setup(x => x.body).returns(() => null);

    // ACT
    const result = await sut(moqEvent.object, moqContext.object);

    // ASSERT
    expect(result.statusCode).toEqual(400);
    expect(result.statusCode).toEqual(HttpStatus.BAD_REQUEST);
    expect(result.body).toMatch(/Bad Request: request body should contain JSON array of log messages/);
  });

  it('should return 400 Bad Request if the HTTP request body is undefined', async () => {
    moqEvent.reset();
    moqEvent.setup(x => x.body).returns(() => <any><unknown>undefined);

    // ACT
    const result = await sut(moqEvent.object, moqContext.object);

    // ASSERT
    expect(result.statusCode).toEqual(400);
    expect(result.statusCode).toEqual(HttpStatus.BAD_REQUEST);
    expect(result.body).toMatch(/Bad Request: request body should contain JSON array of log messages/);
  });

  it(
    'should return 200 and a message, and call transformLogMessages and logger, if the HTTP request body is set',
    async () => {
      moqEvent.reset();
      moqEvent.setup(x => x.body).returns(() => '{}');

      const moqTransformLogMessages = Mock.ofInstance(transformLogMessages.default);
      spyOn(transformLogMessages, 'default').and.callFake(moqTransformLogMessages.object);

      moqTransformLogMessages.setup(x => x(It.isAny()))
        .returns(() => Array(12).fill(Mock.ofType<LogEvent>().object));

      // ACT
      const result = await sut(moqEvent.object, moqContext.object);

      // ASSERT
      expect(result.statusCode).toEqual(200);
      moqLogger.verify(x => x.logEvents(It.is<LogEvent[]>(evnts => evnts.length === 12)), Times.once());
      moqTransformLogMessages.verify(x => x(It.isAny()), Times.once());
      expect(result.body).toMatch(/12 log messages were received and saved./);
    });

  it('should throw an error if the HTTP request body is invalid JSON.', async () => {
    moqEvent.reset();
    moqEvent.setup(x => x.body).returns(() => '{invalid-json');

    let wasErrorThrown = false;

    // ACT
    try {
      await sut(moqEvent.object, moqContext.object);
    } catch (e) {
      wasErrorThrown = true;
    }

    // ASSERT
    expect(wasErrorThrown).toEqual(true);
  });
});
