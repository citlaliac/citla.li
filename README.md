# playingWithCursor

## What
This is a place for me to mess around with Cursor.

## Goals
I'm hoping to make a little TV app at somepoint, and maybe some assets for my website. Let's see if I do.

## Getting set up
- Clone the repo
- Run `npx react-scripts start`
- Run `npm run build` to build and then copy to web
- Run `node server.js` to serve locally 
- Check out your changes in localhost

## Deployment
To deploy to https://citla.li:

1. Make sure you're in the `projects/javascript` directory
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

The server will automatically serve your React app and handle API requests for the contact form and resume submissions.

