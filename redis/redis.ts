import Redis from 'ioredis';
import { config } from 'dotenv';

// Load environment variables
config();

// Create Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  username: process.env.REDIS_USERNAME,
};

// Create Redis clients
export const publisher = new Redis(redisConfig);
export const subscriber = new Redis(redisConfig);

// Connect to Redis
(async () => {
  try {
    // Test the connection
    await publisher.ping();
    await subscriber.ping();
    console.log("✅ Connected to Redis successfully!");
    
    // Subscribe to the message channel
    await subscriber.subscribe('message');
    console.log("✅ Subscribed to message channel");
  } catch (error) {
    console.error("❌ Redis Connection Error:", error);
  }
})();

/**
 * Sends a message to Redis pub/sub.
 * @param channel - Redis channel to publish the message to.
 * @param message - Message payload to publish.
 */
export const publishMessage = async (channel: string, message: string) => {
  try {
    if (!publisher) {
      console.error("❌ Redis Publisher is not initialized.");
      return;
    }

    await publisher.publish(channel, message);
    console.log(`📨 Message published to Redis channel: ${channel}`);
    return true;
  } catch (error) {
    console.error("❌ Error publishing message to Redis:", error);
    return false;
  }
};

// Export the message handler setup function
export const setupMessageHandler = (callback: (message: string) => void) => {
  subscriber.on('message', (channel, message) => {
    console.log(`📥 Received message from channel ${channel}`);
    callback(message);
  });
}; 