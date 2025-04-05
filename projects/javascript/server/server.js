// Load environment variables from .env file
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');

// Initialize Express app and set port (default to 5000 if not specified)
const app = express();
const port = process.env.PORT || 5000;

// Middleware Configuration
// Enable CORS for all routes to allow frontend requests
app.use(cors());
// Parse JSON request bodies
app.use(express.json());

// Google Sheets API Configuration
// Set up authentication using service account credentials
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Initialize Google Sheets API client
const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

// Helper function to append data to a spreadsheet
async function appendToSheet(spreadsheetId, values) {
  try {
    console.log('Attempting to append to sheet:', spreadsheetId);
    console.log('Values to append:', values);
    
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:Z',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values],
      },
    });
    
    console.log('Successfully appended to sheet');
    return response.data;
  } catch (error) {
    console.error('Error appending to sheet:', error.message);
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
  try {
    console.log('Received contact submission:', req.body);
    const { name, email, message } = req.body;
    const values = [
      new Date().toISOString(),
      name,
      email,
      message,
    ];
    
    await appendToSheet(process.env.CONTACT_SPREADSHEET_ID, values);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in contact submission:', error.message);
    res.status(500).json({ 
      error: 'Failed to submit contact form',
      details: error.message 
    });
  }
});

/**
 * Handle resume request submissions
 * POST /api/submit-resume
 * Expected body: { name, email, message }
 * Appends submission to Sheet2 of the Google Spreadsheet
 */
app.post('/api/submit-resume', async (req, res) => {
  try {
    console.log('Received resume submission:', req.body);
    const { name, email, message } = req.body;
    const values = [
      new Date().toISOString(),
      name,
      email,
      message,
    ];
    
    await appendToSheet(process.env.RESUME_SPREADSHEET_ID, values);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in resume submission:', error.message);
    res.status(500).json({ 
      error: 'Failed to submit resume',
      details: error.message 
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Google Sheets API configured with:');
  console.log('Service Account Email:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
  console.log('Resume Spreadsheet ID:', process.env.RESUME_SPREADSHEET_ID);
  console.log('Contact Spreadsheet ID:', process.env.CONTACT_SPREADSHEET_ID);
}); 