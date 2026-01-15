# 🚀 Automated Deployment Setup Plan

## Goal
Set up automated deployment so that **every push to `main` branch automatically deploys to PlanetHoster**, keeping your live site always up-to-date.

---

## 📋 What You Need to Know

### Current State
- ✅ You have a GitHub Actions workflow (`.github/workflows/deploy.yml`)
- ✅ It's configured to deploy on push to `main` branch
- ⚠️ You need to configure GitHub Secrets (FTP credentials)
- ⚠️ The workflow needs to be tested and verified

### How It Works
1. **You push code to `main` branch** → GitHub detects the push
2. **GitHub Actions runs automatically** → Builds your React app
3. **Files are prepared** → Build folder + server files organized
4. **Files are uploaded via FTP** → Deployed to PlanetHoster's `public_html`
5. **Your site is live** → Latest code is now on citla.li

---

## 🎯 Step-by-Step Setup Plan

### Phase 1: Gather Information (5 minutes)

You'll need these from PlanetHoster:

1. **FTP Server Address**
   - Usually something like: `ftp.citla.li` or `ftp.planethoster.com`
   - Check your PlanetHoster control panel → FTP section

2. **FTP Username**
   - Your FTP login username
   - Usually your domain name or account username

3. **FTP Password**
   - Your FTP password
   - If you don't remember it, reset it in PlanetHoster control panel

4. **Current Server Structure**
   - Where is your `public_html` folder?
   - Where is your Node.js server running?
   - What's the path structure on the server?

### Phase 2: Configure GitHub Secrets (10 minutes)

1. **Go to your GitHub repository**
   - Navigate to: `https://github.com/citlaliac/citla.li`

2. **Open Settings → Secrets and variables → Actions**
   - Click on your repo
   - Click "Settings" tab
   - Click "Secrets and variables" in left sidebar
   - Click "Actions"

3. **Add these 3 secrets:**
   - Click "New repository secret" for each:
   
   **Secret 1: `FTP_SERVER`**
   - Name: `FTP_SERVER`
   - Value: Your FTP server address (e.g., `ftp.citla.li`)
   
   **Secret 2: `FTP_USERNAME`**
   - Name: `FTP_USERNAME`
   - Value: Your FTP username
   
   **Secret 3: `FTP_PASSWORD`**
   - Name: `FTP_PASSWORD`
   - Value: Your FTP password

4. **Verify secrets are added**
   - You should see all 3 secrets listed (values are hidden for security)

### Phase 3: Test the Workflow (15 minutes)

1. **Create a test branch from your current branch**
   ```bash
   git checkout latest-photo-updates-live-jan5
   git checkout -b test-automated-deployment
   ```

2. **Make a small test change**
   - Add a comment to any file
   - Or update a version number
   - Commit the change

3. **Merge test branch to main** (or push directly to main for testing)
   ```bash
   git checkout main
   git merge test-automated-deployment
   git push origin main
   ```

4. **Watch the deployment**
   - Go to GitHub → Your repo → "Actions" tab
   - You should see "Deploy to PlanetHoster" workflow running
   - Click on it to see real-time logs
   - Wait for it to complete (usually 2-5 minutes)

5. **Verify deployment**
   - Check your website: https://citla.li
   - Verify your test change is live
   - Check that images are loading correctly

### Phase 4: Verify & Fix Workflow (if needed)

**If deployment fails, check:**

1. **FTP Connection Issues**
   - Verify FTP credentials are correct
   - Check if PlanetHoster allows FTP connections
   - Some hosts require SFTP instead of FTP

2. **File Path Issues**
   - The workflow uploads to `public_html/`
   - Verify this matches your PlanetHoster structure
   - Check if you need a different path

3. **Missing Files**
   - Verify `.htaccess` is being copied
   - Check if `server.js` needs to be in a specific location
   - Ensure all PHP files are included

4. **Node.js Server**
   - The workflow uploads files but doesn't restart your Node.js server
   - You may need to manually restart or set up a webhook

### Phase 5: Finalize & Document (10 minutes)

1. **Update workflow if needed**
   - Based on test results, adjust file paths
   - Add any missing files to the deployment
   - Fix any issues found

2. **Document your setup**
   - Note any special configurations
   - Document server restart process (if needed)
   - Save any important paths or settings

---

## 🔧 Workflow Customization Options

### Option A: Add Server Restart (if needed)

If your Node.js server needs to restart after deployment, you can:

1. **Use SSH instead of FTP** (more secure, allows commands)
2. **Add a webhook endpoint** that triggers server restart
3. **Use PlanetHoster's API** (if available) to restart services

### Option B: Add Deployment Notifications

You can add notifications to:
- Slack
- Discord
- Email
- When deployments succeed/fail

### Option C: Add Pre-deployment Checks

Add checks before deploying:
- Run tests
- Lint code
- Check build size
- Verify environment variables

---

## 📝 Important Notes

### What Gets Deployed
- ✅ React build files (`build/` folder contents)
- ✅ PHP files from `server/`
- ✅ Server files (`server.js`, `package.json`)
- ✅ Static assets (`assets/` folder)
- ✅ Config files (`.htaccess`, `robots.txt`, etc.)

### What Doesn't Get Deployed
- ❌ `node_modules/` (installed on server separately)
- ❌ `.env` file (stays on server, never in git)
- ❌ Source code (only built files)
- ❌ `.git/` folder

### Server Requirements
- Node.js must be installed on PlanetHoster
- Server must be running (via PM2, systemd, or similar)
- `.env` file must exist on server with correct values
- Database must be accessible from server

---

## 🚨 Troubleshooting Checklist

If deployment isn't working:

- [ ] GitHub Secrets are set correctly
- [ ] FTP credentials are correct
- [ ] FTP server allows connections
- [ ] File paths match server structure
- [ ] Build completes successfully
- [ ] All required files are being copied
- [ ] Server is running and accessible
- [ ] `.env` file exists on server
- [ ] Node.js server can restart (if needed)

---

## 🎉 Success Criteria

You'll know it's working when:
1. ✅ Push to `main` triggers GitHub Actions
2. ✅ Build completes successfully
3. ✅ Files upload to PlanetHoster
4. ✅ Website updates within 2-5 minutes
5. ✅ No manual steps required

---

## 📞 Next Steps

1. **Gather your FTP credentials** from PlanetHoster
2. **Add GitHub Secrets** (Phase 2)
3. **Test with a small change** (Phase 3)
4. **Verify everything works**
5. **Merge your photo updates** to main when ready

---

## 💡 Pro Tips

1. **Always test on a branch first** before merging to main
2. **Keep main branch stable** - only merge tested code
3. **Monitor the Actions tab** to catch issues early
4. **Set up notifications** so you know when deployments happen
5. **Keep a backup** of your current working site before first auto-deploy

---

Ready to start? Begin with Phase 1 and gather your FTP credentials!

