# API Documentation

Base URL: /api

All routes are protected by JWT unless marked Public. Include header:
- Authorization: Bearer <JWT>

## Auth

- Module: Auth
- Endpoint: /auth/login
- Method: POST
- Description: Authenticate user and return JWT plus basic profile.
- Request Body:
  - email (string, required)
  - password (string, required, min 6)
- Headers: none (Public)
- Response Example:
  {
    "access_token": "jwt",
    "user": { "id": 1, "email": "admin@duality.local", "role": "ADMIN", "avatar": null, "telephone": "100-000-0000" }
  }
- Error Responses:
  - 401 Unauthorized: { "statusCode": 401, "message": "Email ou mot de passe incorrect" }
- Role Access: Public

## Chat (REST)

- Module: Chat
- Endpoint: /chat/conversations
- Method: GET
- Description: List conversations (DIRECT and TASK) for current user, most recent first.
- Headers: Authorization Bearer token
- Response Example: [ { "id": "cuid", "type": "DIRECT", "lastMessageAt": "ISO" }, ... ]
- Role Access: Authenticated (Client, Employer, Admin)

- Module: Chat
- Endpoint: /chat/direct
- Method: POST
- Description: Get or create a DIRECT conversation with another user.
- Request Body:
  - userId (number, required)
- Headers: Authorization Bearer token
- Response Example: { "id": "cuid", "type": "DIRECT", "participants": [...] }
- Role Access: Authenticated

- Module: Chat
- Endpoint: /chat/task/:taskId
- Method: POST
- Description: Get or create a TASK conversation linked to a task.
- Params:
  - taskId (number, required)
- Headers: Authorization Bearer token
- Response Example: { "id": "cuid", "type": "TASK", "taskId": 1 }
- Role Access: Authenticated

- Module: Chat
- Endpoint: /chat/conversations/:id/messages
- Method: GET
- Description: List messages for a conversation with cursor pagination.
- Query:
  - cursor (string, optional)
  - limit (number, optional, min 1; default 20)
- Headers: Authorization Bearer token
- Response Example: [ { "id":"cuid","content":"...","senderId":1,"createdAt":"ISO" }, ... ]
- Role Access: Participant or Admin

- Module: Chat
- Endpoint: /chat/conversations/:id/messages
- Method: POST
- Description: Send a new message to a conversation.
- Request Body:
  - content (string, required, 1..5000)
  - replyToId (UUID, optional)
- Headers: Authorization Bearer token
- Response Example: { "id":"cuid","content":"Hi","senderId":1,"createdAt":"ISO" }
- Error Responses:
  - 403 Forbidden if not a participant
- Role Access: Participant or Admin

- Module: Chat
- Endpoint: /chat/conversations/:id/read
- Method: POST
- Description: Mark the conversation as read for current user.
- Headers: Authorization Bearer token
- Response Example: { "ok": true, "lastReadAt": "ISO" }
- Role Access: Participant or Admin

- Module: Chat
- Endpoint: /chat/conversations/:id/unread
- Method: POST
- Description: Mark the conversation as unread.
- Headers: Authorization Bearer token
- Response Example: { "ok": true }
- Role Access: Participant or Admin

- Module: Chat
- Endpoint: /chat/messages/:id
- Method: PATCH
- Description: Edit message content (author only).
- Request Body:
  - content (string, required, 1..5000)
- Headers: Authorization Bearer token
- Response Example: { "id":"cuid","content":"Edited", "isEdited": true }
- Error Responses:
  - 403 Forbidden if not author
- Role Access: Author or Admin

- Module: Chat
- Endpoint: /chat/messages/:id
- Method: DELETE
- Description: Soft delete a message (author only).
- Headers: Authorization Bearer token
- Response Example: { "deleted": true }
- Error Responses:
  - 403 Forbidden if not author
- Role Access: Author or Admin

## Chat (WebSocket)

- Namespace: /chat
- Auth: Authorization: Bearer <JWT> in headers, or auth.token / query.token in handshake
- Rooms:
  - conversation:{conversationId}
- Client Events:
  - join (conversationId: string)
  - message:send ({ conversationId: string, content: string, replyToId?: string })
  - typing:start (conversationId: string)
  - typing:stop (conversationId: string)
  - message:read (conversationId: string)
- Server Events:
  - message:new (Message)
  - typing:start ({ userId, conversationId })
  - typing:stop ({ userId, conversationId })
  - message:read ({ userId, ... })

## Notifications (REST)

- Module: Notifications
- Endpoint: /notifications
- Method: GET
- Description: List notifications for current user (newest first).
- Query:
  - cursor (string, optional)
  - limit (number, optional; default 20)
- Headers: Authorization Bearer token
- Response Example: [ { "id":"cuid","type":"NEW_MESSAGE","title":"Nouveau message","data":{...},"createdAt":"ISO","readAt":null }, ... ]
- Role Access: Authenticated

- Module: Notifications
- Endpoint: /notifications/unread-count
- Method: GET
- Description: Get unread notifications count.
- Headers: Authorization Bearer token
- Response Example: { "count": 3 }
- Role Access: Authenticated

- Module: Notifications
- Endpoint: /notifications/:id/read
- Method: POST
- Description: Mark a notification as read.
- Headers: Authorization Bearer token
- Response Example: { "updated": 1 }
- Role Access: Authenticated (owner)

- Module: Notifications
- Endpoint: /notifications/mark-all-read
- Method: POST
- Description: Mark all notifications as read for current user.
- Headers: Authorization Bearer token
- Response Example: { "updated": 5 }
- Role Access: Authenticated

