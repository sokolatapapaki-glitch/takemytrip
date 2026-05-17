'use strict';

const fs   = require('fs');
const path = require('path');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

// Resolve the data directory relative to the repo root.
// In Netlify Lambda the project files land at /var/task; __dirname is
// .../netlify/functions so two levels up reaches the repo root.
const DATA_DIR = path.join(__dirname, '..', '..', 'optimizer', 'data');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  // city comes from the query-string: /api/datasets/paris → ?city=paris
  const city = (event.queryStringParameters || {}).city || '';

  if (!city) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ detail: 'city parameter is required.' }),
    };
  }

  // Sanitise: only allow alphanumeric + hyphens to prevent path traversal
  if (!/^[a-z0-9-]+$/.test(city)) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ detail: 'Invalid city name.' }),
    };
  }

  const filePath = path.join(DATA_DIR, `${city}.json`);

  if (!fs.existsSync(filePath)) {
    return {
      statusCode: 404,
      headers: CORS_HEADERS,
      body: JSON.stringify({ detail: `Dataset '${city}' not found.` }),
    };
  }

  const data = fs.readFileSync(filePath, 'utf8');
  return { statusCode: 200, headers: CORS_HEADERS, body: data };
};
