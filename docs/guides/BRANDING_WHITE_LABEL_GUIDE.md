# Branding & White-Label System - Complete Guide

## 🎨 Overview
The Branding System allows you to fully customize the application's appearance through an easy-to-use admin panel interface. Perfect for white-labeling and reselling!

---

## ✨ Features

### Customizable Elements:
1. **App Name** - Change the application name/logo text
2. **Logo** - Upload custom logo image  
3. **Favicon** - Add custom browser icon
4. **Primary Color** - Main brand color for buttons, links
5. **Accent Color** - Secondary color for gradients, success states
6. **Footer Text** - Custom copyright and branding message

---

## 🚀 Quick Start

### Access Branding Settings:
1. Login as admin (`admin@seoaudit.com` / `password123`)
2. Go to **Admin Panel** (sidebar or press `Ctrl+K` → type "admin")
3. Click the **"Branding"** tab
4. Customize your settings
5. Click **"Save Branding"**
6. **Refresh your browser** to see changes

---

## 📝 Step-by-Step Guide

### 1. Change App Name

**What it does:** Changes "FixFirst SEO" to your brand name

**How to:**
1. Go to Admin Panel → Branding
2. Find "App Name/Logo Text" field
3. Enter your brand name (max 50 characters)
4. Save and refresh

**Example:**
```
YourCompany SEO Auditor
```

**Where it appears:**
- Sidebar logo
- Page titles
- Email headers
- Browser tab title

---

### 2. Add Custom Logo

**What it does:** Replaces text logo with your company logo image

**Requirements:**
- Recommended size: 200x50px
- Format: PNG or SVG preferred
- Must be a public URL

**How to:**

#### Option A: Using External Hosting (Recommended)
1. Upload logo to Cloudinary, AWS S3, or Imgur
2. Get the public URL
3. Paste URL in "Logo URL" field
4. Save and refresh

#### Option B: Using Local Files
1. Place your logo in `apps/web/public/` folder
   ```
   apps/web/public/logo.png
   ```
2. Use the public URL:
   ```
   http://localhost:3005/logo.png
   ```
   Or for production:
   ```
   https://yourdomain.com/logo.png
   ```
3. Save and refresh

---

### 3. Add Custom Favicon

**What it does:** Changes the browser tab icon

**Requirements:**
- Size: 32x32px
- Format: .ico or .png
- Must be a public URL

**How to:**
1. Place favicon in `apps/web/public/favicon.ico`
2. Use URL: `http://localhost:3005/favicon.ico`
3. Or upload to hosting service and use that URL
4. Paste URL in "Favicon URL" field
5. Save and refresh

**To see changes:**
- Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Or clear browser cache

---

### 4. Customize Brand Colors

**What it does:** Changes the color scheme throughout the app

**Primary Color:**
- Used for: Buttons, links, highlights, active states
- Default: `#06b6d4` (cyan/blue)

**Accent Color:**
- Used for: Success messages, gradients, secondary highlights
- Default: `#10b981` (green)

**How to:**
1. Click the color picker or enter hex code
2. Preview shows how colors look together
3. Save and refresh

**Color Picker Tips:**
- Use your brand's official colors
- Ensure good contrast with dark backgrounds
- Test in both light and dark modes

**Popular Color Combinations:**
```
Professional Blue:
Primary: #2563eb
Accent:  #3b82f6

Modern Purple:
Primary: #8b5cf6
Accent:  #a78bfa

Corporate Red:
Primary: #dc2626
Accent:  #ef4444

Tech Green:
Primary: #059669
Accent:  #10b981
```

---

### 5. Update Footer Text

**What it does:** Changes copyright and branding message

**Where it appears:**
- Footer of landing page
- Email footers
- PDF reports

**How to:**
1. Enter your text (max 200 characters)
2. Save and refresh

**Example:**
```
© 2025 YourCompany. All rights reserved.
```
or
```
© 2025 YourBrand SEO Tools. Powered by YourCompany Inc.
```

---

## 🗄️ Technical Details

### Database Storage

Branding settings are stored in the `settings` table:

```sql
{
  id: "branding",
  appName: "FixFirst SEO",
  logoUrl: "https://...",
  faviconUrl: "https://...",
  primaryColor: "#06b6d4",
  accentColor: "#10b981",
  footerText: "© 2025..."
}
```

