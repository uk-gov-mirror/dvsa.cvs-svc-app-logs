import transformLogMessages from '../transformLogMessages';
import LogMessage from '../LogMessage';
import LogEvent from '../../application/LogEvent';

describe('transformLogMessages', () => {
  const sut = transformLogMessages;

  it('should transform single log message in to a single element array', async () => {
    const input: LogMessage = { test: 1234 };

    // ACT
    const result: LogEvent[] = await sut(input);

    // ASSERT
    expect(result.length).toEqual(1);
  });

  it('should transform array of log messages in to another array of same length', async () => {
    const input: LogMessage[] = [{ }, { }, { }];

    // ACT
    const result: LogEvent[] = await sut(input);

    // ASSERT
    expect(result.length).toEqual(3);
  });

  it('input timestamp is optional, and should get set if not supplied', async () => {
    const input: LogMessage[] = [{ }];

    // ACT
    const result: LogEvent[] = await sut(input);

    // ASSERT
    expect(result[0].timestamp).toBeDefined();
    expect(result[0].timestamp).toBeGreaterThan(0);
    expect(result[0].timestamp).toBeLessThanOrEqual(new Date().getTime());
    expect(result[0].message).toMatch(/timestampProvidedByLogService.?:.?true/);
  });

  it('input timestamp should not get overridden when supplied', async () => {
    const input: LogMessage[] = [{ timestamp: 123789 }];

    // ACT
    const result: LogEvent[] = await sut(input);

    // ASSERT
    expect(result[0].timestamp).toEqual(123789);
    expect(result[0].message).not.toMatch(/timestampProvidedByLogService/);
  });

  it('it should JSON serialise each log message object, even when anything is supplied', async () => {
    const input: LogMessage[] = [
      { timestamp: 1234, message: 'hello world' },
      { timestamp: 1234, message: 'hello world again' },
      { timestamp: 1234, message: 123556 },
      { timestamp: 1234, message: 98765432 },
      { message: 123556 },
      { },
      <any><unknown>null,
      { timestamp: 1234, message: 12345, logLevel: 'info' },
      <any><unknown>'hello world',
      <any><unknown>12345,
    ];

    // ACT
    const result: LogEvent[] = await sut(input);

    // ASSERT
    expect(result.length).toEqual(10);

    expect(result[0].message).toMatch(/hello world/);
    expect(result[1].message).toMatch(/hello world again/);
    expect(result[2].message).toMatch(/123556/);
    expect(result[3].message).toMatch(/98765432/);
    expect(result[4].message).toMatch(/123556/);
    expect(result[6].message).toMatch(/null/);
    expect(result[7].message).toMatch(/logLevel.?:.?.?info.?/);
    expect(result[8].message).toMatch(/^.?hello world.?$/);
    expect(result[9].message).toMatch(/^12345$/);

    expect(result[0].message).not.toMatch(/timestampProvidedByLogService/);
    expect(result[1].message).not.toMatch(/timestampProvidedByLogService/);
    expect(result[2].message).not.toMatch(/timestampProvidedByLogService/);
    expect(result[3].message).not.toMatch(/timestampProvidedByLogService/);
    expect(result[4].message).toMatch(/timestampProvidedByLogService.?:.?true/);
    expect(result[5].message).toMatch(/timestampProvidedByLogService.?:.?true/);
    expect(result[7].message).not.toMatch(/timestampProvidedByLogService/);
  });
});
