# 🔐 Two-Factor Authentication (2FA) Guide

## Overview

FixFirst SEO now supports Two-Factor Authentication (2FA) using TOTP (Time-based One-Time Password), compatible with Google Authenticator, Authy, 1Password, and other authenticator apps.

---

## Features

✅ **TOTP Support** - Compatible with all major authenticator apps  
✅ **QR Code Setup** - Easy setup by scanning a QR code  
✅ **Backup Codes** - 10 single-use backup codes for account recovery  
✅ **Seamless Login** - Integrated 2FA verification during login  
✅ **Code Regeneration** - Regenerate backup codes when needed  

---

## For Users

### Enabling 2FA

1. **Navigate to Profile Settings**
   - Go to your profile → Security tab
   - Click "Setup 2FA"

2. **Scan QR Code**
   - Open your authenticator app (Google Authenticator, Authy, etc.)
   - Scan the QR code displayed on screen
   - Or manually enter the secret key

3. **Verify Setup**
   - Enter the 6-digit code from your authenticator app
   - Click "Verify and Enable"

4. **Save Backup Codes**
   - **IMPORTANT:** Download or copy your 10 backup codes
   - Store them in a safe place (password manager, secure note)
   - Each code can only be used once

### Logging In with 2FA

1. Enter your email and password as usual
2. When prompted, enter the 6-digit code from your authenticator app
3. Or use one of your backup codes if you don't have access to your app

### Managing 2FA

**Regenerate Backup Codes:**
- Go to Profile → Security
- Click "Regenerate Backup Codes"
- Enter your current 2FA code to confirm
- Save the new codes securely

**Disable 2FA:**
- Go to Profile → Security
- Enter your current 2FA code
- Click "Disable 2FA"
- ⚠️ Warning: This makes your account less secure

---

## For Developers

### Backend API Endpoints

#### Check 2FA Status
```
GET /api/2fa/status
Authorization: Bearer {token}

Response:
{
  "enabled": boolean,
  "remainingBackupCodes": number
}
```

#### Setup 2FA (Generate Secret)
```
POST /api/2fa/setup
Authorization: Bearer {token}
Body: { "email": "user@example.com" }

Response:
{
  "secret": "BASE32_SECRET",
  "qrCodeDataUrl": "data:image/png;base64,...",
  "otpauthUrl": "otpauth://totp/..."
}
```

#### Enable 2FA
```
POST /api/2fa/enable
Authorization: Bearer {token}
Body: {
  "secret": "BASE32_SECRET",
  "token": "123456"
}

Response:
{
  "message": "2FA enabled successfully",
  "backupCodes": ["XXXX-XXXX", "XXXX-XXXX", ...]
}
```

#### Disable 2FA
```
POST /api/2fa/disable
Authorization: Bearer {token}
Body: { "token": "123456" }

Response:
{
  "message": "2FA disabled successfully"
}
```

#### Regenerate Backup Codes
```
POST /api/2fa/backup-codes/regenerate
Authorization: Bearer {token}
Body: { "token": "123456" }

Response:
{
  "message": "Backup codes regenerated successfully",
  "backupCodes": ["XXXX-XXXX", "XXXX-XXXX", ...]
}
```

### Login with 2FA

```
POST /api/auth/login
Body: {
  "email": "user@example.com",
  "password": "password123",
  "twoFactorToken": "123456" // Optional, required if 2FA enabled
}

Response (2FA required):
{
  "requires2FA": true,
  "message": "Two-factor authentication required"
}

Response (Success):
{
  "token": "JWT_TOKEN",
  "user": { ... }
}
```

### Frontend Components

**SecurityTab Component**
- Location: `apps/web/app/profile/SecurityTab.tsx`
- Handles 2FA setup, management, and backup codes
- Uses React Query for state management

**Login Page Updates**
- Location: `apps/web/app/auth/login/page.tsx`
- Detects 2FA requirement
- Shows 2FA input when needed

### Database Schema

```prisma
model User {
  ...
  twoFactorEnabled        Boolean   @default(false)
  twoFactorSecret         String?   // BASE32 encoded TOTP secret
  twoFactorBackupCodes    String?   // JSON array of hashed backup codes
  ...
}
```

### Dependencies

**Backend:**
- `speakeasy` - TOTP generation and verification
- `qrcode` - QR code generation

**Frontend:**
- No additional dependencies (uses built-in Image component for QR code display)

---

## Security Best Practices

1. **Store Backup Codes Securely**
   - Use a password manager
   - Keep a printed copy in a safe place
   - Never share them with anyone

2. **Use a Trusted Authenticator App**
   - Google Authenticator
   - Authy
   - 1Password
   - Microsoft Authenticator

3. **Enable 2FA for Important Accounts**
   - Especially for admin accounts
   - Accounts with sensitive data access

4. **Regenerate Backup Codes if Compromised**
   - If you suspect codes have been exposed
   - After using several backup codes

---

## Troubleshooting

### "Invalid verification token" Error
- Check that your device time is synchronized
- Try generating a new code
- Verify you're entering the code within the 30-second window

### Lost Access to Authenticator App
- Use one of your backup codes to log in
- Once logged in, disable and re-enable 2FA with a new device

### Backup Codes Not Working
- Ensure you're entering the code exactly as shown (with or without hyphens)
- Each backup code can only be used once
- If all codes are used, you'll need account recovery assistance

---

## Migration Guide

If you have existing users, they will need to:
1. Log in with their current credentials (2FA not yet required)
2. Navigate to Profile → Security
3. Enable 2FA following the setup wizard

---

## Future Enhancements

- [ ] SMS 2FA as alternative method
- [ ] Hardware key support (YubiKey)
- [ ] Trusted devices (skip 2FA for 30 days)
- [ ] 2FA enforcement for admin roles
- [ ] Recovery email for 2FA reset

---

**Last Updated:** October 28, 2025  
**Version:** 1.0.0

