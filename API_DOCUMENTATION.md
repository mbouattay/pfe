# API Documentation

Base URL: http://localhost:3000/api

Authentication
- Scheme: Bearer JWT
- Obtain token: POST /auth/login
- Header: Authorization: Bearer <token>
- All endpoints require JWT unless explicitly marked public.
- Only POST /auth/login is public.

Global Response Format
- Success: Native JSON resources
- Errors (NestJS style):
  - { "message": "...", "error": "...", "statusCode": 400 }

------------------------------------------------------------------------

Authentication Module

1) Login

Endpoint
METHOD /route/path
POST /auth/login

Description
Authenticates a user and returns a JWT access token.

Authentication
Not Required

Request
Headers
- Content-Type: application/json

Body
{ "email": "string", "password": "string" }

Fields Explanation
- email | string | Yes | User email
- password | string | Yes | User password

Response
Success Response
Status Code: 200 OK
Example Body
{ "access_token": "jwt-token" }

Error Responses
- 400 | Validation error | { "message": "Invalid data" }
- 401 | Unauthorized | { "message": "Unauthorized" }

Business Logic Notes
- Token must be sent in Authorization header for protected endpoints.

------------------------------------------------------------------------

Chat Module

1) List Conversations

Endpoint
GET /chat/conversations

Description
Lists conversations the authenticated user participates in.

Authentication
Required — Authorization: Bearer

Request
Headers
- Authorization: Bearer <token>

Response
Status Code: 200 OK
Example Body
[
  {
    "id": "conv_1",
    "type": "DIRECT|TASK|SPRINT",
    "createdAt": "2026-02-01T10:00:00.000Z",
    "updatedAt": "2026-02-01T10:05:00.000Z",
    "lastMessageAt": "2026-02-01T10:05:00.000Z",
    "createdBy": 1,
    "participants": [{ "userId": 1, "lastReadAt": "2026-02-01T10:05:00.000Z", "isActive": true }],
    "lastMessage": { "id": "msg_x", "content": "Hello", "createdAt": "2026-02-01T10:05:00.000Z", "senderId": 1, "isEdited": false }
  }
]

Error Responses
- 401 | Unauthorized | { "message": "Unauthorized" }

2) Get/Create Direct Conversation

Endpoint
POST /chat/direct

Description
Gets or creates a direct conversation with another user.

Authentication
Required — Authorization: Bearer

Request
Headers
- Content-Type: application/json
- Authorization: Bearer <token>

Body
{ "userId": 2 }

Fields Explanation
- userId | number | Yes | Other user’s id

Response
Status Code: 200 OK
Example Body
{ "id": "conv_2", "type": "DIRECT", "participants": [ { "userId": 1 }, { "userId": 2 } ] }

Error Responses
- 401 | Unauthorized | { "message": "Unauthorized" }
- 404 | Not Found | { "message": "User not found" }

3) Get/Create Task Conversation

Endpoint
POST /chat/task/:taskId

Description
Gets or creates a conversation bound to a marketing task.

Authentication
Required — Authorization: Bearer

Request
Params
- taskId | number | Yes | Task id

Response
Status Code: 200 OK
Example Body
{ "id": "conv_t1", "type": "TASK", "taskId": 1 }

Error Responses
- 401 | Unauthorized | { "message": "Unauthorized" }
- 404 | Not Found | { "message": "Task not found" }

4) List Messages

Endpoint
GET /chat/conversations/:id/messages?cursor&limit

Description
Lists messages in a conversation (newest first).

Authentication
Required — Authorization: Bearer

Request
Params
- id | string | Yes | Conversation id
Query
- limit | number | No | Default 20
- cursor | string | No | Pagination cursor (message id)

Response
Status Code: 200 OK
Example Body
[
  {
    "id": "msg_1",
    "content": "Hello team!",
    "senderId": 1,
    "createdAt": "2026-02-01T10:00:00.000Z",
    "updatedAt": "2026-02-01T10:00:00.000Z",
    "isEdited": false,
    "replyToId": null,
    "readBy": [{ "userId": 1, "readAt": "2026-02-01T10:00:05.000Z" }]
  }
]

Error Responses
- 401 | Unauthorized | { "message": "Unauthorized" }
- 403 | Forbidden | { "message": "Not a participant" }

5) Send Message

Endpoint
POST /chat/conversations/:id/messages

Description
Sends a message in a conversation.

Authentication
Required — Authorization: Bearer

Request
Headers
- Content-Type: application/json
Params
- id | string | Yes | Conversation id
Body
{ "content": "string", "replyToId": "string?" }

Fields Explanation
- content | string | Yes | Message content
- replyToId | string | No | Message id to reply to

Response
Status Code: 201 Created
Example Body
{ "id": "msg_2", "content": "Hi!", "senderId": 2, "createdAt": "2026-02-01T10:01:00.000Z" }

Error Responses
- 401 | Unauthorized | { "message": "Unauthorized" }
- 403 | Forbidden | { "message": "Not a participant" }

6) Mark Conversation Read

Endpoint
POST /chat/conversations/:id/read

