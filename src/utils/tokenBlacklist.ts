import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

// Connect to Redis
redisClient.connect().catch(console.error);

export const addToBlacklist = async (token: string): Promise<void> => {
  try {
    const key = `blacklist:${token}`;
    // Set token with 24 hour expiration (86400 seconds)
    await redisClient.setEx(key, 86400, 'blacklisted');
  } catch (error) {
    console.error('Error adding token to blacklist:', error);
    throw error;
  }
};

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  try {
    const key = `blacklist:${token}`;
    const result = await redisClient.get(key);
    return result !== null;
  } catch (error) {
    console.error('Error checking token blacklist:', error);
    return false; // Default to allowing access if Redis is down
  }
};
