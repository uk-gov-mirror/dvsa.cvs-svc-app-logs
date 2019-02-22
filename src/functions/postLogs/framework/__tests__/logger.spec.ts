import * as awsSdkMock from 'aws-sdk-mock';
import * as sinon from 'sinon';
import { Mock, It, Times } from 'typemoq';
import * as logger from '../logger';

describe('logger', () => {
  let createLogStreamSpy = sinon.stub().resolves(true);
  let putLogEventsSpy = sinon.stub().resolves(true);
  const moqConsoleLog = Mock.ofInstance(console.log);
  const originalConsoleLog = console.log;

  beforeEach(() => {
    createLogStreamSpy = sinon.stub().resolves(true);
    putLogEventsSpy = sinon.stub().resolves(true);

    moqConsoleLog.reset();

    moqConsoleLog
      .setup(x => x(It.isAny(), It.isAny()))
      .callback(
        (message?: any, ...optionalParams: any[]) => originalConsoleLog(message, ...optionalParams));

    awsSdkMock.mock('CloudWatchLogs', 'createLogStream', createLogStreamSpy);
    awsSdkMock.mock('CloudWatchLogs', 'putLogEvents', putLogEventsSpy);

    spyOn(console, 'log').and.callFake(moqConsoleLog.object);
  });

  afterEach(() => {
    awsSdkMock.restore('CloudWatchLogs', 'createLogStream');
    awsSdkMock.restore('CloudWatchLogs', 'putLogEvents');
  });

  describe('logMessages', () => {
    it('calls console log if no CloudWatch LogGroupName specified', async () => {
      const sut = await logger.createLogger('loggerName', undefined);

      // ACT
      const result = await sut.logMessages({ timestamp: 123, msg: 'example log message 123 abc' });

      // ASSERT
      expect(createLogStreamSpy.called).toBe(false);
      expect(putLogEventsSpy.called).toBe(false);

      moqConsoleLog.verify(
        x => x(
          It.is<string>(s => /awsLogEvents/.test(s)),
          It.is<any>(awsLogEvents => /example log message 123 abc/.test(awsLogEvents[0].message))),
        Times.once());

      expect(result).toEqual(1);
    });

    it('calls CloudWatch logging if CloudWatch LogGroupName is specified', async () => {
      const sut = await logger.createLogger('loggerName', 'cloudWatchLogGroupName');

      // ACT
      const result = await sut.logMessages({ timestamp: 123, msg: 'example log message 789 xyz' });

      // ASSERT
      expect(createLogStreamSpy.called).toBe(true);
      expect(putLogEventsSpy.called).toBe(true);

      moqConsoleLog.verify(x => x(It.is<string>(s => /awsLogEvents/.test(s)), It.isAny()), Times.never());
      moqConsoleLog.verify(x => x(It.is<string>(s => /awsLogEvents/.test(s))), Times.never());

      expect(result).toEqual(1);
    });
  });

  describe('uniqueLogStreamName', () => {
    const sut = logger.uniqueLogStreamName;

    it('returns a string in the expected format', () => {
      // ACT
      const result = sut('LoggerName');

      // ASSERT
      expect(result).toMatch(/^LoggerName-\d\d\d\d-\d\d-\d\d-[0-9a-f]{32}$/);
    });

    it('generates unique names each time', () => {
      const results = new Set();
      const countToGenerate = 50000;

      // ACT
      for (let i = 0; i < countToGenerate; i = i + 1) {
        const result = sut('LoggerName');
        results.add(result);
      }

      // ASSERT
      expect(results.size).toEqual(countToGenerate);
    });
  });
});
