# snowflake-id-cli

[English](./README.md)

从命令行生成和解析 Snowflake ID。这个包适合直接通过 `npx` 调用，也适合 Agent 和脚本集成。

## 功能

- 生成单个或批量 Snowflake ID。
- 解析 ID 得到 timestamp、ISO date、datacenter ID、worker ID 和 sequence。
- 内部使用 `bigint`，避免 64-bit ID 被截断。
- 支持 plain、table、JSON 和 NDJSON 输出。
- 支持从参数、文件或 stdin 读取 ID。
- 参数帮助清晰，非法输入会返回非 0 退出码。

## 使用

无需安装即可运行：

```bash
npx snowflake-id-cli generate
```

批量生成：

```bash
npx snowflake-id-cli generate --count 10
```

生成 JSON 输出：

```bash
npx snowflake-id-cli generate --count 3 --datacenter-id 1 --worker-id 2 --json
```

解析 ID：

```bash
npx snowflake-id-cli parse 512409557714321408
```

从 stdin 批量解析并输出 NDJSON：

```bash
printf '512409557714321408\n512409557714321409\n' | npx snowflake-id-cli parse --format ndjson
```

使用自定义 epoch：

```bash
npx snowflake-id-cli generate --epoch 1577836800000
npx snowflake-id-cli parse 512409557714321408 --epoch 1577836800000
```

## 命令

### `generate`

```text
Usage: snowflake-id generate|gen [options]

Options:
  -c, --count <number>      number of IDs to generate
  --epoch <ms>              custom epoch in milliseconds
  --datacenter-id <id>      datacenter ID from 0 to 31
  --worker-id <id>          worker ID from 0 to 31
  -f, --format <format>     output format: plain, table, json, or ndjson
  --json                    shortcut for --format json
```

### `parse`

```text
Usage: snowflake-id parse [options] [ids...]

Options:
  -i, --input <path>        read whitespace-separated IDs from a file
  --epoch <ms>              custom epoch in milliseconds
  -f, --format <format>     output format: plain, table, json, or ndjson
  --json                    shortcut for --format json
```

## 输出字段

| 字段 | 说明 |
| --- | --- |
| `id` | 字符串形式的 Snowflake ID |
| `timestamp` | Unix 毫秒时间戳 |
| `date` | ISO 8601 时间 |
| `epoch` | 解析时使用的 epoch |
| `datacenterId` | 数据中心 ID |
| `workerId` | 工作节点 ID |
| `sequence` | 毫秒内序列号 |

## 默认值

- Epoch：`1288834974657`（`2010-11-04T01:42:54.657Z`）
- Datacenter ID：`0`
- Worker ID：`0`

## 开发

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## 发布

发布由 GitHub Actions 和 npm Trusted Publisher 处理。

发布前，需要先在 npm 为这个包和仓库配置 Trusted Publisher。之后推送版本 tag 或手动运行 workflow：

```bash
git tag v0.1.0
git push origin v0.1.0
```

发布 workflow 也支持 `workflow_dispatch` 手动触发。

## License

MIT