Description
Marks all messages as read for the user.

Authentication
Required — Authorization: Bearer

Response
Status Code: 200 OK
Example Body
{ "readCount": 5 }

Error Responses
- 401 | Unauthorized | { "message": "Unauthorized" }
- 403 | Forbidden | { "message": "Not a participant" }

7) Mark Conversation Unread

Endpoint
POST /chat/conversations/:id/unread

Description
Clears lastReadAt for the user in the conversation.

Authentication
Required — Authorization: Bearer

Response
Status Code: 200 OK
Example Body
{ "ok": true }

8) Edit Message

Endpoint
PATCH /chat/messages/:id

Description
Edits message content.

Authentication
Required — Authorization: Bearer

Request
Body
{ "content": "string" }

Response
Status Code: 200 OK
Example Body
{ "id": "msg_1", "content": "Edited content", "isEdited": true }

9) Delete Message

Endpoint
DELETE /chat/messages/:id

Description
Soft-deletes a message.

Authentication
Required — Authorization: Bearer

Response
Status Code: 200 OK
Example Body
{ "deleted": true }

------------------------------------------------------------------------

Calendar Module

1) Events (Range)

Endpoint
GET /calendar/events?startDate&endDate&projectId?&assigneeId?&status?&priority?&type?

Description
Returns calendar events (marketing tasks and sprint tasks) within a date range.

Authentication
Required — Authorization: Bearer

Request
Query
- startDate | ISO date | Yes | Range start
- endDate | ISO date | Yes | Range end
- projectId | number | No | Project filter
- assigneeId | number | No | Marketing tasks filter
- status | TaskStatus | No | Status filter
- priority | TaskPriority | No | Priority filter
- type | "marketing"|"web"|"all" | No | Default "all"

Response
Status Code: 200 OK
Example Body
{ "events": [ { "id": "task:1", "title": "Design", "start": "2026-03-01T00:00:00.000Z", "end": "2026-03-05T00:00:00.000Z", "allDay": true, "type": "task", "taskType": "marketing", "status": "EN_COURS", "priority": "HIGH", "assigneeId": 2, "projectId": 1, "projectName": "Brand Site", "overdue": false, "color": "#fd7e14", "url": "/tasks/1" } ], "meta": { "total": 1, "startDate": "2026-03-01T00:00:00.000Z", "endDate": "2026-03-31T00:00:00.000Z" } }

Error Responses
- 400 | Validation error | { "message": "startDate is required" }
- 401 | Unauthorized | { "message": "Unauthorized" }

Business Logic Notes
- Sprint tasks visibility is restricted to sprint participants or admins.

2) Upcoming

Endpoint
GET /calendar/upcoming?days?&includeOverdue?

Description
Returns tasks grouped by today, tomorrow, this week, next week, overdue, and noDeadline.

Authentication
Required — Authorization: Bearer

Request
Query
- days | number | No | Default 7
- includeOverdue | boolean | No | Default true

Response
Status Code: 200 OK
Example Body
{ "today": [...], "tomorrow": [...], "thisWeek": [...], "nextWeek": [...], "overdue": [...], "noDeadline": [...] }

3) Day

Endpoint
GET /calendar/day/:date

Description
Returns all events for a single day.

Authentication
Required — Authorization: Bearer

Response
Status Code: 200 OK

4) Export ICS

Endpoint
GET /calendar/export/ics?fromDate?&toDate?

Description
Exports an iCalendar (ICS) file for given range.

Authentication
Required — Authorization: Bearer

Response
Status Code: 200 OK (text/calendar)

5) Filters

Endpoint
GET /calendar/filters

Description
Returns lists of projects, assignees, statuses and priorities.

Authentication
Required — Authorization: Bearer

Response
Status Code: 200 OK

6) Reschedule Task

Endpoint
PATCH /calendar/tasks/:id/reschedule

Description
Updates a marketing task due date (dateFin).

Authentication
Required — Authorization: Bearer

Request
Body
{ "newDate": "2026-03-20T00:00:00.000Z" }

Response
Status Code: 200 OK

7) Reschedule Sprint Task

Endpoint
PATCH /calendar/sprint-tasks/:id/reschedule

Description
Reschedules a sprint task date (dateDebut proxy for due date).

Authentication
Required — Authorization: Bearer

Request
Body
{ "newDate": "2026-03-15T00:00:00.000Z" }

Response
Status Code: 200 OK

------------------------------------------------------------------------

Analytics Module

1) Dashboard Summary

Endpoint
GET /analytics/dashboard/summary?period&fromDate?&toDate?

Description
Executive summary of tasks, time and organization metrics for a period.

Authentication
Required — Authorization: Bearer

Request
Query
- period | today|week|month|custom | Yes
- fromDate | ISO | No | Custom period start
- toDate | ISO | No | Custom period end

