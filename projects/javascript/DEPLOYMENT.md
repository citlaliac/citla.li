# 🚀 Automated Deployment Guide

This guide will help you set up automated deployments from GitHub to your PlanetHoster server.

## Option 1: GitHub Actions (Recommended)

### Setup Steps:

1. **Add GitHub Secrets:**
   - Go to your GitHub repository
   - Click Settings → Secrets and variables → Actions
   - Add these secrets:
     - `FTP_SERVER`: Your PlanetHoster FTP server address
     - `FTP_USERNAME`: Your FTP username
     - `FTP_PASSWORD`: Your FTP password

2. **Enable GitHub Actions:**
   - The workflow file is already created at `.github/workflows/deploy.yml`
   - It will automatically run when you push to the `main` branch

3. **Test the deployment:**
   - Make a small change to your code
   - Commit and push to GitHub
   - Check the Actions tab to see the deployment progress

## Option 2: Webhook Deployment

### Setup Steps:

1. **Deploy the webhook server:**
   ```bash
   # On your PlanetHoster server
   node server/webhook-deploy.js
   ```

2. **Set up GitHub webhook:**
   - Go to your GitHub repository
   - Click Settings → Webhooks
   - Add webhook URL: `https://yourdomain.com/webhook/deploy`
   - Set content type to `application/json`
   - Add secret token (set in DEPLOY_TOKEN environment variable)

3. **Test the webhook:**
   - Make a change and push to GitHub
   - Check your server logs for deployment activity

## Option 3: Manual Deployment (Current Method)

### Quick Deploy:
```bash
# Run the enhanced deploy script
bash deploy.sh

# Then upload the 'server' directory contents to PlanetHoster
```

## Environment Variables

Make sure these are set on your PlanetHoster server:

```bash
# For webhook deployment
DEPLOY_TOKEN=your-secret-token
WEBHOOK_PORT=3001

# For your main app
NODE_ENV=production
# ... other app-specific variables
```

## Troubleshooting

### Common Issues:

1. **Build fails:**
   - Check Node.js version (should be 18+)
   - Run `npm install` to ensure dependencies are installed

2. **FTP deployment fails:**
   - Verify FTP credentials in GitHub Secrets
   - Check if PlanetHoster allows FTP connections

3. **Webhook not triggering:**
   - Check webhook URL is accessible
   - Verify DEPLOY_TOKEN matches

### Logs:

- GitHub Actions: Check the Actions tab in your repository
- Webhook: Check server logs where webhook-deploy.js is running
- Manual: Check the output of `bash deploy.sh`

## Security Notes

- Never commit FTP credentials to your repository
- Use GitHub Secrets for sensitive information
- Rotate your DEPLOY_TOKEN regularly
- Consider using SSH keys instead of passwords for FTP

## Need Help?

If you run into issues:
1. Check the deployment logs
2. Verify all environment variables are set
3. Test the deployment script locally first
4. Contact PlanetHoster support if FTP issues persist
