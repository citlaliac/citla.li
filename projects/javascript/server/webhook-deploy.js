const express = require('express');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.WEBHOOK_PORT || 3001;

// Middleware to parse JSON
app.use(express.json());

// Simple authentication token (you should change this)
const DEPLOY_TOKEN = process.env.DEPLOY_TOKEN || 'your-secret-deploy-token';

// Webhook endpoint for GitHub
app.post('/webhook/deploy', (req, res) => {
  const { token } = req.body;
  
  // Verify the token
  if (token !== DEPLOY_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  console.log('Deployment webhook triggered');
  
  // Run deployment script
  exec('bash deploy.sh', { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
    if (error) {
      console.error('Deployment error:', error);
      return res.status(500).json({ error: 'Deployment failed', details: error.message });
    }
    
    console.log('Deployment successful:', stdout);
    res.json({ message: 'Deployment successful', output: stdout });
  });
});

// Health check endpoint
app.get('/webhook/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
});
