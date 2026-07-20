# REST API Reference

The `drift-server` daemon provides a REST API to manage workspaces, upload state files, execute drift scans, and inspect reports.

---

## Authentication

If `api.api_key` is set in `driftctl.yaml`, all endpoints except `/health`, `/`, and `/static/*` require authentication.

Send your API key using either of the following headers:
- `X-API-Key: <your-api-key>`
- `Authorization: Bearer <your-api-key>`

---

## Endpoints

### Health Check

#### `GET /health`
Returns the status of the server. Unauthenticated.

**Response (`200 OK`)**:
```json
{
  "status": "ok"
}
```

---

### Workspaces

#### `GET /api/v1/workspaces`
Lists all registered workspaces.

**Response (`200 OK`)**:
```json
[
  {
    "id": "640be4be-7d41-4fe2-99aa-6d919451dd35",
    "name": "production",
    "provider": "aws",
    "state": {
      "backend": "local",
      "path": "statefiles/640be4be-7d41-4fe2-99aa-6d919451dd35/state_1784209882.json"
    },
    "regions": ["us-east-1"],
    "compare": {
      "ignore_tags": ["driftctl_scan"]
    },
    "schedule": {
      "cron": "0 */6 * * *"
    }
  }
]
```

#### `POST /api/v1/workspaces`
Creates a new workspace.

**Request Body**:
```json
{
  "name": "staging",
  "provider": "aws",
  "state": {
    "backend": "local",
    "path": ""
  },
  "regions": ["us-east-1"],
  "compare": {
    "ignore_tags": ["Environment"]
  },
  "schedule": {
    "cron": "0 0 * * *"
  }
}
```

**Response (`201 Created`)**:
Returns the created workspace object with a server-assigned `id`.

#### `GET /api/v1/workspaces/{id}`
Retrieves a specific workspace configuration by ID.

**Response (`200 OK`)**:
Returns the workspace object. Returns `404 Not Found` if the workspace does not exist.

#### `DELETE /api/v1/workspaces/{id}`
Deletes a workspace and unregisters any associated cron schedules.

**Response (`204 No Content`)**: Empty body.

---

### State File Upload

#### `POST /api/v1/workspaces/{id}/state`
Uploads a Terraform state file for a workspace.

- **Content-Type**: `multipart/form-data`
- **Field Name**: `state`
- **Supported File Extensions**: `.tfstate`, `.json`
- **Maximum File Size**: 20MB

The file is validated for JSON syntax, written atomically to disk, and the workspace state path is updated.

**Response (`200 OK`)**:
```json
{
  "workspace_id": "640be4be-7d41-4fe2-99aa-6d919451dd35",
  "uploaded_at": "2026-07-20T15:00:00Z",
  "status": "success"
}
```

---

### Drift Scans

#### `POST /api/v1/workspaces/{id}/scans`
Triggers an immediate drift scan for the specified workspace.

**Response (`200 OK` or `202 Accepted`)**:
Returns the full scan report object containing drift findings.

#### `GET /api/v1/workspaces/{id}/scans`
Lists previous scan runs for a specific workspace.

- **Query Parameters**: `limit` (default: 50)

**Response (`200 OK`)**: List of scan summaries.

#### `GET /api/v1/scans`
Lists all scan runs across all workspaces.

- **Query Parameters**: `limit` (default: 50)

**Response (`200 OK`)**: List of scan summaries.

#### `GET /api/v1/scans/{id}`
Retrieves details for a specific scan ID.

**Response (`200 OK`)**: Returns the full scan report object.

#### `GET /api/v1/scans/{id}/report`
Returns a formatted drift report.

- **Query Parameters**: `format` (`json` or `table`, default: `json`)

**Response (`200 OK`)**:
- Text table or JSON payload depending on the `format` query parameter.

---

### Schedules

#### `PUT /api/v1/workspaces/{id}/schedules`
Upserts a cron schedule for automatic drift scanning.

**Request Body**:
```json
{
  "cron": "0 */6 * * *"
}
```

**Response (`200 OK`)**:
```json
{
  "workspace_id": "640be4be-7d41-4fe2-99aa-6d919451dd35",
  "cron": "0 */6 * * *"
}
```

#### `DELETE /api/v1/workspaces/{id}/schedules`
Removes a cron schedule from a workspace.

**Response (`204 No Content`)**: Empty body.
