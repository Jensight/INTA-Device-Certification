# Dynamic Scheduler Controller — Code Flow Document

## Overview

The Dynamic Scheduler Controller manages the lifecycle of dynamic regression test schedules. It allows scheduling jobs across multiple DUTs (Devices Under Test) paired with client devices, tracks their execution state, and integrates with the regression and execution pipeline.

---

## Dependencies
.
| Dependency | Purpose |
|---|---|
| `../errors` | Standardized error codes (`SCHEDULE_ERROR`, `FETCH_ERROR`, `UPDATE_ERROR`) |
| `../utils/logger` | Info/debug logging |
| `../utils/errorLogger` | Error-level logging |
| `../model/dynamicSchedulerModel` | DB operations: insert, fetch, update, cancel schedules |
| `../model/regressionModel` | `testbedDetailsForCheckTestbed` — fetches testbed node layout |
| `./regression.controllers` | `checkTestbedAvailibility`, `getTestCase` — pre-execution checks |
| `./execution.controller` | `startExecution` — triggers actual test run |
| `../utils/mongodb` | MongoDB client reference |

---

## Route → Controller Mapping

Defined in `server/routes/dynamicScheduler.js`. All routes are prefixed with `/:teamName/dynamicScheduler/` and require `authAPI.verifyAuthToken`.

| Method | Route | Controller Function |
|---|---|---|
| `POST` | `/schedule/` | `scheduleDynamic` |
| `GET` | `/all/` | `getAllDynamicSchedules` |
| `GET` | `/:id` | `getDynamicScheduleById` |
| `PUT` | `/status/:id` | `updateDynamicScheduleStatus` |
| `DELETE` | `/cancel/:id` | `cancelDynamicSchedule` |

---

## Function-by-Function Code Flow

---

### 1. `scheduleDynamic` — `POST /schedule/`

```
Request received
    │
    ├─ Build collection name: `{teamName}_DynamicScheduler`
    ├─ Generate unique ID: `DYNSCHED_{timestamp}`
    ├─ Generate tag name: `{profileName}_dyn_{timestamp}` (spaces → underscores)
    │
    ├─ Build schedule document:
    │       dynamicSchedulerRequestId, dynamicRegressionTagName
    │       dynamicTestbedId, dynamicTestbedProfileId/Name
    │       duts[]    → { deviceId, deviceName, modelName, nodeId, run_id, runStatus: "inqueue" }
    │       clients[] → { deviceId, deviceName, nodeId }
    │       job[], userId, run_id, tagName
    │       startTime, dynamicScheduleStartTime
    │       dynamicScheduleStatus: "Scheduled"
    │       createdAt
    │
    ├─ insertSchedule() → persists document to DB
    │
    ├─ If duts.length > 0 AND clients.length > 0:
    │       For each (duts[i], clients[i]) pair:
    │           └─ buildDynamicJobRequest() → construct req-like object
    │
    │       Promise.all over all pairedRequests:
    │           └─ regression.checkTestbedAvailibility()
    │               └─ regression.getTestCase()
    │                   └─ execution.startExecution()
    │                       └─ log: "execution started"
    │
    └─ Response 200: { status, _id, dynamicSchedulerRequestId,
                       dynamicRegressionTagName, dynamicScheduleStatus,
                       message }

    On error → Response 500: SCHEDULE_ERROR
```

**Key behavior:** DUTs and clients are paired by index (`duts[0]↔clients[0]`, `duts[1]↔clients[1]`, etc.). All pairs are launched in parallel via `Promise.all`.

---

### 2. `getAllDynamicSchedules` — `GET /all/`

```
Request received
    │
    ├─ Build collection name: `{teamName}_DynamicScheduler`
    ├─ getAllSchedules() → fetches all documents from collection
    ├─ Log count of fetched schedules
    └─ Response 200: array of schedule documents

    On error → Response 500: FETCH_ERROR
```

---

### 3. `getDynamicScheduleById` — `GET /:id`

```
Request received
    │
    ├─ Build collection name: `{teamName}_DynamicScheduler`
    ├─ getScheduleById(id) → fetch single document
    │
    ├─ If not found → Response 404: "Dynamic Schedule not found."
    └─ Response 200: schedule document

    On error → Response 500: FETCH_ERROR
```

---

### 4. `updateDynamicScheduleStatus` — `PUT /status/:id`

```
Request received
    │
    ├─ Validate req.body.dynamicScheduleStatus
    │   Valid values: ["Scheduled", "InProgress", "Completed", "Cancelled"]
    │   If invalid → Response 400: "Invalid status..."
    │
    ├─ updateScheduleStatus(id, newStatus) → updates DB document
    ├─ Log: "status updated to {newStatus}"
    └─ Response 200: { status: true, message }

    On error → Response 500: UPDATE_ERROR
```

---

### 5. `cancelDynamicSchedule` — `DELETE /cancel/:id`

```
Request received
    │
    ├─ Build collection name: `{teamName}_DynamicScheduler`
    ├─ cancelSchedule(id) → marks schedule as cancelled in DB
    ├─ Log: "Schedule {id} cancelled"
    └─ Response 200: { status: true, message }

    On error → Response 500: UPDATE_ERROR
```

---

### 6. `fetchNextDutDetails` — Internal (called by execution callback)