Response
Status Code: 200 OK
Example Body
{
  "period": "month",
  "from": "2026-03-01T00:00:00.000Z",
  "to": "2026-03-31T00:00:00.000Z",
  "tasks": {
    "total": 42,
    "completed": 28,
    "pending": 14,
    "overdue": { "count": 3, "list": [] },
    "byStatus": [{ "status": "EN_COURS", "count": 10 }],
    "byPriority": [{ "priority": "HIGH", "count": 7 }],
    "completionRate": 67,
    "avgCompletionSeconds": 86400
  },
  "time": { "todaySeconds": 14400, "weekSeconds": 54000, "monthSeconds": 360000 },
  "organization": { "activeProjects": 3, "teamMembers": 8 },
  "recent": { "tasks": [], "comments": [], "files": [] },
  "assignments": [{ "userId": 2, "tasks": 6 }]
}

------------------------------------------------------------------------

Files Module

1) Upload Task Files

Endpoint
POST /files/upload/task/:taskId

Description
Uploads one or more files to a marketing task.

Authentication
Required — Authorization: Bearer

Request
Form Data
- files | file[] | Yes | One or more files

Response
Status Code: 201 Created
Example Body
[ { "id": "file_1", "filename": "spec.pdf", "mimeType": "application/pdf", "size": 12345 } ]

Error Responses
- 403 | Forbidden | { "message": "Not allowed" }

2) List Task Files

Endpoint
GET /files/task/:taskId

Authentication
Required — Authorization: Bearer

Response
Status Code: 200 OK

3) Upload Sprint Task Files

Endpoint
POST /files/upload/sprint-task/:sprintTaskId

Description
Uploads files to a sprint task; posts a summary message into sprint chat.

Authentication
Required — Authorization: Bearer

Response
Status Code: 201 Created

4) List Sprint Task Files

Endpoint
GET /files/sprint-task/:sprintTaskId

Authentication
Required — Authorization: Bearer

Response
Status Code: 200 OK

5) Upload Message Files

Endpoint
POST /files/upload/message/:messageId

Description
Uploads files attached to a message in a conversation.

Authentication
Required — Authorization: Bearer

Response
Status Code: 201 Created

6) List Conversation Files

Endpoint
GET /files/conversation/:conversationId

Authentication
Required — Authorization: Bearer

Response
Status Code: 200 OK

7) Get File Metadata

Endpoint
GET /files/:id

Authentication
Required — Authorization: Bearer

Response
Status Code: 200 OK

8) Download File

Endpoint
GET /files/:id/download

Authentication
Required — Authorization: Bearer

Response
Status Code: 200 OK (stream)

9) Preview File

Endpoint
GET /files/:id/preview

Authentication
Required — Authorization: Bearer

Response
Status Code: 200 OK (stream, inline)

10) Delete File

Endpoint
DELETE /files/:id

Authentication
Required — Authorization: Bearer

Response
Status Code: 200 OK
Example Body
{ "deleted": true }

Business Logic Notes
- Uploader or admin can delete; others denied.

------------------------------------------------------------------------

Sprints Module

1) Create Sprint

Endpoint
POST /sprints

Description
Creates a sprint and auto-creates a sprint chat with creator + admins.

Authentication
Required — Authorization: Bearer — Requires ADMIN role

Request
Body
{ "nom": "string", "status": "PLANIFIE|EN_COURS|TERMINE", "goal": "string?", "dateDebut": "ISO", "dateFin": "ISO", "webProjectId": 1 }

Response
Status Code: 201 Created
Example Body
{ "id": 1, "nom": "Sprint 1", "conversationId": "conv_s1" }

Error Responses
- 401 | Unauthorized | { "message": "Unauthorized" }
- 403 | Forbidden | { "message": "Admin only" }

2) List Sprints

Endpoint
GET /sprints

Authentication
Required — Authorization: Bearer

3) Get Sprint

Endpoint
GET /sprints/:id

Authentication
Required — Authorization: Bearer

4) Update Sprint

Endpoint
PATCH /sprints/:id

Authentication
Required — Authorization: Bearer — Requires ADMIN role

5) Delete Sprint

Endpoint
DELETE /sprints/:id

Authentication
Required — Authorization: Bearer — Requires ADMIN role

------------------------------------------------------------------------

Sprint Participants Module

1) Add Participant

Endpoint
POST /sprints/:sprintId/participants/:userId

Description
Adds a user to a sprint and to its sprint chat.

Authentication
Required — Authorization: Bearer (Admin required currently)

Request
Body
{ "role": "LEAD|MEMBER|REVIEWER?" }

Response
Status Code: 201 Created

2) Remove Participant

Endpoint
DELETE /sprints/:sprintId/participants/:userId

Description
Removes a user from sprint and sprint chat.

Authentication
Required — Authorization: Bearer (Admin required currently)

Response
Status Code: 200 OK

3) List Participants

Endpoint
GET /sprints/:sprintId/participants

Authentication
Required — Authorization: Bearer

Response
Status Code: 200 OK

4) List Sprints for User

Endpoint
GET /sprints/participants/user/:userId

Authentication
Required — Authorization: Bearer

Response
Status Code: 200 OK

Business Logic Notes
- Participants control sprint task visibility and file access.

------------------------------------------------------------------------

Sprint Tasks Module

1) Create Sprint Task

Endpoint
POST /sprint-tasks

