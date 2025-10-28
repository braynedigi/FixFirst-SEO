# File Upload Feature - Logo & Favicon

## 🎉 What's New

You can now **directly upload** logo and favicon files through the admin panel! No more need for external hosting or manual file placement.

---

## ✨ Features

### 1. **Drag & Drop Upload**
- Click the upload area or drag files directly
- Instant upload with progress indication
- Real-time preview of uploaded images

### 2. **Automatic Saving**
- Files are automatically saved to the server
- No need to click "Save Branding" after upload
- Instant preview updates

### 3. **Dual Input Method**
- Upload files directly (recommended)
- Or enter URL manually (for external hosting)
- Both methods work seamlessly

### 4. **Smart Validation**
- File size limit: 2MB max
- Allowed formats: PNG, JPG, GIF, SVG for logo
- Allowed formats: ICO, PNG for favicon
- Automatic file type checking

### 5. **Instant Preview**
- See your logo/favicon immediately after upload
- Preview updates in real-time
- Error handling for invalid images

---

## 🚀 How to Use

### Upload Logo:

1. Go to **Admin Panel → Branding** tab
2. Find the **"Logo" section**
3. Click **"Click to upload logo"** area
4. Select your logo file (PNG, JPG, GIF, or SVG)
5. ✅ Done! Logo is uploaded and saved automatically
6. See instant preview on the right

### Upload Favicon:

1. Same page, find **"Favicon" section**
2. Click **"Click to upload favicon"** area
3. Select your favicon file (ICO or PNG, 32x32px recommended)
4. ✅ Done! Favicon uploaded automatically
5. Preview appears instantly

### Alternative - URL Method:

If you prefer using external hosting:
1. Upload to Cloudinary, AWS S3, etc.
2. Enter the URL in the text input below the upload area
3. Preview updates automatically

---

## 📁 File Storage

### Where Files are Stored:
```
apps/api/uploads/
├── branding-logo-1234567890.png
├── branding-favicon-1234567890.ico
└── ...
```

### File Naming:
- Format: `branding-{type}-{timestamp}.{ext}`
- Example: `branding-logo-1698765432.png`
- Prevents name conflicts automatically

### Access Files:
Files are served at:
```
http://localhost:3001/uploads/branding-logo-1234567890.png
```

---

## 🎯 Technical Details

### Backend:

**New Files:**
- `apps/api/src/middleware/upload.ts` - Multer configuration
- `apps/api/uploads/` - File storage directory

**New Endpoints:**
```
POST /api/branding/upload/logo
POST /api/branding/upload/favicon
DELETE /api/branding/upload/:filename
```

**File Validation:**
- Max size: 2MB
- MIME type checking
- Extension validation
- Automatic cleanup on error

### Frontend:

**New Features:**
- File input with hidden styling
- Drag & drop zones
- Upload progress indicators
- Image preview components
- FormData handling

---

## ⚙️ Configuration

### Environment Variables:

Add to `apps/api/.env` (optional):
```bash
API_URL=http://localhost:3001
```

This determines the base URL for uploaded file access.

---

## 🔒 Security

### Measures Implemented:
- ✅ Admin-only access (authentication required)
- ✅ File type validation (MIME + extension)
- ✅ File size limits (2MB max)
- ✅ Unique filenames (timestamp-based)
- ✅ Error handling with cleanup
- ✅ Safe file storage location

---

## 📊 File Specifications

### Logo:
- **Recommended Size:** 200x50px (4:1 ratio)
- **Max File Size:** 2MB
- **Formats:** PNG, JPG, GIF, SVG
- **Best Format:** PNG with transparent background
- **Usage:** Sidebar, headers, emails

### Favicon:
- **Recommended Size:** 32x32px
- **Max File Size:** 2MB
- **Formats:** ICO, PNG
- **Best Format:** ICO or PNG
- **Usage:** Browser tabs, bookmarks

---

## 💡 Pro Tips

### For Best Results:
1. **Optimize images** before uploading (use TinyPNG, ImageOptim)
2. **Use transparent backgrounds** for logos (PNG format)
3. **Test logos** on both light and dark backgrounds
4. **Generate multiple favicon sizes** (16x16, 32x32, 48x48)
5. **Keep file sizes small** for faster loading

### Favicon Generation:
Use online tools like:
- https://realfavicongenerator.net/
- https://favicon.io/
- https://www.favicon-generator.org/

