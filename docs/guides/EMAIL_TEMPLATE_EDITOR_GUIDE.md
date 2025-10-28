# 📧 Email Template Editor - Complete Guide

## ✅ What's New

You can now **edit email templates directly from the admin panel** - no code editing required!

---

## 🚀 How to Use

### **1. Access the Template Editor**
1. Login as **admin**
2. Navigate to **Admin Panel** → **Email Templates** tab
3. You'll see 3 templates:
   - **Audit Complete** - Sent when audits finish
   - **Project Invitation** - Sent when users are invited
   - **Weekly Digest** - Weekly summary emails

### **2. Edit a Template**
1. Click the **"Edit"** button on any template card
2. Modify any of these fields:
   - **Template Name** - Display name
   - **Email Subject** - Subject line (supports variables)
   - **Description** - Internal description
   - **HTML Content** - Full email HTML (large textarea)
   - **Is Active** - Toggle to enable/disable

3. Click **"Save"** to apply changes
4. Or **"Cancel"** to discard

### **3. Reset to Default**
- Click the **"↻" (Reset)** button
- Confirms before resetting
- Restores the original default template

---

## 🎨 Using Template Variables

Templates support dynamic variables that get replaced with real data:

### **Common Variables:**
```
{{project.name}}        - Project name
{{project.domain}}      - Project domain  
{{user.email}}          - User's email address
{{frontendUrl}}         - Your frontend URL
{{year}}                - Current year
```

### **Audit-Specific Variables:**
```
{{audit.overallScore}}  - Overall SEO score
{{audit.grade}}         - Score grade (A, B, C, etc.)
{{audit.performanceScore}} - Performance score
{{audit.seoScore}}      - SEO score
{{auditUrl}}            - Direct link to audit
{{projectUrl}}          - Direct link to project
```

### **Invitation-Specific Variables:**
```
{{invitedBy.email}}     - Email of person who invited
{{invitation.role}}     - Role being assigned
{{invitation.expiresAt}}  - Expiration date
{{inviteUrl}}           - Invitation acceptance link
{{rolePermissions}}     - List of role permissions
```

### **Example Usage:**
```html
<h1>Hello {{user.email}}!</h1>
<p>Your audit for {{project.name}} scored {{audit.overallScore}}/100!</p>
<a href="{{auditUrl}}">View Report</a>
```

---

## 🛠️ Technical Details

### **Database Storage**
- All templates stored in `email_templates` table
- Fields: `key`, `name`, `subject`, `htmlContent`, `description`, `isActive`
- Unique key for each template type

### **Backend API Endpoints**
```
GET    /api/email-templates           - List all templates
GET    /api/email-templates/:key      - Get single template
PUT    /api/email-templates/:key      - Update template
POST   /api/email-templates/:key/reset - Reset to default
```

### **Auto-Creation**
- Default templates are automatically created on first access
- No manual setup required!

### **Files Modified:**
1. ✅ `prisma/schema.prisma` - Added `EmailTemplate` model
2. ✅ `apps/api/src/routes/email-templates.ts` - API routes
3. ✅ `apps/api/src/server.ts` - Route registration
4. ✅ `apps/web/lib/api.ts` - API client methods
5. ✅ `apps/web/app/admin/page.tsx` - UI editor component

---

## 📝 Best Practices

### **1. HTML Structure**
- Maintain proper HTML structure (`<!DOCTYPE>`, `<html>`, `<body>`)
- Use inline CSS for styling (email clients don't support external CSS)
- Test in multiple email clients if possible

### **2. Responsive Design**
- Use `max-width` and percentage widths
- Stack elements on mobile
- Keep text readable at all sizes

### **3. Variables**
- Always use `{{variableName}}` format
- Check spelling carefully
- View existing templates for reference

### **4. Testing**
- Save changes
- Trigger the actual email (run audit, send invitation)
- Check your inbox
- Adjust if needed

### **5. Backup**
- Copy your HTML before major changes
- Use the Reset button if something breaks
- Keep track of what works well

---

## 🎨 **Customization Ideas**

### **Colors**
Change the gradient colors:
```html
<!-- Default -->
<div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);">

<!-- Your Brand -->
<div style="background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);">
```

### **Fonts**
```html
<style>
  body { 
    font-family: 'Your Font', -apple-system, sans-serif;
  }
</style>
```

### **Logo**
Add your logo:
```html
<div style="text-align: center; padding: 20px;">
  <img src="https://your-domain.com/logo.png" alt="Logo" style="max-width: 150px;" />
</div>
```

### **Footer**
Customize footer:
```html
<div class="footer">
  <p>&copy; {{year}} Your Company. All rights reserved.</p>
  <p>123 Your Street, Your City, Your Country</p>
  <p><a href="{{frontendUrl}}/unsubscribe">Unsubscribe</a></p>
</div>
```

---

## ⚠️ Troubleshooting

### **Template Not Saving?**
- Check if you're logged in as admin
- Ensure HTML is valid
- Check browser console for errors

### **Variables Not Replacing?**
- Double-check variable names
- Ensure proper `{{variableName}}` format
- Some variables only work in specific templates

### **Email Not Sending?**
- Template changes affect future emails only
- Check Email Settings tab for SMTP configuration
- Verify email service is enabled

### **HTML Looks Broken?**
- Use the Reset button to restore defaults
- Check for unclosed HTML tags
- Validate HTML structure

---

## 🔥 Quick Start Example

**Simple Custom Template:**

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .header { background: #1e40af; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .button { background: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Great News!</h1>
  </div>
  
  <div class="content">
    <p>Hi there,</p>
    <p>Your SEO audit for <strong>{{project.name}}</strong> is complete!</p>
    <p><strong>Score: {{audit.overallScore}}/100</strong></p>
    <p><a href="{{auditUrl}}" class="button">View Full Report</a></p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
    <p>&copy; {{year}} Your Company</p>
  </div>
</body>
</html>
```

---

## 🎯 Next Steps

1. **Test the Editor**: Edit a template and save it
2. **Trigger an Email**: Run an audit to test the audit-complete template
3. **Customize**: Add your branding, colors, and logo
4. **Monitor**: Check that emails are sending correctly

---

## 💡 Pro Tips

- ✅ Start with small changes
- ✅ Keep a backup of working templates
- ✅ Test variables before big changes  
- ✅ Use the Reset button if unsure
- ✅ Check email in different clients (Gmail, Outlook, etc.)

---

**Need Help?** The default templates are professionally designed and work great out of the box!