Authentication
Required — Authorization: Bearer

Request
Body
{ "titre": "string", "status": "A_FAIRE|EN_COURS|EN_REVUE|TERMINE|BLOQUE", "priority": 1, "dateDebut": "ISO", "storyPoints": 3, "sprintId": 1 }

Response
Status Code: 201 Created

Model: SprintTask (persisted fields)
- id | number | PK
- titre | string
- status | TaskStatus
- priority | number (1 = highest)
- dateDebut | ISO date
- storyPoints | number (Fibonacci recommended)
- aiEstimatedPoints | number? | AI-estimated story points
- aiConfidence | number? | Confidence (0–1)
- aiLastAnalysis | ISO date? | Timestamp of last AI analysis
- sprintId | number | FK to Sprint

2) List Sprint Tasks

Endpoint
GET /sprint-tasks

Authentication
Required — Authorization: Bearer

3) Get Sprint Task

Endpoint
GET /sprint-tasks/:id

Authentication
Required — Authorization: Bearer

4) Update Sprint Task

Endpoint
PATCH /sprint-tasks/:id

Authentication
Required — Authorization: Bearer

5) Delete Sprint Task

Endpoint
DELETE /sprint-tasks/:id

Authentication
Required — Authorization: Bearer

6) Get Sprint Task AI Metadata

Endpoint
GET /sprint-tasks/:id/ai-metadata

Description
Returns AI estimation metadata with formatted values. Accessible to sprint participants or admins.

Authentication
Required — Authorization: Bearer

Response
Status Code: 200 OK
Example Body
{
  "aiEstimatedPoints": 5,
  "aiConfidence": 85,
  "aiLastAnalysis": "2026-03-01T10:00:00.000Z",
  "formatted": {
    "estimatedPoints": "5 points",
    "confidence": "85%",
    "lastAnalysis": "March 1, 2026",
    "analysisTimeAgo": "2 days ago"
  },
  "hasAiData": true
}

Error Responses
- 400 | Validation error | { "message": ["id must be number"] }
- 401 | Unauthorized | { "message": "Unauthorized" }
- 403 | Forbidden | { "message": "Not a sprint participant" }
- 404 | Not Found | { "message": "Sprint task not found" }

------------------------------------------------------------------------

Sprint Task Comments

1) Add Comment

Endpoint
POST /sprint-tasks/:id/comments

Authentication
Required — Authorization: Bearer

Request
Body
{ "content": "string (1–5000 chars)" }

Permissions
- Sprint participants or ADMIN only

Response
Status Code: 201 Created

2) List Comments

Endpoint
GET /sprint-tasks/:id/comments

Authentication
Required — Authorization: Bearer

Permissions
- Sprint participants or ADMIN only

Response
Status Code: 200 OK

3) Update Comment

Endpoint
PATCH /sprint-tasks/comments/:id

Authentication
Required — Authorization: Bearer

Permissions
- ADMIN can edit any comment; otherwise only the author

Response
Status Code: 200 OK

4) Delete Comment

Endpoint
DELETE /sprint-tasks/comments/:id

Authentication
Required — Authorization: Bearer

Permissions
- ADMIN can delete any comment; otherwise only the author

Response
Status Code: 200 OK
Body
{ "deleted": true }

WebSocket
- Namespace: /sprint-tasks
- Rooms: sprintTask:{id}
- Events:
  - sprintTask:comment { sprintTaskId, comment }
  - sprintTask:comment:update { commentId, updated }
  - sprintTask:comment:delete { commentId }

Notifications
- Sends TASK_COMMENT notifications to sprint participants (excluding author)

------------------------------------------------------------------------

Sprint Task Conversations

1) Create/Join Sprint Task Conversation

Endpoint
POST /chat/sprint-task/:sprintTaskId

Description
Creates a TASK-type conversation linked to a sprint task and auto-adds sprint participants. Returns the conversation object.

Authentication
Required — Authorization: Bearer

Response
Status Code: 200 OK

Notes
- First comment on a sprint task auto-creates the conversation.
- Existing chat endpoints (send, list messages, mark read) apply.

------------------------------------------------------------------------

Tasks (Marketing) Module

1) Create Task

Endpoint
POST /tasks

Authentication
Required — Authorization: Bearer

Request
Body
{ "titre": "string", "dateDebut": "ISO", "dateFin": "ISO", "marketingProjectId": 1, "priority": "LOW|MEDIUM|HIGH|URGENT?", "status": "A_FAIRE|EN_COURS|EN_REVUE|TERMINE|BLOQUE?" }

Response
Status Code: 201 Created

2) List Tasks

Endpoint
GET /tasks

Authentication
Required — Authorization: Bearer

3) Get Task

Endpoint
GET /tasks/:id

Authentication
Required — Authorization: Bearer

4) Update Task

Endpoint
PATCH /tasks/:id

Authentication
Required — Authorization: Bearer

5) Delete Task

Endpoint
DELETE /tasks/:id

Authentication
Required — Authorization: Bearer

6) Assign / Unassign

Endpoints
POST /tasks/:id/assign/:userId
DELETE /tasks/:id/assign

