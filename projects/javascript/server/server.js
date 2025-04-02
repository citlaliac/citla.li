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

// API Routes

/**
 * Handle contact form submissions
 * POST /api/contact
 * Expected body: { name, email, message }
 * Appends submission to Sheet1 of the Google Spreadsheet
 */
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    // Format data for Google Sheets: [timestamp, name, email, message]
    const values = [[new Date().toISOString(), name, email, message]];

    // Append data to the spreadsheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:Z', // Append to Sheet1, columns A through Z
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });

    // Send success response
    res.status(200).json({ message: 'Form submitted successfully' });
  } catch (error) {
    console.error('Error:', error);
    // Send error response
    res.status(500).json({ error: 'Failed to submit form' });
  }
});

/**
 * Handle resume request submissions
 * POST /api/resume
 * Expected body: { name, email, company, message }
 * Appends submission to Sheet2 of the Google Spreadsheet
 */
app.post('/api/resume', async (req, res) => {
  try {
    const { name, email, company, message } = req.body;
    // Format data for Google Sheets: [timestamp, name, email, company, message]
    const values = [[new Date().toISOString(), name, email, company, message]];

    // Append data to the spreadsheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet2!A:Z', // Append to Sheet2, columns A through Z
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });

    // Send success response
    res.status(200).json({ message: 'Resume request submitted successfully' });
  } catch (error) {
    console.error('Error:', error);
    // Send error response
    res.status(500).json({ error: 'Failed to submit resume request' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 