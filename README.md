# Citlali's Website!

## What
This is honestly where the magic happens. Using conventional and artificial intelligence, I'll have you wondering WHAT is going on at www.citla.li

## Goals
Keep this as a space to learn and try new things.

## Getting set up
- In r\projects\javascript\build"
    - Run in  `npx react-scripts start`
- In /server Run `node server.js` to serve locally (if using node apps, I don't think this version is)
- Check out your changes in localhost
ALT 
- In `projects/javascript` directory:
    - Run `npm start` to spin up the local development server
    - Check out your changes at `http://localhost:3000`

## Development & Deployment Workflow to citla.li

### 1. Test Locally
- Run the local UI: `cd projects/javascript && npm start`
- Test your changes in the browser at `http://localhost:3000`
- Verify everything works as expected

### 2. Test Database Functions (If Needed)
- If you need to test database functionality (guestbook, contact form, etc.):
  - Build the project: `cd projects/javascript && npm run build`
  - Manually upload to website via FTP to test with live database
      - the build folder, .htaccess, and php files must be in the main public_html
      - the server folder in server
      - needed DBs must be set up
  - This lets you test PHP/DB interactions before automated deployment- Make sure you're in the `projects/javascript` directory


### 3. Pre-Deploy Check (Recommended)
- Before deploying, run the pre-deploy check to ensure everything is ready:
  ```bash
  cd projects/javascript && npm run deploy-check
  ```
- This script will:
  - Run all tests and verify they pass
  - Check for security vulnerabilities in dependencies
  - Provide a clear summary of any issues that need to be fixed
- If the check fails, fix the issues before deploying
- **Note:** This is a recommended step but not required for deployment

### 4. Verify Tests Pass (Alternative)
- If you prefer to run tests separately: `cd projects/javascript && npm run test:ci`
- Update tests as needed if you've added new functionality
- Tests don't block deployment, but it's good practice to keep them passing

### 5. Deploy to Production
- Push to `main` branch:
  ```bash
  git checkout main
  git add .
  git commit -m "Your commit message"
  git push origin main
  ```
- GitHub Actions automatically:
  - Builds your React app
  - Deploys to PlanetHoster via FTP
  - Updates your live site at https://citla.li

**Note:** Tests are not required to pass for deployment. The automated deployment will proceed regardless of test results, but keeping tests passing helps catch issues early.

## Manual Deployment (If Needed)

If you need to manually deploy (e.g., for database testing):
- Make sure you're in the `projects/javascript` directory
- Run `npm run build` to build
- Upload the `build` folder contents, `.htaccess`, and PHP files from `server/` to `public_html/` on PlanetHoster
- Set up your DBs and tables, add the access creds to the project

