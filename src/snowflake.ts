export const DEFAULT_EPOCH = 1_288_834_974_657n;
export const DEFAULT_DATACENTER_ID = 0n;
export const DEFAULT_WORKER_ID = 0n;

const TIMESTAMP_BITS = 41n;
const DATACENTER_BITS = 5n;
const WORKER_BITS = 5n;
const SEQUENCE_BITS = 12n;

const WORKER_SHIFT = SEQUENCE_BITS;
const DATACENTER_SHIFT = SEQUENCE_BITS + WORKER_BITS;
const TIMESTAMP_SHIFT = SEQUENCE_BITS + WORKER_BITS + DATACENTER_BITS;

const MAX_TIMESTAMP = (1n << TIMESTAMP_BITS) - 1n;
const MAX_DATACENTER_ID = (1n << DATACENTER_BITS) - 1n;
const MAX_WORKER_ID = (1n << WORKER_BITS) - 1n;
const MAX_SEQUENCE = (1n << SEQUENCE_BITS) - 1n;
const MAX_ID = (1n << 63n) - 1n;

export interface SnowflakeOptions {
  epoch?: bigint | number | string;
  datacenterId?: bigint | number | string;
  workerId?: bigint | number | string;
}

export interface GenerateOptions extends SnowflakeOptions {
  count?: number;
}

export interface ParsedSnowflakeId {
  id: string;
  timestamp: number;
  date: string;
  epoch: string;
  datacenterId: number;
  workerId: number;
  sequence: number;
}

export interface GeneratedSnowflakeId extends ParsedSnowflakeId {
  id: string;
}

export class SnowflakeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SnowflakeError';
  }
}

export class SnowflakeGenerator {
  private readonly epoch: bigint;
  private readonly datacenterId: bigint;
  private readonly workerId: bigint;
  private lastTimestamp = -1n;
  private sequence = 0n;

  constructor(options: SnowflakeOptions = {}) {
    this.epoch = normalizeInteger(options.epoch ?? DEFAULT_EPOCH, 'epoch');
    this.datacenterId = normalizeBoundedInteger(
      options.datacenterId ?? DEFAULT_DATACENTER_ID,
      'datacenter-id',
      0n,
      MAX_DATACENTER_ID,
    );
    this.workerId = normalizeBoundedInteger(
      options.workerId ?? DEFAULT_WORKER_ID,
      'worker-id',
      0n,
      MAX_WORKER_ID,
    );
  }

  nextId(nowMs = Date.now()): string {
    let timestamp = BigInt(nowMs);

    if (timestamp < this.lastTimestamp) {
      throw new SnowflakeError('Clock moved backwards. Refusing to generate an ID.');
    }

    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1n) & MAX_SEQUENCE;
      if (this.sequence === 0n) {
        timestamp = this.waitNextMillis(this.lastTimestamp);
      }
    } else {
      this.sequence = 0n;
    }

    this.lastTimestamp = timestamp;
    const delta = timestamp - this.epoch;

    if (delta < 0n) {
      throw new SnowflakeError('Current timestamp is before the configured epoch.');
    }
    if (delta > MAX_TIMESTAMP) {
      throw new SnowflakeError('Current timestamp exceeds the 41-bit Snowflake timestamp range.');
    }

    const id =
      (delta << TIMESTAMP_SHIFT) |
      (this.datacenterId << DATACENTER_SHIFT) |
      (this.workerId << WORKER_SHIFT) |
      this.sequence;

    return id.toString();
  }

  nextIds(count: number): string[] {
    if (!Number.isSafeInteger(count) || count < 1) {
      throw new SnowflakeError('count must be a positive safe integer.');
    }

    return Array.from({ length: count }, () => this.nextId());
  }

  private waitNextMillis(lastTimestamp: bigint): bigint {
    let timestamp = BigInt(Date.now());
    while (timestamp <= lastTimestamp) {
      timestamp = BigInt(Date.now());
    }
    return timestamp;
  }
}

export function generateSnowflakeIds(options: GenerateOptions = {}): GeneratedSnowflakeId[] {
  const count = options.count ?? 1;
  const generator = new SnowflakeGenerator(options);
  return generator.nextIds(count).map((id) => parseSnowflakeId(id, options));
}

export function parseSnowflakeId(id: bigint | number | string, options: SnowflakeOptions = {}): ParsedSnowflakeId {
  const normalizedId = normalizeBoundedInteger(id, 'id', 0n, MAX_ID);
  const epoch = normalizeInteger(options.epoch ?? DEFAULT_EPOCH, 'epoch');

  const timestamp = (normalizedId >> TIMESTAMP_SHIFT) + epoch;
  const datacenterId = (normalizedId >> DATACENTER_SHIFT) & MAX_DATACENTER_ID;
  const workerId = (normalizedId >> WORKER_SHIFT) & MAX_WORKER_ID;
  const sequence = normalizedId & MAX_SEQUENCE;
  const timestampNumber = Number(timestamp);

  if (!Number.isSafeInteger(timestampNumber)) {
    throw new SnowflakeError('Parsed timestamp is outside the JavaScript safe integer range.');
  }

  return {
    id: normalizedId.toString(),
    timestamp: timestampNumber,
    date: new Date(timestampNumber).toISOString(),
    epoch: epoch.toString(),
    datacenterId: Number(datacenterId),
    workerId: Number(workerId),
    sequence: Number(sequence),
  };
}

export function normalizeInteger(value: bigint | number | string, name: string): bigint {
  if (typeof value === 'bigint') {
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) {
      throw new SnowflakeError(`${name} must be a safe integer.`);
    }
    return BigInt(value);
  }

  const trimmed = value.trim();
  if (!/^-?\d+$/.test(trimmed)) {
    throw new SnowflakeError(`${name} must be an integer.`);
  }

  return BigInt(trimmed);
}

export function normalizeBoundedInteger(
  value: bigint | number | string,
  name: string,
  min: bigint,
  max: bigint,
): bigint {
  const normalized = normalizeInteger(value, name);
  if (normalized < min || normalized > max) {
    throw new SnowflakeError(`${name} must be between ${min.toString()} and ${max.toString()}.`);
  }
  return normalized;
}
