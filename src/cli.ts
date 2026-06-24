import { Command, InvalidArgumentError } from 'commander';
import { readFileSync } from 'node:fs';
import { formatRecords, type OutputFormat } from './format.js';
import {
  DEFAULT_DATACENTER_ID,
  DEFAULT_EPOCH,
  DEFAULT_WORKER_ID,
  generateSnowflakeIds,
  parseSnowflakeId,
  SnowflakeError,
} from './snowflake.js';

interface CommonCliOptions {
  epoch?: string;
  format?: OutputFormat;
  json?: boolean;
}

interface GenerateCliOptions extends CommonCliOptions {
  count: number;
  datacenterId?: string;
  workerId?: string;
}

interface ParseCliOptions extends CommonCliOptions {
  input?: string;
}

const program = new Command();

program
  .name('snowflake-id')
  .description('Generate and parse Snowflake IDs from the command line.')
  .version('0.1.0');

program
  .command('generate')
  .alias('gen')
  .description('Generate one or more Snowflake IDs.')
  .option('-c, --count <number>', 'number of IDs to generate', parsePositiveInteger, 1)
  .option('--epoch <ms>', 'custom epoch in milliseconds', DEFAULT_EPOCH.toString())
  .option('--datacenter-id <id>', 'datacenter ID from 0 to 31', DEFAULT_DATACENTER_ID.toString())
  .option('--worker-id <id>', 'worker ID from 0 to 31', DEFAULT_WORKER_ID.toString())
  .option('-f, --format <format>', 'output format: table, json, or ndjson', parseFormat, 'table')
  .option('--json', 'shortcut for --format json')
  .action((options: GenerateCliOptions) => {
    run(() => {
      const format = resolveFormat(options);
      const records = generateSnowflakeIds({
        count: options.count,
        epoch: options.epoch ?? DEFAULT_EPOCH,
        datacenterId: options.datacenterId ?? DEFAULT_DATACENTER_ID,
        workerId: options.workerId ?? DEFAULT_WORKER_ID,
      });
      writeOutput(formatRecords(records, format));
    });
  });

program
  .command('parse')
  .description('Parse Snowflake IDs from arguments or stdin.')
  .argument('[ids...]', 'IDs to parse. Reads whitespace-separated IDs from stdin when omitted.')
  .option('-i, --input <path>', 'read whitespace-separated IDs from a file')
  .option('--epoch <ms>', 'custom epoch in milliseconds', DEFAULT_EPOCH.toString())
  .option('-f, --format <format>', 'output format: table, json, or ndjson', parseFormat, 'table')
  .option('--json', 'shortcut for --format json')
  .action((ids: string[], options: ParseCliOptions) => {
    run(() => {
      const inputIds = collectIds(ids, options.input);
      if (inputIds.length === 0) {
        throw new SnowflakeError('No IDs provided. Pass IDs as arguments, use --input, or pipe IDs through stdin.');
      }

      const records = inputIds.map((id) => parseSnowflakeId(id, { epoch: options.epoch ?? DEFAULT_EPOCH }));
      writeOutput(formatRecords(records, resolveFormat(options)));
    });
  });

program.showHelpAfterError();
program.parseAsync(process.argv).catch((error: unknown) => {
  handleError(error);
});

function collectIds(args: string[], inputPath: string | undefined): string[] {
  const values = [...args];

  if (inputPath) {
    values.push(...splitInput(readFileSync(inputPath, 'utf8')));
  }

  if (values.length === 0 && !process.stdin.isTTY) {
    values.push(...splitInput(readFileSync(0, 'utf8')));
  }

  return values;
}

function splitInput(input: string): string[] {
  return input.split(/\s+/).filter(Boolean);
}

function parsePositiveInteger(value: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new InvalidArgumentError('must be a positive safe integer');
  }
  return parsed;
}

function parseFormat(value: string): OutputFormat {
  if (value === 'table' || value === 'json' || value === 'ndjson') {
    return value;
  }
  throw new InvalidArgumentError('must be table, json, or ndjson');
}

function resolveFormat(options: CommonCliOptions): OutputFormat {
  return options.json ? 'json' : (options.format ?? 'table');
}

function run(callback: () => void): void {
  try {
    callback();
  } catch (error) {
    handleError(error);
  }
}

function handleError(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Error: ${message}\n`);
  process.exit(1);
}

function writeOutput(output: string): void {
  process.stdout.write(`${output}\n`);
}
