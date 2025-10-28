# FixFirst SEO - Team Collaboration Quick Start

## 🚀 5-Minute Setup Guide

### Step 1: Access the Application
```
Frontend: http://localhost:3005
API: http://localhost:3001
```

### Step 2: Navigate to Project Settings
```
1. Login to your account
2. Go to Dashboard
3. Create or select a project
4. Navigate to: /project/{your-project-id}
```

### Step 3: Invite Your First Team Member
```
1. Click "Invite Member" button
2. Enter email: colleague@example.com
3. Select role: MEMBER
4. Click "Send Invite"
5. Share the invitation link with your colleague
```

### Step 4: Accept Invitation (as invited user)
```
1. Click the invitation link
2. Login or create an account
3. Click "Accept Invitation"
4. You're now part of the team!
```

### Step 5: Start Collaborating
```
1. View audit results
2. Click on any issue
3. Add a comment
4. Check the Activity feed
```

---

## 🎯 Quick Access URLs

| Feature | URL | Description |
|---------|-----|-------------|
| Dashboard | `/dashboard` | Main dashboard |
| Project Settings | `/project/{id}` | Team management & settings |
| Audit Results | `/audit/{id}` | View audit with comments |
| Accept Invite | `/invite/{token}` | Accept team invitation |
| Schedules | `/schedules` | Scheduled audits |
| Admin Panel | `/admin` | Admin features (admin only) |

---

## 💡 Common Tasks

### Invite a Team Member
```http
POST /api/teams/{projectId}/invite
{
  "email": "user@example.com",
  "role": "MEMBER"
}
```

### Add Comment to Issue
```http
POST /api/comments/issue/{issueId}
{
  "content": "Fixed this issue by updating robots.txt"
}
```

### View Team Activities
```http
GET /api/activities/project/{projectId}?limit=50
```

### Check Project Members
```http
GET /api/teams/{projectId}/members
```

---

## 🔐 Quick Role Reference

| Action | OWNER | ADMIN | MEMBER | VIEWER |
|--------|-------|-------|--------|--------|
| Invite | ✅ | ✅ | ❌ | ❌ |
| Comment | ✅ | ✅ | ✅ | ❌ |
| Run Audit | ✅ | ✅ | ❌ | ❌ |
| View Results | ✅ | ✅ | ✅ | ✅ |

---

## 🎨 Component Usage

### TeamManagement
```tsx
import TeamManagement from '@/components/TeamManagement';

<TeamManagement 
  projectId={projectId}
  isOwner={isOwner}
  isAdmin={isAdmin}
  currentUserId={userId}
/>
```

### IssueComments
```tsx
import IssueComments from '@/components/IssueComments';

<IssueComments 
  issueId={issueId}
  currentUserEmail={userEmail}
/>
```

### ActivityFeed
```tsx
import ActivityFeed from '@/components/ActivityFeed';

// Project-specific
<ActivityFeed projectId={projectId} limit={50} />

// Global feed
<ActivityFeed limit={20} />
```

---

## 🐛 Troubleshooting

**Invitation not working?**
- Check if expired (7 days)
- Verify correct email
- Login before accepting

**Can't see comments?**
- Verify project access
- Refresh the page
- Check browser console

**Permission denied?**
- Check your role
- Contact project owner
- Verify you're still a member

---

## 📚 Full Documentation

- **Complete Guide:** `TEAM_COLLABORATION_GUIDE.md`
- **Implementation Details:** `PHASE2_IMPLEMENTATION_SUMMARY.md`
- **API Reference:** See code comments

---

## ✨ Pro Tips

1. **Use roles effectively:**
   - OWNER: Project lead
   - ADMIN: Tech leads
   - MEMBER: Developers
   - VIEWER: Stakeholders

2. **Add context in comments:**
   - What you fixed
   - How you fixed it
   - Link to relevant docs

3. **Monitor activity feed:**
   - Track team engagement
   - Identify bottlenecks
   - Stay informed

4. **Set up Slack notifications:**
   - Go to Settings
   - Add Slack webhook URL
   - Get notified instantly

---

## 🎉 You're Ready!

Start collaborating with your team now!

**Questions?** Check `TEAM_COLLABORATION_GUIDE.md`

**© 2025 FixFirst SEO. Powered By Brayne Smart Solutions Corp.**

