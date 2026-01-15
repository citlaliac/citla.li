# 🚀 Automated Deployment Guide

## Overview
This guide explains how automated deployment works for citla.li. When you push to the `main` branch, GitHub Actions automatically builds and deploys your site to PlanetHoster.

---

## 📋 What Gets Deployed

### ✅ Files Deployed to `public_html/` root:

1. **React Build Files** (from `build/` folder):
   - `index.html` - Main entry point
   - `assets/` - All images, photos, fonts, etc.
   - `static/` - Compiled JavaScript and CSS
   - `robots.txt`, `sitemap.xml`, `manifest.json` - Config files

2. **PHP Files** (from `server/` folder):
   - `submit-contact.php`
   - `submit-guestbook.php`
   - `submit-resume.php`
   - `guestbook-display.php`
   - `karaoke-songs.php`
   - `played-songs.php`
   - `track-visitor.php`
   - `visitor-count.php`
   - `visitor-locations.php`
   - `db.php`
   - All other `.php` files

3. **Configuration Files**:
   - `.htaccess` - React Router configuration

### ❌ Files NOT Deployed:

- `node_modules/` - Installed separately on server if needed
- `server.js` - Not needed (using PHP backend)
- `.env` - Stays on server, never deployed from git
- Source code - Only built files are deployed

---

## 🔧 Setup Instructions

### Step 1: Add GitHub Secrets

You need to add your PlanetHoster FTP credentials to GitHub:

1. Go to: `https://github.com/citlaliac/citla.li/settings/secrets/actions`
2. Click **"New repository secret"** for each:

   **Secret 1: `FTP_SERVER`**
   - Name: `FTP_SERVER`
   - Value: Your FTP server address (e.g., `ftp.citla.li` or `ftp.planethoster.com`)
   - Find this in your PlanetHoster control panel → FTP section

   **Secret 2: `FTP_USERNAME`**
   - Name: `FTP_USERNAME`
   - Value: Your FTP username
   - Usually your domain name or account username

   **Secret 3: `FTP_PASSWORD`**
   - Name: `FTP_PASSWORD`
   - Value: Your FTP password
   - If you don't remember it, reset it in PlanetHoster control panel

3. Verify all 3 secrets are added (values are hidden for security)

### Step 2: Test the Deployment

1. Make a small test change (add a comment to any file)
2. Commit and push to `main` branch:
   ```bash
   git checkout main
   git add .
   git commit -m "Test automated deployment"
   git push origin main
   ```

3. Watch the deployment:
   - Go to: `https://github.com/citlaliac/citla.li/actions`
   - Click on the latest workflow run
   - Watch it build and deploy (takes 2-5 minutes)

4. Verify your site:
   - Visit `https://citla.li`
   - Check that your test change is live
   - Verify images are loading correctly

---

## 🔄 How It Works

1. **You push to `main`** → GitHub detects the push
2. **GitHub Actions runs** → Builds your React app (`npm run build`)
3. **Files are prepared** → React build + PHP files organized
4. **Files are uploaded via FTP** → Deployed to `public_html/` on PlanetHoster
5. **Your site updates** → Latest code is now live!

---

## 📁 Deployment Structure

After deployment, your `public_html/` on PlanetHoster will have:

```
public_html/
├── index.html          ← React app entry point
├── assets/             ← Images, photos, fonts
│   └── photos/         ← Your photo albums
├── static/             ← Compiled JS/CSS
│   ├── js/
│   └── css/
├── *.php               ← All PHP backend files
├── .htaccess           ← React Router config
├── robots.txt
├── sitemap.xml
└── manifest.json
```

---

## 🚨 Troubleshooting

### Deployment Fails

**Check:**
- [ ] GitHub Secrets are set correctly
- [ ] FTP credentials are correct
- [ ] FTP server allows connections
- [ ] Check the Actions tab for error messages

### Files Not Uploading

**Check:**
- [ ] Build completes successfully
- [ ] Files exist in `deployment/public_html/` (check Actions logs)
- [ ] FTP connection is working
- [ ] You have write permissions on PlanetHoster

### Website Not Updating

**Check:**
- [ ] Deployment completed successfully
- [ ] Files were uploaded (check Actions logs)
- [ ] Clear browser cache (Ctrl+F5)
- [ ] Check if files exist on server via FTP

### Images Not Loading

**Check:**
- [ ] `assets/` folder was uploaded
- [ ] `assets/photos/` contains your images
- [ ] File paths in code match server structure
- [ ] Check browser console for 404 errors

---

## 📝 Important Notes

### Environment Variables
- Your `.env` file stays on the server
- Never commit `.env` to git
- The workflow excludes `.env` files from deployment

### Server Files
- `server.js` is not deployed (using PHP backend)
- PHP files handle all backend functionality
- No Node.js server restart needed

### Manual Overrides
- If you need to manually deploy, use `deploy.sh` script
- Manual deployment won't affect automated deployment
- Automated deployment always uses latest code from `main` branch

---

## ✅ Success Checklist

You'll know it's working when:
- [ ] Push to `main` triggers GitHub Actions
- [ ] Build completes successfully
- [ ] Files upload to PlanetHoster
- [ ] Website updates within 2-5 minutes
- [ ] No manual steps required

---

## 🎉 You're Done!

Once set up, every push to `main` will automatically deploy to your live site. No more manual uploads!

**Need help?** Check the Actions tab for detailed logs of each deployment.

