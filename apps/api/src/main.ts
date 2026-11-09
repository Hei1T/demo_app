import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Flutter App / H5 跨域访问
  app.enableCors({ origin: true, credentials: true });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`[nfc-backend] http://127.0.0.1:${port}`);
  console.log(`[nfc-backend] LAN http://192.168.1.2:${port}`);
}
await bootstrap();
