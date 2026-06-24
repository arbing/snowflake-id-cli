import { describe, expect, it, vi } from 'vitest';
import { generateSnowflakeIds, parseSnowflakeId, SnowflakeError, SnowflakeGenerator } from '../src/snowflake.js';

describe('SnowflakeGenerator', () => {
  it('generates IDs that parse back to their parts', () => {
    const generator = new SnowflakeGenerator({ epoch: 1_577_836_800_000, datacenterId: 3, workerId: 7 });
    const id = generator.nextId(1_700_000_000_000);

    expect(parseSnowflakeId(id, { epoch: 1_577_836_800_000 })).toMatchObject({
      id,
      timestamp: 1_700_000_000_000,
      datacenterId: 3,
      workerId: 7,
      sequence: 0,
    });
  });

  it('generates unique sequence values within the same millisecond', () => {
    const generator = new SnowflakeGenerator({ epoch: 1_577_836_800_000 });
    const ids = Array.from({ length: 10 }, () => generator.nextId(1_700_000_000_000));

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.map((id) => parseSnowflakeId(id).sequence)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('waits for the next millisecond after sequence overflow', () => {
    const generator = new SnowflakeGenerator();
    const nowSpy = vi.spyOn(Date, 'now');

    for (let index = 0; index < 4096; index += 1) {
      generator.nextId(1_700_000_000_000);
    }

    nowSpy.mockReturnValueOnce(1_700_000_000_000).mockReturnValueOnce(1_700_000_000_001);
    const overflowId = generator.nextId(1_700_000_000_000);

    expect(parseSnowflakeId(overflowId)).toMatchObject({
      timestamp: 1_700_000_000_001,
      sequence: 0,
    });
    nowSpy.mockRestore();
  });

  it('rejects invalid worker IDs', () => {
    expect(() => new SnowflakeGenerator({ workerId: 32 })).toThrow(SnowflakeError);
  });

  it('rejects clock rollback', () => {
    const generator = new SnowflakeGenerator();
    generator.nextId(1_700_000_000_000);

    expect(() => generator.nextId(1_699_999_999_999)).toThrow('Clock moved backwards');
  });
});

describe('generateSnowflakeIds', () => {
  it('generates parsed records', () => {
    const records = generateSnowflakeIds({ count: 2, datacenterId: 1, workerId: 2 });

    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({ datacenterId: 1, workerId: 2 });
    expect(records[0]?.id).toEqual(expect.any(String));
  });
});

describe('parseSnowflakeId', () => {
  it('rejects non-integer IDs', () => {
    expect(() => parseSnowflakeId('abc')).toThrow('id must be an integer');
  });

  it('rejects IDs outside the signed 63-bit range', () => {
    expect(() => parseSnowflakeId((1n << 63n).toString())).toThrow('id must be between');
  });
});
