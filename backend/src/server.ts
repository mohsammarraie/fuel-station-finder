import "dotenv/config";
import app from "./app.js";
import { logger } from "./logger.js";

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, (error) => {
  if (error) {
    logger.fatal({ err: error, port: PORT }, "Failed to start server");
    process.exitCode = 1;
    return;
  }

  logger.info({ port: PORT }, "Server started");
});