7) Watchers

Endpoints
POST /tasks/:id/watch
DELETE /tasks/:id/unwatch
GET /tasks/:id/watchers

8) Dependencies

Endpoints
POST /tasks/:id/dependencies
DELETE /tasks/:id/dependencies/:depId
GET /tasks/:id/dependencies
GET /tasks/:id/blocked-by

9) Comments

Endpoints
POST /tasks/:id/comments

------------------------------------------------------------------------

Web Projects Module

1) Get My Projects

Endpoint
GET /web-projects/my-projects

Description
Returns only web projects where the authenticated user is a sprint participant.
For ADMIN role, returns ALL web projects without filtering.

Authentication
Required — Authorization: Bearer

Request
Headers
- Authorization: Bearer <token>

Response
Status Code: 200 OK
Example Body
[
  {
    "id": 1,
    "project": { "id": 10, "titre": "Corporate Website", "client": { "id": 3, "nom": "Client SA" } },
    "sprints": [
      { "id": 5, "nom": "Sprint 1", "status": "EN_COURS", "dateDebut": "2026-03-01T00:00:00.000Z", "dateFin": "2026-03-15T00:00:00.000Z", "goal": "MVP", "totalStoryPoints": 21 }
    ]
  }
]

Error Responses
- 401 | Unauthorized | { "message": "Unauthorized" }

2) Get Project

Endpoint
GET /web-projects/:id

Description
Returns a single web project by id, including project details, client, and sprint summaries.

Authentication
Required — Authorization: Bearer

Request
Params
- id | number | Yes | Web project id

Response
Status Code: 200 OK
Example Body
{
  "id": 1,
  "project": { "id": 10, "titre": "Corporate Website", "client": { "id": 3, "nom": "Client SA" } },
  "sprints": [
    { "id": 5, "nom": "Sprint 1", "status": "EN_COURS", "dateDebut": "2026-03-01T00:00:00.000Z", "dateFin": "2026-03-15T00:00:00.000Z", "goal": "MVP", "totalStoryPoints": 21 }
  ]
}

Error Responses
- 401 | Unauthorized | { "message": "Unauthorized" }
- 404 | Not Found | { "message": "WebProject #<id> not found" }

------------------------------------------------------------------------

Marketing Projects Module

1) Get My Projects

Endpoint
GET /marketing-projects/my-projects

Description
Returns only marketing projects where the authenticated user is assigned to at least one task.
For ADMIN role, returns ALL marketing projects without filtering.

Authentication
Required — Authorization: Bearer

Request
Headers
- Authorization: Bearer <token>

Response
Status Code: 200 OK
Example Body
[
  {
    "id": 2,
    "project": { "id": 12, "titre": "Brand Campaign", "client": { "id": 4, "nom": "Acme Corp" } },
    "tasks": [
      { "id": 101, "titre": "Design banner", "status": "EN_COURS" }
    ]
  }
]

Error Responses
- 401 | Unauthorized | { "message": "Unauthorized" }

2) Get Project

Endpoint
GET /marketing-projects/:id

Description
Returns a single marketing project by id, including project details and client.

Authentication
Required — Authorization: Bearer

Request
Params
- id | number | Yes | Marketing project id

Response
Status Code: 200 OK
Example Body
{
  "id": 2,
  "project": { "id": 12, "titre": "Brand Campaign", "client": { "id": 4, "nom": "Acme Corp" } }
}

Error Responses
- 401 | Unauthorized | { "message": "Unauthorized" }
- 404 | Not Found | { "message": "MarketingProject #<id> not found" }

------------------------------------------------------------------------

Web Projects Module

1) Get My Projects

Endpoint
GET /web-projects/my-projects

Description
Returns only web projects where the current user is a sprint participant.

Authentication
Required — Authorization: Bearer

Response
Success Response
Status Code: 200 OK

Error Responses
- 401 | Unauthorized | { "message": "Unauthorized" }

Business Logic Notes
- For ADMIN role, this endpoint returns ALL projects without filtering.

------------------------------------------------------------------------

Marketing Projects Module

1) Get My Projects

Endpoint
GET /marketing-projects/my-projects

Description
Returns only marketing projects where the current user is assigned to a task.

Authentication
Required — Authorization: Bearer

Response
Success Response
Status Code: 200 OK

Error Responses
- 401 | Unauthorized | { "message": "Unauthorized" }

Business Logic Notes
- For ADMIN role, this endpoint returns ALL projects without filtering.
GET /tasks/:id/comments
PATCH /tasks/comments/:id
DELETE /tasks/comments/:id

10) Workflow

Endpoints
GET /tasks/:id/available-transitions
POST /tasks/:id/transition

11) Activity

Endpoint
GET /tasks/:id/activity

12) Bulk

Endpoints
POST /tasks/bulk/assign
POST /tasks/bulk/status

------------------------------------------------------------------------

Projects, Clients, Employees, Grades

Projects (Web)
- POST /web-projects
- GET /web-projects
- GET /web-projects/:id
- PATCH /web-projects/:id
- DELETE /web-projects/:id
Authentication: Required — Authorization: Bearer; Requires ADMIN role for POST/PATCH/DELETE

