# Failed Audits Cleanup Feature

## Overview
Added functionality to manage and remove failed audits from the dashboard, giving users multiple options to handle audit failures.

## User Request
> "Can we have an option to remove all failed audits? what do you think is the best to do?"

## Solution Implemented
Implemented a **three-tier approach** for maximum flexibility:

1. **Retry Button** - Allows users to retry a failed audit with the same URL
2. **Individual Delete Button** - Remove specific failed audits one at a time
3. **Bulk Delete Button** - Clear all failed audits at once

## Features

### 1. **Action Buttons on Failed Audits**
Failed audit rows now display two action buttons:
- **🔄 Retry (Blue)** - Starts a new audit with the same URL
- **🗑️ Delete (Red)** - Removes the failed audit from the list

### 2. **"Clear Failed Audits" Button**
- Appears in the dashboard header only when failed audits exist
- Deletes all failed audits in one click
- Shows confirmation dialog before deletion
- Displays count of deleted audits

### 3. **Smart UI Behavior**
- Action buttons only appear on failed audits (not completed/running)
- Clicking buttons stops event propagation (doesn't trigger row click)
- Hover effects and tooltips for better UX
- Toast notifications for all actions

## Implementation Details

### Frontend Changes

#### **`apps/web/app/dashboard/page.tsx`**

1. **Added new icons:**
```typescript
import { Trash2, RotateCcw } from 'lucide-react'
```

2. **Updated useQuery to expose refetch:**
```typescript
const { data: audits, isLoading: auditsLoading, refetch: refetchAudits } = useQuery({...})
```

3. **Added "Clear Failed Audits" button in header:**
```typescript
{audits && audits.filter((a: any) => a.status === 'FAILED').length > 0 && (
  <button onClick={...} className="btn-secondary">
    <Trash2 className="w-4 h-4" />
    Clear Failed Audits
  </button>
)}
```

4. **Updated AuditRow component:**
- Added `onDelete` and `onRetry` optional props
- Split click handler to only trigger on URL area
- Added action buttons for failed audits:
```typescript
{audit.status === 'FAILED' && (
  <div className="flex items-center gap-2">
    <button onClick={(e) => { e.stopPropagation(); onRetry?.() }}>
      <RotateCcw className="w-4 h-4" />
    </button>
    <button onClick={(e) => { e.stopPropagation(); onDelete?.() }}>
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
)}
```

5. **Implemented handlers:**
- **onDelete:** Confirms, deletes audit, shows toast, refetches list
- **onRetry:** Creates new audit with same URL, navigates to new audit page
- **Clear Failed:** Bulk deletes all failed audits

#### **`apps/web/lib/api.ts`**

Added new API method:
```typescript
deleteFailed: () => api.delete('/api/audits/failed')
```

### Backend Changes

#### **`apps/api/src/routes/audits.ts`**

Added new endpoint **before** the `/:id` delete route (to avoid route conflicts):

```typescript
// DELETE /api/audits/failed
router.delete('/failed', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const result = await prisma.audit.deleteMany({
      where: {
        status: 'FAILED',
        project: { userId: req.userId },
      },
    });

    res.json({ 
      message: 'Failed audits deleted', 
      count: result.count 
    });
  } catch (error) {
    next(error);
  }
});
```

**Important:** Placed before `/:id` route to ensure `/failed` is matched first (Express matches routes in order).

## API Endpoints

### Delete Single Audit
- **Method:** `DELETE`
- **Route:** `/api/audits/:id`
- **Auth:** Required
- **Response:** `{ message: 'Audit deleted' }`

### Delete All Failed Audits
- **Method:** `DELETE`
- **Route:** `/api/audits/failed`
- **Auth:** Required
- **Response:** `{ message: 'Failed audits deleted', count: number }`

## User Flow

### Retry Failed Audit
1. User sees failed audit in dashboard
2. Clicks **Retry** button (🔄)
3. Toast shows "Starting new audit..."
4. New audit created with same URL
5. User redirected to new audit page
6. Toast shows "New audit started!"

### Delete Single Failed Audit
1. User sees failed audit in dashboard
2. Clicks **Delete** button (🗑️)
3. Confirmation dialog: "Are you sure you want to delete this audit?"
4. User confirms
5. Toast shows "Deleting audit..."
6. Audit deleted from database
7. Toast shows "Audit deleted!"
8. Audit list refreshed automatically

### Bulk Delete Failed Audits
1. User has multiple failed audits
2. "Clear Failed Audits" button appears in header
3. User clicks button
4. Confirmation dialog: "Are you sure you want to delete all failed audits?"
5. User confirms
6. Toast shows "Deleting failed audits..."
7. All failed audits deleted from database
8. Toast shows "Failed audits deleted!"
9. Audit list refreshed automatically
10. Button disappears (no more failed audits)

## UI/UX Enhancements

### Visual Design
- **Retry Button:** 
  - Sea blue color (`text-primary`)
  - Hover: Lighter blue
  - Icon: Rotating CCW arrow
  
- **Delete Button:**
  - Red color (`text-error`)
  - Hover: Slightly darker red
  - Icon: Trash can

- **Clear Failed Button:**
  - Secondary style (matches existing buttons)
  - Only visible when failed audits exist
  - Positioned in section header

### Interactions
- **Event Propagation:** Action buttons stop click propagation to prevent opening audit details
- **Hover Effects:** Background changes on hover for better feedback
- **Tooltips:** `title` attributes on buttons for accessibility
- **Confirmations:** Native confirm dialogs prevent accidental deletions
- **Toast Notifications:** 
  - Loading state during operations
  - Success messages with checkmark
  - Error messages if something fails

## Security & Data Integrity

1. **Authentication Required:** All delete endpoints require valid JWT token
2. **User Scoping:** Can only delete own audits (checked via project ownership)
3. **Cascade Deletes:** Prisma handles deletion of related records (pages, issues)
4. **Confirmation Dialogs:** Prevents accidental bulk deletions
5. **Optimistic UI:** Refetches data after operations to ensure consistency

## Testing Checklist

- ✅ Retry button appears only on failed audits
- ✅ Delete button appears only on failed audits
- ✅ "Clear Failed Audits" button only appears when failed audits exist
- ✅ Action buttons don't trigger row click event
- ✅ Retry creates new audit with correct URL
- ✅ Delete removes single audit
- ✅ Bulk delete removes all failed audits
- ✅ Confirmation dialogs prevent accidental deletions
- ✅ Toast notifications show for all actions
- ✅ Audit list refreshes after operations
- ✅ No linting errors
- ✅ Backend validates user ownership
- ✅ Failed audits count updates in button visibility

## Future Enhancements (Optional)

1. **Bulk Actions:** Add checkboxes for selective bulk deletion
2. **Auto-Cleanup:** Automatically delete failed audits older than X days
3. **Retry with Changes:** Allow editing URL before retry
4. **Batch Retry:** Retry multiple failed audits at once
5. **Failure Reasons:** Display why an audit failed (missing browser, network error, etc.)
6. **Export Failed Audits:** Download list of failed audits for analysis

## Files Modified

- ✅ `apps/web/app/dashboard/page.tsx` - Added buttons and handlers
- ✅ `apps/web/lib/api.ts` - Added `deleteFailed` method
- ✅ `apps/api/src/routes/audits.ts` - Added bulk delete endpoint

## No Breaking Changes
- All changes are additive
- Existing functionality preserved
- Backward compatible with current API

---

**Result:** Users now have full control over managing failed audits with three distinct options: retry individual audits, delete specific failed audits, or clear all failed audits at once. This improves UX by allowing users to clean up their dashboard and retry audits that may have failed due to temporary issues (like missing Playwright browsers).

