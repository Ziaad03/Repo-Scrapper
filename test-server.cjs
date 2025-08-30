const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load environment variables
const downloadHandler = require('./api/download.js');

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));

// Mount the serverless function as a regular route
app.get('/api/download', downloadHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log(`GitHub token configured: ${process.env.GITHUB_TOKEN ? 'Yes' : 'No'}`);
});
