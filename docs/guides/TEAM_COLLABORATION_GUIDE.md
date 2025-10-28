# FixFirst SEO - Team Collaboration Guide

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Getting Started](#getting-started)
- [User Roles & Permissions](#user-roles--permissions)
- [Team Management](#team-management)
- [Issue Comments](#issue-comments)
- [Activity Tracking](#activity-tracking)
- [API Documentation](#api-documentation)
- [Frontend Components](#frontend-components)
- [Best Practices](#best-practices)

---

## Overview

FixFirst SEO now includes comprehensive team collaboration features that enable multiple users to work together on SEO audits, share insights, and track project activities in real-time.

### Key Benefits
- **Multi-user Projects**: Invite team members with different access levels
- **Real-time Collaboration**: Comment on issues and track changes instantly
- **Activity Logging**: Complete audit trail of all project activities
- **Role-based Access**: Granular permissions for enhanced security

---

## Features

### 1. Team Management
- Invite team members via email
- Assign roles (Owner, Admin, Member, Viewer)
- Manage team members (update roles, remove access)
- View pending invitations
- Leave projects

### 2. Issue Comments
- Add comments to specific SEO issues
- Edit and delete your own comments
- View comment history with timestamps
- Real-time comment updates

### 3. Activity Tracking
- Automatic logging of all project activities
- Project-specific and global activity feeds
- Activity statistics and insights
- Filter by date range and activity type

---

## Getting Started

### For Project Owners

#### 1. Access Team Management
```
Navigate to: Dashboard → [Select Project] → Team Tab
Or: /project/{projectId}?tab=team
```

#### 2. Invite Team Members
1. Click "Invite Member" button
2. Enter the team member's email address
3. Select their role (Admin, Member, or Viewer)
4. Click "Send Invite"
5. The invited user will receive an invitation link (valid for 7 days)

### For Team Members

#### 1. Accept Invitation
1. Click the invitation link received via email
2. Log in to your account (or create one)
3. Review the project details
4. Click "Accept Invitation"
4. You'll be redirected to the project dashboard

#### 2. Collaborate
- View audit results based on your role
- Add comments to issues
- Track team activity
- Receive notifications for important events

---

## User Roles & Permissions

### OWNER
**Full Control** - The project creator

**Permissions:**
- ✅ All permissions
- ✅ Invite/remove team members
- ✅ Change member roles
- ✅ Delete project
- ✅ Manage project settings
- ✅ Run audits
- ✅ Comment on issues
- ✅ View all activities

### ADMIN
**Team Management** - Can manage team and settings

**Permissions:**
- ✅ Invite/remove Members and Viewers
- ✅ Run audits
- ✅ Comment on issues
- ✅ View all activities
- ✅ Manage project settings
- ❌ Cannot remove Owner or other Admins
- ❌ Cannot delete project

### MEMBER
**Contributor** - Can view and contribute

**Permissions:**
- ✅ View audit results
- ✅ Comment on issues
- ✅ View activities
- ❌ Cannot invite members
- ❌ Cannot run audits
- ❌ Cannot change settings

### VIEWER
**Read-only** - View access only

**Permissions:**
- ✅ View audit results
- ✅ View comments (but cannot add)
- ✅ View activities
- ❌ All management actions restricted

---

## Team Management

### Inviting Members

**API Endpoint:**
```http
POST /api/teams/{projectId}/invite
Content-Type: application/json
Authorization: Bearer {token}

{
  "email": "colleague@example.com",
  "role": "MEMBER"
}
```

**Response:**
```json
{
  "message": "Invitation sent successfully",
  "invitation": {
    "id": "inv_123",
    "email": "colleague@example.com",
    "role": "MEMBER",
    "expiresAt": "2025-11-03T12:00:00Z",
    "invitedBy": "owner@example.com"
  }
}
```

### Viewing Team Members

**API Endpoint:**
```http
GET /api/teams/{projectId}/members
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": "member_1",
    "userId": "user_123",
    "role": "OWNER",
    "joinedAt": "2025-01-01T00:00:00Z",
    "user": {
      "id": "user_123",
      "email": "owner@example.com"
    }
  },
  {
    "id": "member_2",
    "userId": "user_456",
    "role": "MEMBER",
    "joinedAt": "2025-10-15T10:30:00Z",
    "user": {
      "id": "user_456",
      "email": "colleague@example.com"
    }
  }
]
```

### Updating Member Roles

**API Endpoint:**
```http
PATCH /api/teams/{projectId}/members/{memberId}
Content-Type: application/json
Authorization: Bearer {token}

{
  "role": "ADMIN"
}
```

### Removing Members

**API Endpoint:**
```http
DELETE /api/teams/{projectId}/members/{memberId}
Authorization: Bearer {token}
```

**Permissions:**
- **OWNER** can remove anyone
- **ADMIN** can remove MEMBER and VIEWER
- **Any user** can remove themselves (leave project)

### Leaving a Project

**API Endpoint:**
```http
POST /api/teams/{projectId}/leave
Authorization: Bearer {token}
```

---

## Issue Comments

### Adding Comments

**API Endpoint:**
```http
POST /api/comments/issue/{issueId}
Content-Type: application/json
Authorization: Bearer {token}

{
  "content": "I've fixed this issue by updating the meta descriptions."
}
```

**Response:**
```json
{
  "id": "comment_123",
  "content": "I've fixed this issue by updating the meta descriptions.",
  "createdAt": "2025-10-27T15:30:00Z",
  "updatedAt": "2025-10-27T15:30:00Z",
  "user": {
    "id": "user_123",
    "email": "developer@example.com"
  }
}
```

### Viewing Comments

**API Endpoint:**
```http
GET /api/comments/issue/{issueId}
Authorization: Bearer {token}
```

### Editing Comments

**API Endpoint:**
```http
PATCH /api/comments/{commentId}
Content-Type: application/json
Authorization: Bearer {token}

{
  "content": "Updated comment text"
}
```

**Note:** Only comment authors can edit their comments

### Deleting Comments

**API Endpoint:**
```http
DELETE /api/comments/{commentId}
Authorization: Bearer {token}
```

**Permissions:**
- Comment author can delete
- Project Owner can delete any comment
- Project Admin can delete any comment

---

## Activity Tracking

All activities are automatically logged:

### Activity Types

| Action | Description |
|--------|-------------|
| `CREATED` | New entity created (audit, project, etc.) |
| `UPDATED` | Entity updated |
| `DELETED` | Entity deleted |
| `INVITED` | Team member invited |
| `JOINED` | User joined project |
| `LEFT` | User left project |
| `COMMENTED` | Comment added to issue |
| `COMPLETED` | Audit completed |
| `STARTED` | Audit started |

### Viewing Project Activities

**API Endpoint:**
```http
GET /api/activities/project/{projectId}?limit=50&offset=0
Authorization: Bearer {token}
```

**Response:**
```json
{
  "activities": [
    {
      "id": "activity_123",
      "action": "COMMENTED",
      "entityType": "issue",
      "entityId": "issue_456",
      "metadata": {
        "commentId": "comment_789"
      },
      "createdAt": "2025-10-27T15:30:00Z",
      "user": {
        "id": "user_123",
        "email": "developer@example.com"
      }
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0
  }
}
```

### Recent Activities (All Projects)

**API Endpoint:**
```http
GET /api/activities/recent?limit=20
Authorization: Bearer {token}
```

### Activity Statistics

**API Endpoint:**
```http
GET /api/activities/project/{projectId}/stats?days=30
Authorization: Bearer {token}
```

**Response:**
```json
{
  "actionCounts": {
    "COMMENTED": 45,
    "COMPLETED": 12,
    "INVITED": 3,
    "JOINED": 3
  },
  "dailyActivities": {
    "2025-10-27": 15,
    "2025-10-26": 8,
    "2025-10-25": 12
  },
  "mostActiveUsers": [
    {
      "user": {
        "id": "user_123",
        "email": "developer@example.com"
      },
      "count": 28
    }
  ],
  "totalActivities": 65
}
```

---

## API Documentation

### Base URL
```
http://localhost:3001/api
Production: https://your-domain.com/api
```

### Authentication
All endpoints require Bearer token authentication:
```http
Authorization: Bearer {your_jwt_token}
```

### Error Responses

**403 Forbidden:**
```json
{
  "error": "Access denied"
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found"
}
```

**400 Bad Request:**
```json
{
  "error": "Invalid input",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

## Frontend Components

### TeamManagement Component

**Location:** `apps/web/components/TeamManagement.tsx`

**Usage:**
```tsx
import TeamManagement from '@/components/TeamManagement';

<TeamManagement 
  projectId="proj_123"
  isOwner={true}
  isAdmin={false}
  currentUserId="user_123"
/>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| projectId | string | Project ID |
| isOwner | boolean | Is current user the owner? |
| isAdmin | boolean | Is current user an admin? |
| currentUserId | string | Current user's ID |

### IssueComments Component

**Location:** `apps/web/components/IssueComments.tsx`

**Usage:**
```tsx
import IssueComments from '@/components/IssueComments';

<IssueComments 
  issueId="issue_456"
  currentUserEmail="user@example.com"
/>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| issueId | string | Issue ID to show comments for |
| currentUserEmail | string | Current user's email (for ownership checks) |

### ActivityFeed Component

**Location:** `apps/web/components/ActivityFeed.tsx`

**Usage:**
```tsx
import ActivityFeed from '@/components/ActivityFeed';

// Project-specific feed
<ActivityFeed 
  projectId="proj_123"
  limit={50}
  showHeader={true}
/>

// Global feed (all projects)
<ActivityFeed 
  limit={20}
  showHeader={true}
/>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| projectId | string? | Optional: Filter by project |
| limit | number | Max activities to show (default: 20) |
| showHeader | boolean | Show header section (default: true) |

### IssueDetailModal Component

**Location:** `apps/web/components/IssueDetailModal.tsx`

**Usage:**
```tsx
import IssueDetailModal from '@/components/IssueDetailModal';

<IssueDetailModal 
  issue={issueObject}
  currentUserEmail="user@example.com"
  onClose={() => setModalOpen(false)}
/>
```

---

## Best Practices

### Security

1. **Never Share Invitation Links**
   - Invitation links are personal and expire in 7 days
   - Each link is tied to a specific email address

2. **Regular Permission Audits**
   - Review team members quarterly
   - Remove access for inactive members
   - Use least-privilege principle (assign minimum required role)

3. **Protect Sensitive Data**
   - Limit OWNER and ADMIN roles
   - Use VIEWER role for stakeholders who only need visibility

### Team Collaboration

1. **Use Descriptive Comments**
   - Add context and details when commenting on issues
   - Tag team members when needed (coming soon)
   - Include resolution steps

2. **Track Activities**
   - Review activity feed regularly
   - Use statistics to identify active contributors
   - Monitor for unusual patterns

3. **Role Assignment Strategy**
   ```
   OWNER    → Project lead / Product owner
   ADMIN    → Development team leads
   MEMBER   → Developers / SEO specialists
   VIEWER   → Stakeholders / Clients
   ```

### Performance

1. **Activity Feed Pagination**
   - Use limit/offset for large projects
   - Default to 20-50 recent activities
   - Implement "Load More" for better UX

2. **Comment Loading**
   - Comments load on-demand (per issue)
   - Cache frequently accessed issues
   - Use optimistic UI updates

### Integration

1. **Webhooks (Coming Soon)**
   - Get notified when team members are added
   - Track comment activities
   - Monitor audit completions

2. **Slack Integration (Available)**
   - Configure Slack webhook in Settings
   - Receive notifications for:
     - Audit completions
     - Critical issues found
     - Team activities

---

## Troubleshooting

### Common Issues

**1. Invitation Not Working**
- Check if invitation has expired (7-day limit)
- Verify email address is correct
- Ensure user is logged in before accepting

**2. Cannot See Comments**
- Verify you have access to the project
- Check if issue ID is correct
- Refresh the page

**3. Activity Feed Empty**
- Activities are logged automatically
- Check date range filter
- Verify you have access to the project

**4. Permission Denied Errors**
- Confirm your role and permissions
- Contact project owner for access upgrade
- Check if you were removed from project

### Debug Mode

Enable debug logging:
```typescript
localStorage.setItem('DEBUG_COLLABORATION', 'true');
```

View logs in browser console for detailed error information.

---

## Future Enhancements

### Planned Features
- [ ] @mentions in comments
- [ ] Email notifications for comments
- [ ] Comment attachments (screenshots)
- [ ] Bulk member management
- [ ] Custom roles
- [ ] Team templates
- [ ] Activity export (PDF, CSV)
- [ ] Advanced search and filters
- [ ] Task assignment
- [ ] Due dates and reminders

---

## Support

### Need Help?
- Email: braynedigitech@gmail.com
- Documentation: `/docs`
- API Reference: `/api/docs`

### Contributing
Found a bug or have a suggestion? Please create an issue on our repository.

---

**Last Updated:** October 27, 2025  
**Version:** 2.0.0  
**© 2025 FixFirst SEO. Powered By Brayne Smart Solutions Corp.**

