import { redis } from "..";

const createOrderUrl = "https://mamakazi.clouderp.ke/api/create-order";

export async function checkIfSessionExists(sessionId: string) {
  return await redis.exists(sessionId);
}

export async function getSessionAsJson(sessionId: string) {
  let value = await redis.get(sessionId);
  if (!value) return null;
  return JSON.parse(value);
}

export async function sendToTheServer(sessionId: string, phoneNumber: string) {
  try {
    const data = await getSessionAsJson(sessionId);
    console.log(data);
    if (!data) throw new Error("Session not found");

    const response = await fetch(createOrderUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumber,
        ...data,
      }),
    });

    const responseData = await response.json();

    return responseData;
  } catch (error) {
    console.error(error);
    // Handle the error appropriately, e.g., by re-throwing it or returning a specific error response
    throw error; // or return a specific error response
  }
}
