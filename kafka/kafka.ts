import { Kafka, Producer } from "kafkajs";
import fs from "fs"
import path from "path";
console.log("Resolved CA File Path:", path.resolve(__dirname, "ca.pem"));

const kafka = new Kafka({
  clientId: "chat-service",
  brokers: ["kafka-1548fed4-tiwariji2300-c727.i.aivencloud.com:25761"], // Replace with your actual Aiven Kafka broker URL
  ssl: {
    ca: [fs.readFileSync(path.join(__dirname, "ca.pem"), "utf8")],
  },
  sasl: {
    mechanism: "plain",
    username: process.env.KAFKA_USER!, // Replace with your Aiven Kafka username
    password: process.env.KAFKA_PASSWORD!, // Replace with your Aiven Kafka password
  },
});

export const producer: Producer = kafka.producer();
export const consumer = kafka.consumer({ groupId: "chat-message-consumer" });

(async () => {
  try {
    await producer.connect();
    await consumer.connect();
    console.log("✅ Connected to Aiven Kafka successfully!");
  } catch (error) {
    console.error("❌ Kafka Connection Error:", error);
  }
})();

/**
 * Sends a chat message to Kafka.
 * @param topic - Kafka topic to send the message to.
 * @param message - Message payload to send.
 */
export const sendMessage = async (message: string) => {
    try {
      if (!producer) {
        console.error("❌ Kafka Producer is not initialized.");
        return;
      }
  
      await producer.send({
        topic: "message", // Use the newly created topic
        messages: [
          {
            key: Date.now().toString(), // Unique key using timestamp
            value: message, // The actual message content
          },
        ],
      });
  
      console.log(`📨 Message sent to Kafka topic: chat-messages`);
    } catch (error) {
      console.error("❌ Error sending message to Kafka:", error);
    }
  };