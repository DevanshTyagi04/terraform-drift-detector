# CLI Reference

The `driftctl` command-line tool allows executing scans, viewing reports, and managing workspaces directly from the terminal.

---

## Global Flags

```
  --config string   path to driftctl.yaml configuration file
  -h, --help        help for driftctl
```

---

## Commands

### `driftctl scan`

Executes a drift scan against a local state file, S3 backend, or an existing saved workspace.

#### Flags

```
  --workspace string      Workspace name (loads configuration from database)
  --state string          Path to local terraform.tfstate file
  --provider string       Cloud provider (default: "aws")
  --region strings        Target cloud regions (repeatable, e.g., --region us-east-1)
  --output string         Output format: table | json (default: "table")
  --skip-cloud            Skip cloud fetch phase (state-only check for offline testing)
  --state-bucket string   S3 bucket name containing terraform state
  --state-key string      S3 object key for terraform state
  --state-region string   AWS region for S3 state bucket
```

#### Examples

Scan using a local state file:
```bash
driftctl scan --state ./terraform.tfstate --provider aws --region us-east-1
```

Scan using an S3 backend state file:
```bash
driftctl scan --state-bucket my-tf-state --state-key prod/terraform.tfstate --state-region us-east-1
```

Scan an existing workspace saved in the database:
```bash
driftctl scan --workspace production --output table
```

Exit codes:
- `0`: Scan completed with zero drift detected.
- `1`: Scan completed and infrastructure drift was detected.
- `2`: Execution error (invalid flags, store connection failure).

---

### `driftctl report`

Displays a previously executed scan report by ID.

```bash
driftctl report <scan-id> [flags]
```

#### Flags

```
  --output string   Output format: table | json (default: "table")
```

#### Example

```bash
driftctl report 640be4be-7d41-4fe2-99aa-6d919451dd35 --output json
```

---

### `driftctl workspace`

Subcommands for inspecting workspaces.

#### Subcommands

##### `driftctl workspace list`

Lists all workspaces saved in the SQLite database formatted as JSON.

```bash
driftctl workspace list
```

---

### `driftctl schedule`

Subcommands for configuring recurring scan schedules.

#### Subcommands

##### `driftctl schedule create`

Creates or updates a cron schedule for a workspace.

```bash
driftctl schedule create --workspace <name> --cron <cron-expression>
```

#### Flags

```
  --workspace string   Workspace name (required)
  --cron string        Standard 5-field cron expression (required)
```

#### Example

```bash
driftctl schedule create --workspace production --cron "0 */6 * * *"
```
