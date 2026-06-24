# snowflake-id-cli

[简体中文](./README.zh-CN.md)

Generate and parse Snowflake IDs from the command line. The package is designed for direct `npx` usage and for agent-friendly scripting.

## Features

- Generate one or many Snowflake IDs.
- Parse IDs into timestamp, ISO date, datacenter ID, worker ID, and sequence.
- Uses `bigint` internally so 64-bit IDs are not truncated.
- Supports table, JSON, and NDJSON output.
- Reads IDs from arguments, files, or stdin.
- Clear help text and non-zero exit codes for invalid input.

## Usage

Run without installing:

```bash
npx snowflake-id-cli generate
```

Generate multiple IDs:

```bash
npx snowflake-id-cli generate --count 10
```

Generate JSON output:

```bash
npx snowflake-id-cli generate --count 3 --datacenter-id 1 --worker-id 2 --json
```

Parse an ID:

```bash
npx snowflake-id-cli parse 512409557714321408
```

Parse IDs from stdin as NDJSON:

```bash
printf '512409557714321408\n512409557714321409\n' | npx snowflake-id-cli parse --format ndjson
```

Use a custom epoch:

```bash
npx snowflake-id-cli generate --epoch 1577836800000
npx snowflake-id-cli parse 512409557714321408 --epoch 1577836800000
```

## Commands

### `generate`

```text
Usage: snowflake-id generate|gen [options]

Options:
  -c, --count <number>      number of IDs to generate
  --epoch <ms>              custom epoch in milliseconds
  --datacenter-id <id>      datacenter ID from 0 to 31
  --worker-id <id>          worker ID from 0 to 31
  -f, --format <format>     output format: table, json, or ndjson
  --json                    shortcut for --format json
```

### `parse`

```text
Usage: snowflake-id parse [options] [ids...]

Options:
  -i, --input <path>        read whitespace-separated IDs from a file
  --epoch <ms>              custom epoch in milliseconds
  -f, --format <format>     output format: table, json, or ndjson
  --json                    shortcut for --format json
```

## Output fields

| Field | Description |
| --- | --- |
| `id` | Snowflake ID as a string |
| `timestamp` | Unix timestamp in milliseconds |
| `date` | ISO 8601 date |
| `epoch` | Epoch used for parsing |
| `datacenterId` | Datacenter ID |
| `workerId` | Worker ID |
| `sequence` | Per-millisecond sequence |

## Defaults

- Epoch: `1577836800000` (`2020-01-01T00:00:00.000Z`)
- Datacenter ID: `0`
- Worker ID: `0`

## Development

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Publishing

Publishing is handled by GitHub Actions with npm Trusted Publisher.

Before publishing, configure npm Trusted Publisher for this package and repository in npm. Then push a version tag or run the workflow manually:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The publish workflow also supports `workflow_dispatch`.

## License

MIT