### API Endpoints

**Get Branding Settings (Public):**
```
GET /api/branding
```

**Update Branding Settings (Admin Only):**
```
PATCH /api/branding
Authorization: Bearer <token>
{
  "appName": "Your App",
  "logoUrl": "https://...",
  "faviconUrl": "https://...",
  "primaryColor": "#2563eb",
  "accentColor": "#3b82f6",
  "footerText": "© 2025 Your Company"
}
```

### File Locations

```
Backend:
- Schema: prisma/schema.prisma (Settings model)
- API Routes: apps/api/src/routes/branding.ts
- Server: apps/api/src/server.ts

Frontend:
- Admin UI: apps/web/app/admin/page.tsx (BrandingTab)
- Public Assets: apps/web/public/
```

---

## 🎯 White-Labeling Checklist

Use this checklist when setting up for a client:

- [ ] Change app name to client's brand
- [ ] Upload client's logo
- [ ] Add client's favicon
- [ ] Set client's brand colors (primary & accent)
- [ ] Update footer text with client's company name
- [ ] Test on all pages (dashboard, audit results, landing)
- [ ] Check emails (welcome, audit complete, failed)
- [ ] Verify PDF exports show correct branding
- [ ] Update environment variables (FRONTEND_URL, etc.)
- [ ] Configure custom domain (if applicable)

---

## 💡 Advanced Customization

### Custom CSS/Themes

For more advanced theming beyond colors:

1. **Edit Tailwind Config:**
   ```typescript
   // apps/web/tailwind.config.ts
   theme: {
     extend: {
       colors: {
         primary: '#your-color',
         accent: '#your-accent',
       },
       fontFamily: {
         sans: ['Your Font', ...defaultTheme.fontFamily.sans],
       },
     },
   }
   ```

2. **Edit Global CSS:**
   ```css
   /* apps/web/app/globals.css */
   :root {
     --your-custom-var: #value;
   }
   ```

3. **Restart Dev Server:**
   ```bash
   cd apps/web
   npm run dev
   ```

---

## 🖼️ Logo & Favicon Best Practices

### Logo Guidelines:
- **Size:** 200x50px (or 4:1 ratio)
- **Format:** PNG with transparent background
- **File Size:** < 50KB for fast loading
- **Style:** Works well on dark backgrounds
- **Alternative:** SVG for scalability

### Favicon Guidelines:
- **Size:** 32x32px (standard)
- **Format:** .ico or .png
- **Fallbacks:** Provide 16x16px and 32x32px
- **File Size:** < 10KB
- **Tools:** Use favicon generator sites

### Where to Host Images:
1. **Cloudinary** (Recommended)
   - Free tier available
   - Image optimization
   - CDN delivery

2. **AWS S3**
   - Reliable
   - Scalable
   - Requires setup

3. **Imgur**
   - Quick and free
   - Less professional

4. **Local Files**
   - Place in `apps/web/public/`
   - Good for development
   - Need proper hosting for production

---

## 🔧 Troubleshooting

### Logo not showing?
**Check:**
- ✅ URL is accessible (open in browser)
- ✅ URL is public (not behind auth)
- ✅ Image file exists
- ✅ CORS headers allow your domain
- ✅ You refreshed the page after saving

**Fix:**
- Use direct image URL (not Google Drive share links)
- Test URL in incognito browser
- Check browser console for errors

---

