# Testing the Command Palette (⌘K)

## ✅ Quick Test Checklist

### 1. **Open the Command Palette**
- [ ] Press `Ctrl + K` (Windows) or `⌘ + K` (Mac)
- [ ] Palette should appear centered on screen
- [ ] Background should be blurred
- [ ] Search input should be auto-focused

### 2. **Basic Navigation**
- [ ] Type "dashboard" → Should show "Go to Dashboard"
- [ ] Press `Enter` → Should navigate to dashboard
- [ ] Press `Ctrl/⌘ + K` again to reopen

### 3. **Search Functionality**
- [ ] Type "settings" → Should filter to Settings command
- [ ] Type "admin" → Should show Admin Panel
- [ ] Type nonsense → Should show "No results found"
- [ ] Clear search → All commands should reappear

### 4. **Keyboard Navigation**
- [ ] Open palette
- [ ] Press `↓` arrow → Highlights next command
- [ ] Press `↑` arrow → Highlights previous command
- [ ] Press `Enter` → Executes highlighted command
- [ ] Press `ESC` → Closes palette

### 5. **Recent Audits**
- [ ] Open palette
- [ ] Scroll down to "Recent Audits" section
- [ ] Should see your last 5 audits
- [ ] Click one → Should navigate to audit details page

### 6. **Projects**
- [ ] Create a project first (if you haven't)
- [ ] Open palette
- [ ] Look for "Projects" section
- [ ] Should list all your projects

### 7. **Start New Audit Action**
- [ ] Open palette
- [ ] Type "new audit"
- [ ] Press `Enter`
- [ ] Should navigate to dashboard AND open the "New Audit" modal

### 8. **Mouse Interaction**
- [ ] Open palette
- [ ] Hover over commands → Should highlight
- [ ] Click a command → Should execute
- [ ] Click outside palette (backdrop) → Should close

### 9. **Visual Elements**
- [ ] Check sidebar on dashboard
- [ ] Should see "Quick Navigation" hint with `⌘K` / `Ctrl+K` keys
- [ ] Keys should be styled as `<kbd>` elements

### 10. **Close Mechanisms**
- [ ] `ESC` key → Closes palette
- [ ] `Ctrl/⌘ + K` again → Toggles closed
- [ ] Click backdrop → Closes palette
- [ ] Execute command → Closes palette automatically

---

## 🧪 Advanced Tests

### Search Aliases
- [ ] Type "home" → Should find Dashboard
- [ ] Type "profile" → Should find Settings
- [ ] Type "create" → Should find "Start New Audit"

### Category Grouping
- [ ] Open palette
- [ ] Should see sections: "Navigation", "Actions", "Recent Audits", "Projects"
- [ ] Each section should have a header

### Edge Cases
- [ ] Open palette with no audits → Should only show static commands
- [ ] Open palette with no projects → Projects section shouldn't show
- [ ] Search with no matches → Should show helpful "No results" message

---

## 🎯 Expected Behavior

### When Palette Opens:
1. **Backdrop**: Semi-transparent black with blur
2. **Modal**: White card in center (or dark if using dark theme)
3. **Search Input**: Auto-focused, placeholder text visible
4. **Commands**: Grouped by category
5. **Footer**: Shows keyboard shortcuts

### When Typing:
1. **Instant filtering**: Results update as you type
2. **Highlight reset**: First item is always selected
3. **Category headers**: Only show if category has results

### When Navigating:
1. **Arrow keys**: Move highlight up/down
2. **Visual feedback**: Selected item has primary color background
3. **Enter key icon**: Shows `↵` on selected item

### When Closing:
1. **Animation**: Smooth fade out
2. **State reset**: Search cleared, index reset
3. **Focus return**: Page behind regains focus

---

## 🐛 Common Issues & Fixes

### Issue: Palette doesn't open
**Fix**: 
- Check browser console for errors
- Verify JavaScript is enabled
- Try refreshing the page

### Issue: Search not working
**Fix**:
- Click inside the search input
- Check that you're typing in the right field

### Issue: Commands not showing
**Fix**:
- Check that you're logged in
- Verify API is running
- Check network tab for failed requests

### Issue: Keyboard shortcuts conflict
**Fix**:
- Some browsers use `Ctrl+K` for search
- Try using `⌘K` on Mac
- Check browser extensions for conflicts

---

## 📸 Visual Reference

### Closed State:
- ✅ No visible modal
- ✅ Sidebar hint visible: "Quick Navigation ⌘K"

### Open State:
- ✅ Backdrop blur effect
- ✅ Centered modal with search bar
- ✅ Commands listed by category
- ✅ Footer with keyboard hints

### Active Search:
- ✅ Filtered results
- ✅ Highlighted selection
- ✅ Enter key indicator

---

## 🚀 How to Start Testing

1. **Start the dev server**:
   ```powershell
   cd apps/web
   npm run dev
   ```

2. **Open in browser**: http://localhost:3005

3. **Login** to your account

4. **Navigate to Dashboard**

5. **Press `Ctrl + K`** (or `⌘ + K` on Mac)

6. **Follow the checklist above** ✅

---

## ✨ Pro Tips

- Use the command palette for **EVERYTHING**
- It's faster than clicking around
- Practice the keyboard shortcuts
- Try different search terms
- Check the sidebar hint for a reminder

---

**Happy Testing!** 🎉

If you find any issues, check the browser console for error messages.

---

© 2025 FixFirst SEO. Powered By Brayne Smart Solutions Corp.

