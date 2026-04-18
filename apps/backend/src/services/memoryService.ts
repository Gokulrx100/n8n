// import { createClient } from "redis";

// const redisMemory = createClient({
//   url: process.env.REDIS_URL,
// });

// redisMemory.connect().then(() => {
//   console.log("Redis connected");
// }).catch((error) => {
//   console.error("Redis connection error:", error);
// });

// redisMemory.on("error", (error) => {
//   console.error("Redis Client error:", error);
// });


// export async function getMemory(sessionId: string, maxHistory: number=10) {
//   try{
//     const messages = await redisMemory.lRange(`chat:${sessionId}`, 0, maxHistory - 1);
//     return messages.map((msg : any) => {
//       const parsed = JSON.parse(msg);
//       return [parsed.type, parsed.content];
//     });
//   }catch(error) {
//     console.error(`Error fetching memory: ${error}`);
//     return [];
//   }
// }

// export async function saveMessage(sessionId: string, message: any) {
//   try{
//     await redisMemory.lPush(`chat:${sessionId}`, JSON.stringify(message));
//     await redisMemory.lTrim(`chat:${sessionId}`, 0, 49);
//   }catch(error){
//     console.error(`Error saving memory: ${error}`);
//   }
// }

import { RedisChatMessageHistory } from "@langchain/redis";
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";

// Redis connection URL
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Get memory using RedisChatMessageHistory
export async function getMemory(sessionId: string, maxHistory: number = 10): Promise<BaseMessage[]> {
  try {
    const history = new RedisChatMessageHistory({
      sessionId: sessionId,
      config : {
      url : redisUrl
      }
    });

    const messages = await history.getMessages();
    // Return only the last maxHistory messages
    return messages.slice(-maxHistory);
  } catch (error) {
    console.error(`Error fetching memory for session ${sessionId}:`, error);
    return [];
  }
}

// Save message using RedisChatMessageHistory
export async function saveMessage(sessionId: string, message: any): Promise<void> {
  try {
    const history = new RedisChatMessageHistory({
      sessionId: sessionId,
      config : {
      url: redisUrl
      }
    });

    // Convert message to LangChain format
    const role = (message.role || message.type || "user").toString().toLowerCase();
    const content = message.content ?? message.message ?? (typeof message === "string" ? message : "");

    if (role === "system") {
      await history.addMessage(new SystemMessage({ content: content.toString() }));
    } else if (role === "assistant" || role === "ai") {
      await history.addMessage(new AIMessage({ content: content.toString() }));
    } else {
      await history.addMessage(new HumanMessage({ content: content.toString() }));
    }

  } catch (error) {
    console.error(`Error saving memory for session ${sessionId}:`, error);
  }
}
