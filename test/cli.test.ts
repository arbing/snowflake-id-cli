import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const CLI = ['tsx', 'src/cli.ts'];

function runCli(args: string[], input?: string): string {
  return execFileSync(CLI[0]!, [...CLI.slice(1), ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    input,
  });
}

describe('CLI', () => {
  it('prints command help', () => {
    const output = runCli(['--help']);

    expect(output).toContain('Generate and parse Snowflake IDs');
    expect(output).toContain('generate');
    expect(output).toContain('parse');
  });

  it('generates plain IDs by default', () => {
    const output = runCli(['generate', '--count', '2']);
    const ids = output.trim().split('\n');

    expect(ids).toHaveLength(2);
    expect(ids[0]).toMatch(/^\d+$/);
    expect(ids[1]).toMatch(/^\d+$/);
  });

  it('parses plain IDs by default', () => {
    const generated = JSON.parse(runCli(['generate', '--json'])) as Array<{ id: string }>;
    const output = runCli(['parse', generated[0]!.id]);

    expect(output.trim()).toBe(generated[0]!.id);
  });

  it('generates JSON output', () => {
    const output = runCli(['generate', '--count', '2', '--datacenter-id', '1', '--worker-id', '2', '--json']);
    const records = JSON.parse(output) as Array<{ id: string; datacenterId: number; workerId: number }>;

    expect(records).toHaveLength(2);
    expect(records[0]?.id).toEqual(expect.any(String));
    expect(records[0]).toMatchObject({ datacenterId: 1, workerId: 2 });
  });

  it('parses IDs from stdin as NDJSON', () => {
    const generated = JSON.parse(runCli(['generate', '--json'])) as Array<{ id: string }>;
    const output = runCli(['parse', '--format', 'ndjson'], `${generated[0]!.id}\n`);
    const parsed = JSON.parse(output) as { id: string };

    expect(parsed.id).toBe(generated[0]!.id);
  });
});
