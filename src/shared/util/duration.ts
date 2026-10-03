// noinspection JSUnusedGlobalSymbols
/**
 * Represents a duration of time, stored internally as milliseconds.
 *
 * Provides factory methods for creating durations from days, hours, minutes, seconds, and milliseconds,
 * as well as methods for arithmetic operations and comparisons.
 *
 * Based on the Java `Duration` class but simplified for TypeScript.
 */
export class Duration {
  private readonly millis: number;

  /**
   * Internal constructor creating instance from milliseconds. Use factory methods for creating instances.
   */
  private constructor(millis: number) {
    this.millis = Math.trunc(millis); // ensure integer milliseconds
  }

  // --- Factory Methods ---

  /**
   * Creates a `Duration` representing the specified number of days.
   * @param days The number of days.
   */
  static ofDays(days: number): Duration {
    return new Duration(days * 86_400_000);
  }

  /**
   * Creates a `Duration` representing the specified number of hours.
   * @param hours The number of hours.
   */
  static ofHours(hours: number): Duration {
    return new Duration(hours * 3_600_000);
  }

  /**
   * Creates a `Duration` representing the specified number of minutes.
   * @param minutes The number of minutes.
   */
  static ofMinutes(minutes: number): Duration {
    return new Duration(minutes * 60_000);
  }

  /**
   * Creates a `Duration` representing the specified number of seconds.
   * @param seconds The number of seconds.
   */
  static ofSeconds(seconds: number): Duration {
    return new Duration(seconds * 1000);
  }

  /**
   * Creates a `Duration` representing the specified number of milliseconds.
   * @param millis The number of milliseconds.
   */
  static ofMillis(millis: number): Duration {
    return new Duration(millis);
  }

  /**
   * Creates a `Duration` representing the time between two dates or timestamps.
   * @param start The start date or timestamp.
   * @param end The end date or timestamp.
   */
  static between(start: Date|number, end: Date|number): Duration {
    return new Duration(asMs(end) - asMs(start));
  }

  // --- Accessors ---

  /**
   * Returns the total duration in milliseconds.
   *
   * **Note:** durations can be negative, so this method may return a negative number in such cases.
   */
  toMillis(): number {
    return this.millis;
  }

  /**
   * Returns the total duration in seconds, rounded down to the nearest whole number.
   *
   * **Note:** durations can be negative, so this method may return a negative number in such cases.
   */
  toSeconds(): number {
    return Math.floor(this.millis / 1000);
  }

  /**
   * Returns the total duration in minutes, rounded down to the nearest whole number.
   *
   * **Note:** durations can be negative, so this method may return a negative number in such cases.
   */
  toMinutes(): number {
    return Math.floor(this.millis / 60_000);
  }

  /**
   * Returns the total duration in hours, rounded down to the nearest whole number.
   *
   * **Note:** durations can be negative, so this method may return a negative number in such cases.
   */
  toHours(): number {
    return Math.floor(this.millis / 3_600_000);
  }

  /**
   * Returns the total duration in days, rounded down to the nearest whole number.
   *
   * **Note:** durations can be negative, so this method may return a negative number in such cases.
   */
  toDays(): number {
    return Math.floor(this.millis / 86_400_000);
  }

  /**
   * Returns a new `Date` that is this duration added to the specified base date.
   * @param base The date or timestamp to add this duration to. Defaults to the current date/time if not specified.
   * @returns A new `Date` representing the base date plus this duration.
   */
  toDate(base: Date|number = Date.now()): Date {
    return new Date(asMs(base) + this.millis);
  }

  // --- Arithmetic Operations ---

  /**
   * Returns a new `Duration` that is the sum of this duration and another duration.
   * @param other The other duration to add.
   * @returns A new `Duration` representing the sum of the two durations.
   */
  plus(other: Duration): Duration {
    return new Duration(this.millis + other.millis);
  }

  /**
   * Returns a new `Duration` that is the difference between this duration and another duration.
   * @param other The other duration to subtract.
   * @returns A new `Duration` representing the difference between the two durations.
   * This may be a negative duration if the other duration is greater than this one.
   */
  minus(other: Duration): Duration {
    return new Duration(this.millis - other.millis);
  }

  /**
   * Returns a new `Duration` that is this duration multiplied by a given factor.
   * @param factor The factor to multiply the duration by.
   * @returns A new `Duration` representing the scaled duration.
   */
  multipliedBy(factor: number): Duration {
    return new Duration(this.millis * factor);
  }

  /**
   * Returns a new `Duration` that is this duration divided by a given divisor.
   * @param divisor The divisor to divide the duration by.
   * @returns A new `Duration` representing the scaled duration.
   */
  dividedBy(divisor: number): Duration {
    return new Duration(this.millis / divisor);
  }

  /**
   * Returns a new `Duration` that is the negation of this duration.
   *
   * @returns A new `Duration` representing the negated duration.
   * If this duration was positive, the result will be negative, and vice versa.
   */
  negated(): Duration {
    return new Duration(-this.millis);
  }

  /**
   * Returns a new `Duration` that is the absolute value of this duration.
   *
   * @returns A new `Duration` representing the absolute duration.
   */
  abs(): Duration {
    return new Duration(Math.abs(this.millis));
  }

  /**
   * Returns true if this duration is precisely zero.
   */
  isZero(): boolean {
    return this.millis === 0;
  }

  /**
   * Returns true if this duration is negative (less than zero).
   */
  isNegative(): boolean {
    return this.millis < 0;
  }

  // --- Comparison ---

  /**
   * Returns true if this duration is less than the specified other duration.
   * @param other The other duration to compare against.
   * @returns True if this duration is less than the other duration, false otherwise.
   */
  lessThan(other: Duration): boolean {
    return this.millis < other.millis;
  }

  /**
   * Returns true if this duration is less than or equal to the specified other duration.
   * @param other The other duration to compare against.
   * @returns True if this duration is less than or equal to the other duration, false otherwise.
   */
  lessThanOrEqual(other: Duration): boolean {
    return this.millis <= other.millis;
  }

  /**
   * Returns true if this duration is greater than the specified other duration.
   * @param other The other duration to compare against.
   * @returns True if this duration is greater than the other duration, false otherwise.
   */
  greaterThan(other: Duration): boolean {
    return this.millis > other.millis;
  }

  /**
   * Returns true if this duration is greater than or equal to the specified other duration.
   * @param other The other duration to compare against.
   * @returns True if this duration is greater than or equal to the other duration, false otherwise.
   */
  greaterThanOrEqual(other: Duration): boolean {
    return this.millis >= other.millis;
  }

  /**
   * Returns true if this duration is equal to the specified other duration.
   * @param other The other duration to compare against.
   * @returns True if this duration is equal to the other duration, false otherwise.
   */
  equals(other: Duration): boolean {
    return this.millis === other.millis;
  }

  /**
   * Compares this duration with another duration for order.
   * @param other The other duration to compare against.
   * @returns A negative number if this duration is less than the other duration,
   *         zero if they are equal, and a positive number if this duration is greater than the other duration.
   */
  compareTo(other: Duration): number {
    return this.millis - other.millis;
  }
}

function asMs(d: Date|number): number {
  return typeof d === 'number' ? d : d.getTime();
}
