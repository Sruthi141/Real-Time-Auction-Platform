// redisClient.js
const { createClient } = require('redis');

let client;

function getRedisClient() {
  if (!client) {
    const url = process.env.REDIS_URL || "rediss://default:AYEYAAIjcDEyMmVmMzk1MDJiZTE0NzQzODk5NTk3M2UxMWE1M2NiZnAxMA@absolute-guppy-33048.upstash.io:6379";
    client = createClient({ url });

    client.on('error', (err) => console.error('Redis Client Error', err));

    // Start connecting but don't await here — keep connection non-blocking so
    // callers (like seller home) aren't delayed while Redis establishes TLS.
    client.connect().catch((err) => {
      console.error('Redis connect failed (continuing without cache):', err);
    });
  }

  return client;
}

module.exports = getRedisClient;
