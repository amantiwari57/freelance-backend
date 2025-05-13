import { Redis } from '@upstash/redis';


// Create Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Initialize publisher and subscriber (same client for REST API)
export const publisher = redis;
export const subscriber = redis;

let isConnected = false;
let isSubscribed = false;
const handlers = new Map<string, ((message: string) => void)[]>();

// Set up message polling (Upstash Redis REST doesn't support traditional pub/sub)
const startMessagePolling = () => {
  const pollInterval = 1000; // Poll every second
  
  setInterval(async () => {
    try {
      // Check for messages in the 'message' channel
      const message = await redis.rpop('message');
      
      if (message) {
        console.log(`📥 Received message from channel: message`);
        // Notify all registered handlers
        const channelHandlers = handlers.get('message') || [];
        channelHandlers.forEach(handler => handler(message));
      }
    } catch (error) {
      console.error('Error polling for messages:', error);
    }
  }, pollInterval);
  
  isSubscribed = true;
  console.log("✅ Started message polling for channel: message");
};

// Connect to Redis
(async () => {
  try {
    // Test the connection
    await redis.ping();
    isConnected = true;
    console.log("✅ Connected to Upstash Redis successfully!");
    
    // Set up polling for messages (Upstash REST doesn't support traditional PubSub)
    startMessagePolling();
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
    if (!isConnected) {
      console.error("❌ Redis Client is not connected.");
      return false;
    }

    // Publish message using Upstash Redis
    // For Upstash REST API, we'll use LPUSH to a list with the channel name
    await redis.lpush(channel, message);
    console.log(`📨 Message published to Redis channel: ${channel}`);
    return true;
  } catch (error) {
    console.error("❌ Error publishing message to Redis:", error);
    return false;
  }
};

// Export the message handler setup function
export const setupMessageHandler = (callback: (message: string) => void) => {
  // Add handler to the 'message' channel
  const channelHandlers = handlers.get('message') || [];
  channelHandlers.push(callback);
  handlers.set('message', channelHandlers);
  
  console.log("✅ Added message handler for channel: message");
}; 