Permissions — Projects (Web & Marketing)
| Operation | Required Role |
|-----------|---------------|
| GET       | Any authenticated user |
| POST      | ADMIN only |
| PATCH     | ADMIN only |
| DELETE    | ADMIN only |

Projects (Marketing)
- POST /marketing-projects
- GET /marketing-projects
- GET /marketing-projects/:id
- PATCH /marketing-projects/:id
- DELETE /marketing-projects/:id
Authentication: Required — Authorization: Bearer; Requires ADMIN role for POST/PATCH/DELETE

Permissions — Sprints
| Operation | Required Role |
|-----------|---------------|
| GET       | Any authenticated user |
| POST      | ADMIN only |
| PATCH     | ADMIN only |
| DELETE    | ADMIN only |

Clients
- POST /clients
- GET /clients
- GET /clients/:id
- PATCH /clients/:id
- DELETE /clients/:id

Employees
- POST /employees
- GET /employees
- GET /employees/:id
- PATCH /employees/:id
- DELETE /employees/:id

Grades
- POST /grades
- GET /grades
- GET /grades/:id
- PATCH /grades/:id
- DELETE /grades/:id

Authentication
Required — Authorization: Bearer

------------------------------------------------------------------------

Time Tracking Module
 
1) Get Active Timer
 
Endpoint
GET /time/active
 
Authentication
Required — Authorization: Bearer
 
Response
Status Code: 200 OK
Example Body
{ "id": "timer_abc123", "userId": 2, "taskId": 1, "startTime": "2026-03-10T09:00:00.000Z", "lastPausedAt": null, "totalPaused": 0 }
 
2) Start Timer
 
Endpoint
POST /time/start
 
Authentication
Required — Authorization: Bearer
 
Request
Body
{ "taskId": 1 }
 
Response
Status Code: 201 Created
Example Body
{ "started": true }
 
3) Pause Timer
 
Endpoint
POST /time/pause
 
Authentication
Required — Authorization: Bearer
 
Response
Status Code: 200 OK
Example Body
{ "paused": true }
 
4) Resume Timer
 
Endpoint
POST /time/resume
 
Authentication
Required — Authorization: Bearer
 
Response
Status Code: 200 OK
Example Body
{ "resumed": true }
 
5) Stop Timer (log entry)
 
Endpoint
POST /time/stop
 
Description
Stops the current timer and creates a TimeEntry.
 
Authentication
Required — Authorization: Bearer
 
Response
Status Code: 201 Created
Example Body
{ "id": "te_abc123", "userId": 2, "taskId": 1, "startTime": "2026-03-10T09:00:00.000Z", "endTime": "2026-03-10T10:00:00.000Z", "duration": 3600, "billable": true }
 
6) Create Manual Time Entry
 
Endpoint
POST /time/manual
 
Description
Creates a manual time entry.
 
Authentication
Required — Authorization: Bearer
 
Request
Body
{ "taskId": 1, "startTime": "ISO", "endTime": "ISO", "description": "string", "billable": true, "billableRate": 100 }
 
Response
Status Code: 201 Created
 
7) List Time Entries
 
Endpoint
GET /time/entries
 
Authentication
Required — Authorization: Bearer
 
8) Update Time Entry
 
Endpoint
PATCH /time/entries/:id
 
Authentication
Required — Authorization: Bearer
 
9) Delete Time Entry
 
Endpoint
DELETE /time/entries/:id
 
Authentication
Required — Authorization: Bearer
 
10) Report Summary
 
Endpoint
GET /time/reports/summary?from&to
 
Authentication
Required — Authorization: Bearer
 
Response
Status Code: 200 OK
Example Body
{ "totalSeconds": 36000, "byUser": { "2": 18000 }, "byTask": { "1": 12000 } }
 
Business Logic Notes
- Duration may be calculated server-side from start/end if not provided.

------------------------------------------------------------------------

AI Module

1) Generate Sprints from PDF

Endpoint
POST /ai/generate-sprints

Description
Generates sprints and sprint tasks for a WebProject from a requirement PDF.

Authentication
Required — Authorization: Bearer

Request
Form Data
- file | file | Yes | PDF file (max 10MB)
- projectId | number | Yes | Target Project id (WebProject)

Response
Status Code: 201 Created
Example Body
{ "created": 2, "sprintIds": [1,2], "sprints": [ { "id": 1, "sprintTasks": [ { "id": 11, "titre": "Setup auth" } ] } ] }

2) Sprint Task Assistant — Subtasks

Endpoint
POST /ai/sprint-tasks/:id/subtasks

Description
Generates a breakdown of subtasks with estimated story points and reasoning.

Authentication
Required — Authorization: Bearer

Request
Body
{ "description": "optional extra context" }

Response
Status Code: 200 OK
Example Body
{ "subtasks": [ { "title": "Setup auth", "points": 3, "reasoning": "..." } ], "totalPoints": 5 }