- Module: Notifications
- Endpoint: /notifications/:id
- Method: DELETE
- Description: Delete a notification.
- Headers: Authorization Bearer token
- Response Example: { "deleted": 1 }
- Role Access: Authenticated (owner)

- Module: Notifications
- Endpoint: /notifications/preferences
- Method: GET
- Description: Get current user's notification preferences (creates defaults if missing).
- Headers: Authorization Bearer token
- Response Example: { "emailNewMessage": true, "inAppNewMessage": true, ... }
- Role Access: Authenticated

- Module: Notifications
- Endpoint: /notifications/preferences
- Method: PATCH
- Description: Update notification preferences.
- Request Body (all optional booleans):
  - emailNewMessage, emailTaskAssigned, emailDeadlineReminder
  - inAppNewMessage, inAppTaskAssigned, inAppDeadlineReminder
  - pushEnabled
- Headers: Authorization Bearer token
- Response Example: { "emailNewMessage": false, "inAppNewMessage": true, ... }
- Role Access: Authenticated

## Notifications (WebSocket)

- Namespace: /notifications
- Auth: Authorization: Bearer <JWT> in headers, or auth.token / query.token in handshake
- Rooms:
  - user:{userId}
- Server Events:
  - notification:new ({ type: string, data?: any })
  - notification:unread_count ({ count: number })

## Time Tracking (REST)

- Module: Time
- Endpoint: /time/active
- Method: GET
- Description: Get the current active timer for the authenticated user.
- Headers: Authorization Bearer token
- Response Example: { "userId":1, "taskId":10, "startTime":"ISO", "lastPausedAt": null, "totalPaused": 0 } or null
- Role Access: Authenticated

- Module: Time
- Endpoint: /time/start
- Method: POST
- Description: Start a timer on a task; auto-stops existing active timer.
- Request Body:
  - taskId (number, required)
- Headers: Authorization Bearer token
- Response Example: { "started": true }
- Role Access: Authenticated

- Module: Time
- Endpoint: /time/pause
- Method: POST
- Description: Pause current active timer.
- Headers: Authorization Bearer token
- Response Example: { "paused": true }
- Error Responses:
  - 404 if no active timer
- Role Access: Authenticated

- Module: Time
- Endpoint: /time/resume
- Method: POST
- Description: Resume paused timer.
- Headers: Authorization Bearer token
- Response Example: { "resumed": true }
- Error Responses:
  - 404 if no active timer
- Role Access: Authenticated

- Module: Time
- Endpoint: /time/stop
- Method: POST
- Description: Stop active timer; creates a TimeEntry and updates summaries; emits a real-time SYSTEM notification to the user.
- Headers: Authorization Bearer token
- Response Example: { "id":"cuid","userId":1,"taskId":10,"startTime":"ISO","endTime":"ISO","duration":3600 }
- Error Responses:
  - 404 if no active timer
- Role Access: Authenticated

- Module: Time
- Endpoint: /time/manual
- Method: POST
- Description: Create a manual time entry.
- Request Body:
  - taskId (number, optional)
  - description (string, optional)
  - startTime (ISO string, required)
  - endTime (ISO string, required)
  - billable (boolean, optional, default true)
  - billableRate (number, optional)
- Headers: Authorization Bearer token
- Response Example: { "id":"cuid","userId":1,"taskId":10,"duration":1800, ... }
- Role Access: Authenticated

- Module: Time
- Endpoint: /time/entries
- Method: GET
- Description: List entries for current user; Admin may query other users.
- Query:
  - userId (number, optional; ADMIN only)
  - taskId (number, optional)
  - marketingProjectId (number, optional)
  - from (date string, optional)
  - to (date string, optional)
- Headers: Authorization Bearer token
- Response Example: [ { "id":"cuid","taskId":10,"startTime":"ISO","endTime":"ISO","duration":900 }, ... ]
- Role Access: Authenticated; ADMIN can query any user via userId

- Module: Time
- Endpoint: /time/entries/:id
- Method: PATCH
- Description: Update an entry fields; recalculates duration if start/end provided.
- Request Body (optional fields):
  - description (string)
  - startTime (ISO string)
  - endTime (ISO string)
  - billable (boolean)
  - billableRate (number)
- Headers: Authorization Bearer token
- Response Example: { "id":"cuid","duration":1200, ... }
- Role Access: Owner or ADMIN

- Module: Time
- Endpoint: /time/entries/:id
- Method: DELETE
- Description: Delete an entry.
- Headers: Authorization Bearer token
- Response Example: { "deleted": true }
- Role Access: Owner or ADMIN

- Module: Time
- Endpoint: /time/reports/summary
- Method: GET
- Description: Aggregate totals and per-task breakdown for a date range.
- Query:
  - userId (number, optional; ADMIN only)
  - marketingProjectId (number, optional)
  - from (date string, optional)
  - to (date string, optional)
- Headers: Authorization Bearer token
- Response Example: { "totalSeconds": 7200, "byTask": { "10": 3600, "no-task": 3600 } }
- Role Access: Authenticated; ADMIN can query any user via userId

## Time (WebSocket)

- Namespace: /time
- Auth: Authorization: Bearer <JWT> in headers, or auth.token / query.token in handshake
- Rooms:
  - user:{userId}
- Server Events:
  - timer:state (ActiveTimer | null) on connect and every minute

## Headers and Roles Summary
- Authorization: Bearer <JWT> required for all routes except POST /auth/login.
- Roles enforced primarily at service level:
  - Time entries listing/reporting allow ADMIN to query other users; non-admins can only access their own.
  - Chat endpoints are scoped to conversation participants or Admin.
  - Notification endpoints are scoped to current user.