---

## 🐛 Troubleshooting

### Upload Failed?

**Check:**
- ✅ File size is under 2MB
- ✅ File format is supported
- ✅ You're logged in as admin
- ✅ API server is running
- ✅ `uploads/` folder exists

**Solutions:**
- Compress large images
- Convert unsupported formats
- Check browser console for errors
- Verify network connection

### Preview Not Showing?

**Check:**
- ✅ Image uploaded successfully
- ✅ File URL is accessible
- ✅ No CORS issues
- ✅ Image format is valid

**Solutions:**
- Try refreshing the page
- Check browser console for errors
- Verify file permissions
- Try a different image

### File Not Accessible?

**Check:**
- ✅ API server is serving static files
- ✅ Correct URL format
- ✅ File actually exists in `uploads/` folder

**URL Format:**
```
http://localhost:3001/uploads/branding-logo-1234567890.png
```

---

## 🔄 Migration from URL to Upload

If you currently use URLs, you can:

1. **Keep using URLs** - They still work!
2. **Switch to uploads** - Just upload files
3. **Use both** - Upload for some, URL for others

No breaking changes! Both methods coexist peacefully.

---

## 📦 Dependencies Added

```json
{
  "multer": "^1.4.5-lts.1",
  "@types/multer": "^1.4.11"
}
```

---

## 🚀 Production Deployment

### Before Going Live:

1. **Set API_URL** in production `.env`:
   ```bash
   API_URL=https://api.yourdomain.com
   ```

2. **Ensure `uploads/` folder** has write permissions:
   ```bash
   chmod 755 apps/api/uploads
   ```

3. **Consider CDN** for better performance:
   - Upload files to AWS S3, Cloudinary
   - Or use the built-in file storage

4. **Backup uploaded files**:
   - Regular backups of `uploads/` folder
   - Or sync to cloud storage

5. **Monitor disk space**:
   - Set up alerts for low disk space
   - Implement cleanup for old files (if needed)

---

## 📈 Usage Statistics

Track uploaded files:
```bash
# Count uploaded files
ls -1 apps/api/uploads | wc -l

# Check total size
du -sh apps/api/uploads

# List recent uploads
ls -lt apps/api/uploads | head -10
```

---

## 🎓 For Developers

### Adding New File Types:

Edit `apps/api/src/middleware/upload.ts`:
```typescript
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|gif|svg|ico|webp/; // Add webp
  // ...
};
```

### Changing File Size Limit:

```typescript
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Change to 5MB
  },
  fileFilter: fileFilter,
});
```

### Adding New Upload Endpoints:

```typescript
router.post('/upload/banner', authenticate, requireAdmin, 
  upload.single('banner'), async (req, res, next) => {
  // Handle banner upload
});
```

---

## 🎉 Benefits

### Before:
❌ Manual file placement in `public/` folder  
❌ Restart server after adding files  
❌ Complex URL management  
❌ External hosting required  
❌ No instant preview  

### After:
✅ Click to upload from browser  
✅ Instant upload and preview  
✅ No server restart needed  
✅ Built-in file storage  
✅ Automatic URL generation  
✅ Real-time feedback  

---

## 📞 Support

### Common Questions:

**Q: Can I delete uploaded files?**  
A: Yes, upload a new file to replace the old one. Old files can be manually deleted from `uploads/` folder.

**Q: Where are files stored?**  
A: In `apps/api/uploads/` directory on your server.

**Q: Can users upload files?**  
A: No, only admins can upload branding files.

**Q: What happens to old files when I upload new ones?**  
A: Old files remain in the folder. You can manually clean them up periodically.

**Q: Can I use external URLs still?**  
A: Yes! The URL input method still works alongside file uploads.

---

## ✅ Quick Checklist

- [x] Multer installed and configured
- [x] Upload middleware created
- [x] API endpoints added
- [x] Static file serving enabled
- [x] Frontend file inputs added
- [x] Image preview working
- [x] File validation implemented
- [x] Error handling added
- [x] Security measures in place
- [x] Documentation complete

---

**Your file upload system is ready to use!** 🎉

Just refresh your admin panel and try uploading a logo or favicon!

---

**Version:** 1.0.0  
**Last Updated:** October 27, 2025  
**Author:** Brayne Smart Solutions Corp.

---

© 2025 FixFirst SEO. Powered By Brayne Smart Solutions Corp.

