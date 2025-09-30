import { createClient } from "redis";

const redisMemory = createClient({
  url: process.env.REDIS_URL,
});

redisMemory.connect().then(() => {
  console.log("Redis connected");
}).catch((error) => {
  console.error("Redis connection error:", error);
});

redisMemory.on("error", (error) => {
  console.error("Redis Client error:", error);
});


export async function getMemory(sessionId: string, maxHistory: number=10) {
  try{
    const messages = await redisMemory.lRange(`chat:${sessionId}`, 0, maxHistory - 1);
    return messages.map((msg : any) => {
      const parsed = JSON.parse(msg);
      return [parsed.type, parsed.content];
    });
  }catch(error) {
    console.error(`Error fetching memory: ${error}`);
    return [];
  }
}

export async function saveMessage(sessionId: string, message: any) {
  try{
    await redisMemory.lPush(`chat:${sessionId}`, JSON.stringify(message));
    await redisMemory.lTrim(`chat:${sessionId}`, 0, 49);
  }catch(error){
    console.error(`Error saving memory: ${error}`);
  }
}
