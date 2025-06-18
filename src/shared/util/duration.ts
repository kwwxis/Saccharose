// noinspection JSUnusedGlobalSymbols
export class Duration {
  private readonly millis: number;

  private constructor(millis: number) {
    this.millis = Math.trunc(millis); // ensure integer milliseconds
  }

  // --- Factory Methods ---

  static ofDays(days: number): Duration {
    return new Duration(days * 86_400_000);
  }

  static ofHours(hours: number): Duration {
    return new Duration(hours * 3_600_000);
  }

  static ofMinutes(minutes: number): Duration {
    return new Duration(minutes * 60_000);
  }

  static ofSeconds(seconds: number): Duration {
    return new Duration(seconds * 1000);
  }

  static ofMillis(millis: number): Duration {
    return new Duration(millis);
  }

  static between(start: Date|number, end: Date|number): Duration {
    return new Duration(asMs(end) - asMs(start));
  }

  // --- Accessors ---

  toMillis(): number {
    return this.millis;
  }

  toSeconds(): number {
    return Math.floor(this.millis / 1000);
  }

  toMinutes(): number {
    return Math.floor(this.millis / 60_000);
  }

  toHours(): number {
    return Math.floor(this.millis / 3_600_000);
  }

  toDays(): number {
    return Math.floor(this.millis / 86_400_000);
  }

  // --- Arithmetic Operations ---

  plus(other: Duration): Duration {
    return new Duration(this.millis + other.millis);
  }

  minus(other: Duration): Duration {
    return new Duration(this.millis - other.millis);
  }

  multipliedBy(factor: number): Duration {
    return new Duration(this.millis * factor);
  }

  dividedBy(divisor: number): Duration {
    return new Duration(this.millis / divisor);
  }

  negated(): Duration {
    return new Duration(-this.millis);
  }

  abs(): Duration {
    return new Duration(Math.abs(this.millis));
  }

  isZero(): boolean {
    return this.millis === 0;
  }

  isNegative(): boolean {
    return this.millis < 0;
  }

  // --- Comparison ---

  lessThan(other: Duration): boolean {
    return this.millis < other.millis;
  }

  lessThanOrEqual(other: Duration): boolean {
    return this.millis <= other.millis;
  }

  greaterThan(other: Duration): boolean {
    return this.millis > other.millis;
  }

  greaterThanOrEqual(other: Duration): boolean {
    return this.millis >= other.millis;
  }

  equals(other: Duration): boolean {
    return this.millis === other.millis;
  }

  compareTo(other: Duration): number {
    return this.millis - other.millis;
  }
}

function asMs(d: Date|number): number {
  return typeof d === 'number' ? d : d.getTime();
}