Errors
- 400: { "message": ["taskId must be number"], "statusCode": 400 }
- 401: { "message": "Unauthorized", "statusCode": 401 }
- 403: { "message": "Not a sprint participant", "statusCode": 403 }
- 404: { "message": "Sprint task not found", "statusCode": 404 }

3) Sprint Task Assistant — Implementation Steps

Endpoint
POST /ai/sprint-tasks/:id/implementation

Description
Provides step-by-step implementation guidance with time estimates and optional code.

Authentication
Required — Authorization: Bearer

Request
Body
{ "description": "optional extra context" }

Response
Status Code: 200 OK
Example Body
{ "steps": [ { "order": 1, "title": "Initialize module", "description": "...", "code": "/* ... */", "estimatedMinutes": 30 } ], "totalMinutes": 120 }

4) Sprint Task Assistant — Effort Estimation

Endpoint
POST /ai/sprint-tasks/:id/estimate

Description
Estimates story points with confidence and min-max range.

Authentication
Required — Authorization: Bearer

Request
Body
{ "description": "optional extra context" }

Response
Status Code: 200 OK
Example Body
{ "points": 5, "confidence": 0.75, "min": 3, "max": 8, "factors": ["..."], "similar": ["{id:1,title:'...'}"] }

5) Sprint Task Assistant — Technical Recommendations

Endpoint
POST /ai/sprint-tasks/:id/recommendations

Description
Suggests technologies, libraries, and approaches with pros/cons and alternatives.

Authentication
Required — Authorization: Bearer

Request
Body
{ "description": "optional extra context" }

Response
Status Code: 200 OK
Example Body
{ "recommendations": [ { "category": "backend", "suggestion": "...", "pros": ["..."], "cons": ["..."], "alternatives": ["..."] } ] }

6) Sprint Task Assistant — Acceptance Criteria

Endpoint
POST /ai/sprint-tasks/:id/acceptance

Description
Generates testable acceptance criteria in priority order.

Authentication
Required — Authorization: Bearer

Request
Body
{ "description": "optional extra context" }

Response
Status Code: 200 OK
Example Body
{ "criteria": [ { "title": "JWT must be validated", "details": "..." } ] }

7) Sprint Task Assistant — Similar Tasks

Endpoint
POST /ai/sprint-tasks/:id/similar

Description
Finds similar completed tasks for reference.

Authentication
Required — Authorization: Bearer

Response
Status Code: 200 OK
Example Body
{ "results": [ { "type": "SPRINT", "id": 12, "title": "Auth setup", "storyPoints": 3, "sprint": "Sprint 3", "similarity": 82 }, { "type": "TASK", "id": 44, "title": "Marketing copy", "storyPoints": null, "sprint": null, "similarity": 67 } ] }

8) Sprint Task Assistant — Q&A

Endpoint
POST /ai/sprint-tasks/:id/qa

Description
Interactive Q&A for task implementation with code examples and suggestions.

Authentication
Required — Authorization: Bearer

Request
Body
{ "question": "How to structure NestJS module for auth?" }

Response
Status Code: 200 OK
Example Body
{ "answer": "...", "code": "/* ... */", "suggestions": ["..."] }

9) Sprint Task Assistant — Share to Sprint Chat

Endpoint
POST /ai/sprint-tasks/:id/share

Description
Shares AI-generated content to sprint chat; notifies participants.

Authentication
Required — Authorization: Bearer

Request
Body
{ "type": "subtasks", "content": "{...json...}" }

Response
Status Code: 200 OK
Example Body
{ "shared": true, "messageId": "msg_123" }
Notes
- messageId can be a string or a number depending on database configuration.

10) AI Accuracy Analytics

Endpoint
GET /ai/analytics/accuracy?from?&to?&bySprint?

Description
Compares story points vs actual time; returns seconds per point per sprint task, or aggregate.

Authentication
Required — Authorization: Bearer

Response
Status Code: 200 OK
Example Body
{ "entries": [ { "sprintTaskId": 10, "storyPoints": 5, "seconds": 10800, "secondsPerPoint": 2160 } ] }

11) AI Detailed Analytics

Endpoint
GET /ai/analytics/detailed?from&to&sprintId?

Description
Returns comprehensive analytics combining SprintTask AI metadata and TimeEntry data with aggregates.

Authentication
Required — Authorization: Bearer

Response
Status Code: 200 OK
Example Body
{
  "period": { "from": "2026-01-01", "to": "2026-03-01" },
  "overall": {
    "totalTasksAnalyzed": 45,
    "averageConfidence": 82.5,
    "averageError": 1.2,
    "accuracyRate": 78,
    "totalTimeSpentSeconds": 324000,
    "totalTimeSaved": "12 hours"
  },
  "bySprint": [
    {
      "sprintId": 1,
      "sprintName": "Sprint 12",
      "tasksAnalyzed": 12,
      "averageError": 0.8,
      "accuracyRate": 92,
      "improvement": "+5%"
    }
  ],
  "byTaskType": [
    { "type": "Frontend", "tasksAnalyzed": 20, "accuracyRate": 85 },
    { "type": "Backend", "tasksAnalyzed": 15, "accuracyRate": 72 }
  ],
  "trend": { "direction": "improving", "percentage": "+12%", "since": "2026-02-01" },
  "recommendations": [
    "AI most accurate for UI tasks (92%)",
    "Refine prompts for database tasks (65% accuracy)"
  ]
}