### Colors not changing?
**Check:**
- ✅ Valid hex format (#06b6d4)
- ✅ Saved settings in admin panel
- ✅ Hard refreshed browser (Ctrl+Shift+R)
- ✅ Cleared browser cache

**Fix:**
- For persistent issues, edit `tailwind.config.ts` directly
- Restart dev server

---

### Favicon not updating?
**Check:**
- ✅ Cleared browser cache
- ✅ Hard refresh (Ctrl+Shift+R)
- ✅ Tried different browser
- ✅ Waited a few minutes

**Fix:**
- Favicons are aggressively cached
- Add version to URL: `favicon.ico?v=2`
- Close and reopen browser

---

### Changes not persisting?
**Check:**
- ✅ Logged in as admin
- ✅ Database is running
- ✅ API server is running
- ✅ No console errors

**Fix:**
- Check API server logs
- Verify database connection
- Check browser Network tab for failed requests

---

## 📊 Usage Examples

### Example 1: Tech Startup
```
App Name: TechFlow SEO
Primary Color: #6366f1 (Indigo)
Accent Color: #8b5cf6 (Purple)
Footer: © 2025 TechFlow Inc. All rights reserved.
```

### Example 2: Digital Agency
```
App Name: Digital Boost Analytics
Primary Color: #ef4444 (Red)
Accent Color: #f59e0b (Orange)
Footer: © 2025 Digital Boost Agency. Powered by [Your Company]
```

### Example 3: Enterprise Client
```
App Name: Enterprise SEO Dashboard
Primary Color: #1e40af (Deep Blue)
Accent Color: #3b82f6 (Blue)
Footer: © 2025 Enterprise Corp. Confidential & Proprietary.
```

---

## 🚀 Production Deployment

### Before Going Live:

1. **Set Production URLs:**
   ```bash
   # In apps/api/.env
   FRONTEND_URL=https://yourdomain.com
   ```

2. **Upload Assets to CDN:**
   - Don't use localhost URLs in production
   - Use Cloudinary, AWS S3, or your CDN

3. **Custom Domain:**
   - Point DNS to your server
   - Configure SSL certificate
   - Update FRONTEND_URL

4. **Test Everything:**
   - Logo displays correctly
   - Favicon shows in all browsers
   - Colors match brand guidelines
   - Footer text is accurate
   - Emails have correct branding

---

## 🎓 Tutorial Video Script

*(For creating training materials)*

**Step 1:** Login as admin
**Step 2:** Navigate to Admin Panel → Branding
**Step 3:** Update app name
**Step 4:** Add logo and favicon URLs
**Step 5:** Choose brand colors with picker
**Step 6:** Update footer text
**Step 7:** Click Save Branding
**Step 8:** Refresh browser
**Step 9:** Verify changes on all pages

---

## 📝 Maintenance

### Regular Tasks:
- Update footer copyright year annually
- Refresh brand colors if company rebrands
- Ensure logo/favicon URLs remain valid
- Test after major updates

### Backup Settings:
```bash
# Export current branding settings
GET /api/branding

# Save the response JSON
# Import by PATCH /api/branding with saved data
```

---

## 💰 Monetization Ideas

### For SaaS Businesses:
- **Basic Plan:** Fixed branding with your company name
- **Pro Plan:** Custom app name + footer
- **Agency Plan:** Full white-labeling (logo, favicon, colors)
- **Enterprise Plan:** Custom domain + full branding

### For Freelancers:
- Charge setup fee for white-labeling
- Monthly fee for hosting under client domain
- One-time fee for full source code

---

## 🔒 Security Notes

- Only admins can update branding settings
- Logo/Favicon URLs are not validated for security
- Use trusted hosting services for images
- Validate hex color format to prevent injection
- Sanitize footer text in production

---

## 🎉 Success Stories

### "Rebranded in 5 Minutes!"
> "I was able to completely rebrand the tool for my client in under 5 minutes. The color preview and intuitive interface made it super easy!"
> — Agency Owner

### "Perfect for White-Labeling"
> "We resell this to 10+ clients, each with their own branding. The admin panel makes it simple to manage all of them."
> — SaaS Entrepreneur

---

**Version:** 1.0.0  
**Last Updated:** October 27, 2025  
**Author:** Brayne Smart Solutions Corp.

---

© 2025 FixFirst SEO. Powered By Brayne Smart Solutions Corp.

---

## Quick Reference Card

```
┌─────────────────────────────────────┐
│   BRANDING QUICK REFERENCE          │
├─────────────────────────────────────┤
│ Access: Admin Panel → Branding      │
│ Save: Click "Save Branding" button  │
│ Apply: Refresh browser (F5)         │
│                                     │
│ App Name:   1-50 characters         │
│ Logo:       200x50px PNG/SVG        │
│ Favicon:    32x32px .ico/.png       │
│ Colors:     Hex format (#xxxxxx)    │
│ Footer:     1-200 characters        │
└─────────────────────────────────────┘
```

