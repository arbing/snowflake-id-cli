import type { ParsedSnowflakeId } from './snowflake.js';

export type OutputFormat = 'plain' | 'table' | 'json' | 'ndjson';

export function formatRecords(records: ParsedSnowflakeId[], format: OutputFormat): string {
  switch (format) {
    case 'plain':
      return records.map((record) => record.id).join('\n');
    case 'json':
      return JSON.stringify(records, null, 2);
    case 'ndjson':
      return records.map((record) => JSON.stringify(record)).join('\n');
    case 'table':
      return formatTable(records);
    default: {
      const unreachable: never = format;
      return unreachable;
    }
  }
}

export function formatTable(records: ParsedSnowflakeId[]): string {
  if (records.length === 0) {
    return '';
  }

  const columns = [
    ['id', 'ID'],
    ['timestamp', 'Timestamp'],
    ['date', 'Date'],
    ['datacenterId', 'Datacenter'],
    ['workerId', 'Worker'],
    ['sequence', 'Sequence'],
  ] as const;

  const rows = records.map((record) => columns.map(([key]) => String(record[key])));
  const headers = columns.map(([, label]) => label);
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...rows.map((row) => row[index]?.length ?? 0)),
  );

  const renderRow = (values: readonly string[]) =>
    values.map((value, index) => value.padEnd(widths[index] ?? 0)).join('  ');

  return [renderRow(headers), renderRow(widths.map((width) => '-'.repeat(width))), ...rows.map(renderRow)].join('\n');
}
