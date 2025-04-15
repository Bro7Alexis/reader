import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Permet à Electron d'accéder à l'API
    cors: true,
  });

  // Permet les requêtes depuis Electron
  app.enableCors();

  await app.listen(3000);

  console.log(`Application NestJS démarrée sur: ${await app.getUrl()}`);
}

bootstrap();
