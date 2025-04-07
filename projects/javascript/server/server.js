// Load environment variables from .env file
const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Initialize Express app and set port (default to 4201 if not specified)
const app = express();
const port = process.env.PORT || 4201;

// MySQL Connection Configuration
const dbConfig = {
  host: '127.0.0.1',
  user: 'citlwqfk_citlaliac',
  password: process.env.MYSQL_PASSWORD,
  database: 'citlwqfk_submissions',
  charset: 'latin1'
};

// Middleware Configuration
// Enable CORS for your domain
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://citla.li' 
    : 'http://localhost:3000',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  credentials: true
}));

// Handle preflight requests
app.options('*', cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files from the public_html directory
app.use(express.static(path.join(__dirname, '..')));

// Helper function to get database connection
async function getConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    return connection;
  } catch (error) {
    console.error('Error connecting to MySQL:', error);
    throw error;
  }
}

// API Routes

/**
 * Handle contact form submissions
 * POST /api/submit-contact
 * Expected body: { name, email, message }
 * Appends submission to Sheet1 of the Google Spreadsheet
 */
app.post('/api/submit-contact', async (req, res) => {
  let connection;
  try {
    console.log('Received contact submission:', req.body);
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Name, email, and message are required'
      });
    }

    connection = await getConnection();
    
    // Insert into contacts table
    const [result] = await connection.execute(
      'INSERT INTO contacts (name, email, message, created_at) VALUES (?, ?, ?, ?)',
      [name, email, message, new Date()]
    );

    res.setHeader('Content-Type', 'application/json');
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error in contact submission:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      error: 'Failed to submit contact form',
      details: error.message 
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

/**
 * Handle resume request submissions
 * POST /api/submit-resume
 * Expected body: { name, email, message }
 * Appends submission to Sheet2 of the Google Spreadsheet
 */
app.post('/api/submit-resume', async (req, res) => {
  let connection;
  try {
    console.log('Received resume submission:', req.body);
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Name and email are required'
      });
    }

    connection = await getConnection();
    
    // Insert into resume_requests table
    const [result] = await connection.execute(
      'INSERT INTO resume_requests (name, email, created_at) VALUES (?, ?, ?)',
      [name, email, new Date()]
    );

    res.setHeader('Content-Type', 'application/json');
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error in resume submission:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      error: 'Failed to submit resume form',
      details: error.message 
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Handle all other routes by serving index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Server is ready to serve https://citla.li');
  console.log('Current environment:', process.env.NODE_ENV);
}); 