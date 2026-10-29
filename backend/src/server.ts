import "dotenv/config";
import { createApp } from "./app.js";
import { logger } from "./logger.js";

async function bootstrap(): Promise<void> {
  const port = process.env.PORT ?? 3000;

  try {
    const app = await createApp();
    await app.listen(port);
    logger.info({ port }, "Server started");
  } catch (error) {
    logger.fatal({ err: error, port }, "Failed to start server");
    process.exitCode = 1;
  }
}

void bootstrap();
