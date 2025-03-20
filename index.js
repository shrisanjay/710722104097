const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 9876;

const WINDOW_SIZE = 10;
const FETCH_TIMEOUT = 500;
const TEST_SERVER_BASE_URL = 'http://20.244.56.144/test';

const numberStore = {
  p: { numbers: [], lastUpdated: 0 },
  f: { numbers: [], lastUpdated: 0 },
  e: { numbers: [], lastUpdated: 0 },
  r: { numbers: [], lastUpdated: 0 }
};

const API_ENDPOINTS = {
  p: '/primes',
  f: '/fibo',
  e: '/even',
  r: '/rand'
};

const calculateAverage = (numbers) => {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, curr) => acc + curr, 0);
  return parseFloat((sum / numbers.length).toFixed(2));
};

const updateWindow = (window, newNumbers) => {
  const prevState = [...window];
  for (const num of newNumbers) {
    if (!window.includes(num)) {
      if (window.length >= WINDOW_SIZE) {
        window.shift();
      }
      window.push(num);
    }
  }
  return {
    prevState,
    currState: [...window],
    avg: calculateAverage(window)
  };
};

const validateNumberType = (req, res, next) => {
  const { numberid } = req.params;
  if (!['p', 'f', 'e', 'r'].includes(numberid)) {
    return res.status(400).json({ error: 'Invalid number type. Use p, f, e, or r.' });
  }
  next();
};

app.get('/numbers/:numberid', validateNumberType, async (req, res) => {
  const { numberid } = req.params;
  const store = numberStore[numberid];
  const endpoint = API_ENDPOINTS[numberid];

  try {
    const windowPrevState = [...store.numbers];
    const response = await axios.get(`${TEST_SERVER_BASE_URL}${endpoint}`, {
      timeout: FETCH_TIMEOUT
    });
    const fetchedNumbers = response.data.numbers || [];
    const result = updateWindow(store.numbers, fetchedNumbers);
    store.lastUpdated = Date.now();
    res.json({
      windowPrevState: result.prevState,
      windowCurrState: result.currState,
      numbers: fetchedNumbers,
      avg: result.avg
    });
  } catch (error) {
    if (error.code === 'ECONNABORTED' || error.response) {
      return res.json({
        windowPrevState: [...store.numbers],
        windowCurrState: [...store.numbers],
        numbers: [],
        avg: calculateAverage(store.numbers)
      });
    }
    console.error('Error fetching numbers:', error.message);
    res.status(500).json({ error: 'Failed to fetch numbers' });
  }
});

app.get('/health', (req, res) => {
  res.status(200).send('Service is healthy');
});

app.listen(PORT, () => {
  console.log(`Average Calculator service running on port ${PORT}`);
});
