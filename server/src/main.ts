import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
async function bootstrap() {
  if (!process.env.ADMIN_API_KEY || process.env.ADMIN_API_KEY.length < 32)
    throw new Error(
      "Set a server-only ADMIN_API_KEY of at least 32 characters",
    );
  const app = await NestFactory.create(AppModule, { bodyParser: true });
  app.setGlobalPrefix("api");
  app.enableCors({
    origin: (process.env.CLIENT_URL || "http://127.0.0.1:5173")
      .split(",")
      .map((origin) => origin.trim()),
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept"],
  });
  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT || 3000), "0.0.0.0");
}
void bootstrap();