This is the **re-scheduling engine** that assigns the next available DUT to a client after the previous run completes.

```
Called with: (teamName, username, dbType, client, collectionName, tagName, clientId)
    │
    ├─ getScheduleByTagName(tagName) → fetch schedule document
    │   If not found → return { status: false, message }
    │
    ├─ Filter pendingDuts: duts where run_id == null AND runStatus == "inqueue"
    │
    ├─ If pendingDuts is empty:
    │   └─ Log: "All DUTs already have run_id" → (no-op, all done)
    │
    └─ Else:
        ├─ Check if this client already has a DUT in "processing" or "inqueue"
        │   (clientPendingDut = duts.find where clientId matches AND
        │    runStatus is "processing" or "inqueue")
        │
        ├─ If clientPendingDut exists:
        │   └─ Log: "Client already has DUT in progress" → return (skip)
        │
        └─ Else (client is free):
            ├─ Pick first pending DUT: pendingDuts[0]
            ├─ updateDutRunId(tagName, dut.deviceId, null, "processing", clientId)
            │   → marks DUT as being processed by this client
            │
            └─ setTimeout(5000ms delay):
                ├─ buildDynamicJobRequest(null, schedule, dut, clientDetails,
                │                          teamName, username, dbType, client)
                └─ regression.checkTestbedAvailibility()
                    └─ regression.getTestCase()
                        └─ execution.startExecution()
                            └─ Log: "execution started for DUT: {deviceId}"
```

**Key behavior:** The 5-second delay ensures the `run_id` update is persisted before the next execution begins. A no-op `res` object is used since this is an internal (non-HTTP) invocation.

---

### 7. `buildDynamicJobRequest` — Private Helper

Constructs a synthetic `req`-like object that mimics an HTTP request, so it can be passed directly into `regression.checkTestbedAvailibility`, `regression.getTestCase`, and `execution.startExecution`.

```
Inputs: (reqOriginal | null, document, dutDetails, clientDetails,
          teamName, username, dbType, client)
    │
    ├─ Clone req (or build from scratch if null)
    ├─ Remove duts[] and clients[] arrays from document (prevent circular data)
    ├─ Populate req.params.teamName, req.query.username
    ├─ Populate req.app.locals.dbType, req.app.locals.client
    │
    ├─ Attach dynamic context to req.body:
    │       dynamicTagName, dynamicRegressionTagName
    │       dynamicDutDeviceId, dynamicClientDeviceId
    │       dut, client, username, userId
    │
    ├─ Generate per-DUT tagName:
    │       format: {deviceName}_{fwVersion}_{modulePrefix}_DYN
    │       (spaces → underscores, fwVersion defaults to "_NA")
    │
    ├─ Set job[0].numOfIteration = 1
    ├─ Compute job[0].estimatedEndTime = now + timeRequired(mins) * 60000ms
    │
    ├─ Deep-clone req → reqCopy
    │
    ├─ testbedDetailsForCheckTestbed() → fetch testbed node layout from DB
    ├─ Find dutNodeIndex  by dutDetails.nodeId  in testbed.nodes[]
    ├─ Find clientNodeIndex by clientDetails.nodeId in testbed.nodes[]
    ├─ Assign dutDetails.deviceId    → testbed.nodes[dutNodeIndex].deviceId
    ├─ Assign clientDetails.deviceId → testbed.nodes[clientNodeIndex].deviceId
    ├─ Set testbed.dutId = dutDetails.deviceId
    ├─ Set job[0].modelName = dutDetails.modelName
    ├─ Set job[0].clientId  = clientDetails.deviceId
    ├─ Attach reqCopy.body.job[0].testbedDyn = testbed
    │
    └─ Return reqCopy
```

---

## State Machine — `dynamicScheduleStatus`

```
               ┌──────────────┐
    POST /     │              │
  schedule/ ──►│  Scheduled   │
               │              │
               └──────┬───────┘
                       │  PUT /status/:id
                       ▼
               ┌──────────────┐
               │  InProgress  │
               └──────┬───────┘
                       │
              ┌────────┴────────┐
              ▼                 ▼
     ┌──────────────┐   ┌──────────────┐
     │  Completed   │   │  Cancelled   │◄── DELETE /cancel/:id
     └──────────────┘   └──────────────┘
```

---

## DUT Run Status Flow (per device)

```
"inqueue"  →  (assigned to client)  →  "processing"  →  (completion callback)  →  "inqueue" (next DUT)
                                                                                or schedule complete
```

---

## Execution Pipeline (shared across `scheduleDynamic` and `fetchNextDutDetails`)

```
buildDynamicJobRequest()
        │
        ▼
regression.checkTestbedAvailibility()   ← verifies testbed is free
        │
        ▼
regression.getTestCase()                ← resolves test cases for the job
        │
        ▼
execution.startExecution()              ← triggers actual test execution
        │
        ▼
    [log success]
```

---

## Error Handling Summary

All exported functions follow the same pattern:

- **HTTP errors** (400, 404) are returned inline with descriptive messages.
- **Unexpected errors** are caught in `try/catch`, logged via `errLogger.error`, and returned as `500` with a standardized error structure: `{ status, errorCode, message, errorDetail, type }`.
- Internal function `fetchNextDutDetails` returns a plain object `{ status: false, message }` on logical failures (no `res` object available).
