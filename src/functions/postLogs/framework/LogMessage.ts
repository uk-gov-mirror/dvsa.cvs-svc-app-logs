export default interface LogMessage {
  /**
   * The time the event occurred, expressed as the number of milliseconds after Jan 1, 1970 00:00:00 UTC.
   * Optional, if not set, then it will be provided by the Logging Servce.
   */
  timestamp?: number;

  /**
   * The properties to include in the Log Message.
   */
  [propName: string]: any;
}
