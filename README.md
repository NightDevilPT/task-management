# Task Management System

Of course. This is a crucial planning step. Here's a comprehensive list of API routes you'll need to build for your Task Management System, organized by module.

## Authentication Routes (`/api/auth/[...]`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Create a new user account |
| `POST` | `/api/auth/login` | Login user & return JWT token |
| `POST` | `/api/auth/logout` | Logout user (invalidate token) |
| `GET` | `/api/auth/me` | Get current user's profile |
| `PUT` | `/api/auth/me` | Update current user's profile |
| `POST` | `/api/auth/refresh` | Refresh JWT token |
| `POST` | `/api/auth/forgot-password` | Request password reset email |
| `POST` | `/api/auth/reset-password` | Reset password with token |

---

## User Routes (`/api/users/[...]`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/users` | Get all users (for mentions/search) |
| `GET` | `/api/users/:userId` | Get a specific user's public profile |
| `GET` | `/api/users/me/teams` | Get current user's teams & roles |
| `GET` | `/api/users/me/tasks` | Get current user's assigned tasks |
| `GET` | `/api/users/me/notifications` | Get current user's notifications |
| `PUT` | `/api/users/me/notifications/read` | Mark notifications as read |

---

## Team Routes (`/api/teams/[...]`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/teams` | Create a new team |
| `GET` | `/api/teams` | Get all teams current user is member of |
| `GET` | `/api/teams/:teamId` | Get a specific team's details |
| `PUT` | `/api/teams/:teamId` | Update team details (Admin only) |
| `DELETE` | `/api/teams/:teamId` | Delete a team (Owner only) |
| `GET` | `/api/teams/:teamId/members` | Get all members of a team |
| `POST` | `/api/teams/:teamId/invites` | Invite a user to a team (email) |
| `GET` | `/api/teams/:teamId/invites` | Get pending invites for a team |
| `DELETE` | `/api/teams/:teamId/invites/:inviteId` | Cancel an invite |
| `POST` | `/api/teams/invites/:token/accept` | Accept a team invite (via email token) |
| `POST` | `/api/teams/invites/:token/decline` | Decline a team invite |
| `PUT` | `/api/teams/:teamId/members/:userId` | Update a member's role (Admin only) |
| `DELETE` | `/api/teams/:teamId/members/:userId` | Remove a member from team (Admin only) |

---

## Task Routes (`/api/teams/:teamId/tasks/[...]`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/teams/:teamId/tasks` | Create a new task in a team |
| `GET` | `/api/teams/:teamId/tasks` | Get all tasks for a team (with filters) |
| `GET` | `/api/teams/:teamId/tasks/:taskId` | Get a specific task's details |
| `PUT` | `/api/teams/:teamId/tasks/:taskId` | Update a task |
| `DELETE` | `/api/teams/:teamId/tasks/:taskId` | Delete a task |
| `PUT` | `/api/teams/:teamId/tasks/:taskId/status` | Update task status (e.g., move on Kanban) |
| `PUT` | `/api/teams/:teamId/tasks/:taskId/assign` | Assign/unassign a task to a user |

---

## Comment Routes (`/api/teams/:teamId/tasks/:taskId/comments/[...]`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `.../comments` | Add a comment to a task |
| `GET` | `.../comments` | Get all comments for a task |
| `PUT` | `.../comments/:commentId` | Edit a comment |
| `DELETE` | `.../comments/:commentId` | Delete a comment |

---

## Attachment Routes (`/api/teams/:teamId/tasks/:taskId/attachments/[...]`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `.../attachments` | Upload a file to a task |
| `GET` | `.../attachments` | Get all attachments for a task |
| `DELETE` | `.../attachments/:attachmentId` | Delete an attachment |

---

## Activity & Notification Routes (`/api/[...]`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/teams/:teamId/activity` | Get recent activity for a team |
| `GET` | `/api/me/activity` | Get current user's global activity feed |

---

## Summary of Route Structure

Your API structure will look like this in the `app/api/` directory:

```
app/api/
├── auth/
│   ├── register/route.ts
│   ├── login/route.ts
│   ├── logout/route.ts
│   ├── me/route.ts
│   └── ...
├── users/
│   ├── route.ts          # GET /api/users
│   ├── [userId]/route.ts # GET /api/users/:userId
│   └── me/
│       ├── teams/route.ts
│       ├── tasks/route.ts
│       └── notifications/route.ts
├── teams/
│   ├── route.ts                      # GET, POST /api/teams
│   ├── [teamId]/
│   │   ├── route.ts                  # GET, PUT, DELETE /api/teams/:teamId
│   │   ├── members/
│   │   │   ├── route.ts              # GET /api/teams/:teamId/members
│   │   │   └── [userId]/route.ts     # PUT, DELETE /api/teams/:teamId/members/:userId
│   │   ├── invites/
│   │   │   ├── route.ts              # GET, POST /api/teams/:teamId/invites
│   │   │   └── [inviteId]/route.ts   # DELETE /api/teams/:teamId/invites/:inviteId
│   │   └── tasks/
│   │       ├── route.ts              # GET, POST /api/teams/:teamId/tasks
│   │       └── [taskId]/
│   │           ├── route.ts          # GET, PUT, DELETE /api/teams/:teamId/tasks/:taskId
│   │           ├── comments/
│   │           │   ├── route.ts
│   │           │   └── [commentId]/route.ts
│   │           └── attachments/
│   │               ├── route.ts
│   │               └── [attachmentId]/route.ts
│   └── invites/
│       └── [token]/
│           ├── accept/route.ts
│           └── decline/route.ts
└── me/
    ├── notifications/route.ts
    └── activity/route.ts
```

**Priority Order for Implementation (MVP First):**
1.  Auth Routes (`/api/auth/*`)
2.  Team Routes (`/api/teams`, `/api/teams/[teamId]`)
3.  Task Routes (`/api/teams/[teamId]/tasks`)
4.  Comment Routes
5.  Invite & Member Routes
6.  The rest (Attachments, Activity, etc.)






<hr>

```mermaid
flowchart TD
    User

    User -->|teamMemberships| TeamMember
    User -->|createdTeams| Team
    User -->|createdTasks| Task
    User -->|assignedTasks| Task
    User -->|teamInvites| TeamInvite
    User -->|comments| Comment
    User -->|attachments| Attachment
    User -->|notifications| Notification
    User -->|activities| Activity

    subgraph TeamContext [Team & Membership]
        TeamMember -->|defines role in| Team
    end

    subgraph TaskContext [Task & Collaboration]
        Comment
        Attachment
    end

    subgraph System [System & Logging]
        Notification
        Activity
    end
```
