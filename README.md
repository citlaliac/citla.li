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

## Deployment
To deploy to https://citla.li:

- Make sure you're in the `projects/javascript` directory
- Run `npm run build` to build and then copy to web
    - the build folder, .htaccess, and php files must be in the main public_html
    - the server folder in server
- Set up your DBs and tables, add the access creds to the project

____???____
2. Run the deployment script:
   ```bash
   ./deploy.sh
   ```
3. Upload the contents of the `server` directory to your PlanetHoster server
4. Make sure your `.env` file is properly configured on the server
5. Start the server with:
   ```bash
   node server.js
   ```

