import { Elysia, t } from "elysia";
import menu from "./ussd";
import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL!;
export const redis = new Redis(6379, REDIS_URL);

const app = new Elysia()
  .onError(({ code, error }) => {
    console.error(`Error code: ${code} => ${error}`);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  })
  .post("/", ({ body }) => {
    console.log(body);
    return {
      statusCode: 200,
      body: "Hello World",
    };
  })
  .post(
    "/ussd",
    ({ body }) => {
      //ussd logic
      const ussdResult = menu.run(body);

      return ussdResult;
    },
    {
      body: t.Object({
        sessionId: t.String(),
        serviceCode: t.String(),
        phoneNumber: t.String(),
        networkCode: t.String(),
        text: t.String(),
      }),
    }
  );

app.listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