Error Responses
- 400 | Validation error | { "message": ["from must be ISO"], "statusCode": 400 }
- 401 | Unauthorized | { "message": "Unauthorized", "statusCode": 401 }
- 403 | Forbidden | { "message": "Forbidden", "statusCode": 403 }
- 404 | Not Found | { "message": "Not Found", "statusCode": 404 }

------------------------------------------------------------------------

Users Module

1) Get My Team

Endpoint
GET /users/my-team

Description
Returns all users who share at least one Project with the current user. Shared involvement is detected via:
- TaskAssignment (assigned to a marketing Task within a Project)
- SprintParticipant (participant in a Sprint within a WebProject of a Project)
- Task reporter (reporter of a marketing Task within a Project)

Additionally includes:
- The client user associated with each Project
- All ADMIN users in the system

Authentication
Required — Authorization: Bearer

Response
Status Code: 200 OK
Body: Array<User>

User
- id | number | utilisateur.id
- email | string
- role | "CLIENT" | "EMPLOYEE" | "ADMIN"
- nom | string? | From Employee.nom (EMPLOYEE)
- prenom | string? | From Employee.prenom (EMPLOYEE)
- nomSociete | string? | From Client.nomSociete (CLIENT)
- avatar | string? | Avatar URL if set

Notes
- Excludes the current user from the results
- May include duplicates across sources but the response is de-duplicated

Example Response
[
  {
    "id": 12,
    "email": "dev@acme.com",
    "role": "EMPLOYEE",
    "nom": "Doe",
    "prenom": "Jane",
    "avatar": "https://cdn.example.com/a.jpg"
  },
  {
    "id": 3,
    "email": "client@co.com",
    "role": "CLIENT",
    "nomSociete": "Client Co"
  },
  {
    "id": 1,
    "email": "admin@system",
    "role": "ADMIN"
  }
]

------------------------------------------------------------------------

WebSocket Events

/chat
- Client → Server: join, message:send, typing:start, typing:stop, message:read
- Server → Client: joined, message:new, typing:start, typing:stop, message:read, error

/chat — Message Object

Fields
- id | string
- content | string
- senderId | number
- createdAt | ISO date
- updatedAt | ISO date
- isEdited | boolean
- replyToId | string? | Message id being replied to
- readBy | Array<{ userId: number, readAt: ISO }>
- files | Array<{ id: string, filename: string, mimeType: string, size: number }>

Example
{
  "id": "msg_1",
  "content": "Hello team!",
  "senderId": 2,
  "createdAt": "2026-03-10T10:00:00.000Z",
  "updatedAt": "2026-03-10T10:00:00.000Z",
  "isEdited": false,
  "replyToId": null,
  "readBy": [{ "userId": 2, "readAt": "2026-03-10T10:00:00.000Z" }],
  "files": [
    { "id": "file_1", "filename": "design.png", "mimeType": "image/png", "size": 123456 }
  ]
}

/notifications
- Server → Client: notification:new, unread:count

/tasks
- Server → Client: task:created, task:updated, task:status

/time
- Timer lifecycle events as applicable

------------------------------------------------------------------------

Important Notes
- Keep Authorization header on all protected endpoints.
- Sprint chats are created automatically; admins and sprint creator are added as participants.
- Sprint task visibility and file access are restricted to sprint participants or admins.

------------------------------------------------------------------------

Enum Reference

- TaskStatus: A_FAIRE | EN_COURS | EN_REVUE | TERMINE | BLOQUE
- SprintStatus: PLANIFIE | EN_COURS | TERMINE
- ProjectStatus: EN_ATTENTE | EN_COURS | TERMINE | ANNULE
- TaskPriority: LOW | MEDIUM | HIGH | URGENT
- NotificationType: NEW_MESSAGE | MESSAGE_MENTION | TASK_ASSIGNED | TASK_UPDATED | TASK_COMMENT | TASK_MENTION | DEADLINE_APPROACHING | DEADLINE_OVERDUE | PROJECT_UPDATE | TEAM_ANNOUNCEMENT | SYSTEM

------------------------------------------------------------------------

Standard Error Responses

- 400 | Validation error | { "message": ["<field> must be ..."], "error": "Bad Request", "statusCode": 400 }
- 401 | Unauthorized | { "message": "Unauthorized", "error": "Unauthorized", "statusCode": 401 }
- 403 | Forbidden | { "message": "Admin only", "error": "Forbidden", "statusCode": 403 }
- 404 | Not Found | { "message": "Resource not found", "error": "Not Found", "statusCode": 404 }

Per-Endpoint Error Examples
- 400: { "message": ["<field> must be valid"], "statusCode": 400 }
- 401: { "message": "Unauthorized", "statusCode": 401 }
- 403: { "message": "Forbidden", "statusCode": 403 }
- 404: { "message": "Not Found", "statusCode": 404 }
