const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');

// Create mock for axios
const mock = new MockAdapter(axios);

// Import server after mocking axios
const request = require('supertest');
const express = require('express');
const app = express();

// Mock endpoints
mock.onGet('http://20.244.56.144/test/primes').reply(200, {
  numbers: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31]
});

mock.onGet('http://20.244.56.144/test/fibo').reply(200, {
  numbers: [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89]
});

mock.onGet('http://20.244.56.144/test/even').reply(200, {
  numbers: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]
});

mock.onGet('http://20.244.56.144/test/rand').reply(200, {
  numbers: [3, 7, 1, 9, 12, 4, 8, 15, 6, 2, 11]
});

// Before importing our app, mock the configuration
jest.mock('../config', () => ({
  WINDOW_SIZE: 5,
  FETCH_TIMEOUT: 500,
  TEST_SERVER_BASE_URL: 'http://20.244.56.144/test'
}));

// Now import our app
const serverApp = require('../index');

describe('Average Calculator API', () => {
  test('GET /numbers/p - should return prime numbers', async () => {
    const response = await request(serverApp).get('/numbers/p');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('windowCurrState');
    expect(response.body).toHaveProperty('avg');
    expect(response.body.numbers).toContain(2);
    expect(response.body.numbers).toContain(3);
  });

  test('GET /numbers/f - should return fibonacci numbers', async () => {
    const response = await request(serverApp).get('/numbers/f');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('windowCurrState');
    expect(response.body).toHaveProperty('avg');
    expect(response.body.numbers).toContain(1);
    expect(response.body.numbers).toContain(2);
  });

  test('GET /numbers/e - should return even numbers', async () => {
    const response = await request(serverApp).get('/numbers/e');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('windowCurrState');
    expect(response.body).toHaveProperty('avg');
    expect(response.body.numbers).toContain(2);
    expect(response.body.numbers).toContain(4);
  });

  test('GET /numbers/r - should return random numbers', async () => {
    const response = await request(serverApp).get('/numbers/r');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('windowCurrState');
    expect(response.body).toHaveProperty('avg');
  });

  test('GET /numbers/x - should return 400 for invalid type', async () => {
    const response = await request(serverApp).get('/numbers/x');
    expect(response.status).toBe(400);
  });

  test('Window should maintain size limit', async () => {
    // First request to fill the window
    await request(serverApp).get('/numbers/p');
    
    // Simulate api returning different numbers
    mock.onGet('http://20.244.56.144/test/primes').reply(200, {
      numbers: [37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79]
    });
    
    // Second request to test window replacement
    const response = await request(serverApp).get('/numbers/p');
    
    expect(response.body.windowCurrState.length).toBeLessThanOrEqual(5);  // Using window size 5 from mock config
  });

  test('Service handles timeout gracefully', async () => {
    // Simulate timeout
    mock.onGet('http://20.244.56.144/test/even').timeout();
    
    const response = await request(serverApp).get('/numbers/e');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('windowCurrState');
    expect(response.body).toHaveProperty('avg');
    expect(response.body.numbers).toEqual([]);
  });
});