import {MiddlewareConsumer, Module, NestModule} from '@nestjs/common';
import {MongooseModule} from '@nestjs/mongoose';

import {AppController} from './app.controller';
import {AppService} from './app.service';
import {AuthModule} from './auth/auth.module';
import {BuchModule} from './buch/buch.module';
import {dbConfig} from './config/db';
import {DbModule} from './db/db.module';
import {DbService} from './db/db.service';
import {LoggerMiddleware} from './shared/middleware/logger.middleware';
import {UsersModule} from './users/users.module';

@Module({
  // Module
  // Andere Module können hier zum "Hauptmodul" hinzugefügt und somit verbunden
  // werden.
  // Module können bspw. Features oder Produkte des Projekts sein. Hier etwa
  // "Buch".
  imports: [
    MongooseModule.forRoot(dbConfig.url), BuchModule, DbModule, AuthModule,
    UsersModule
  ],

  // Controller
  // Controller sind verantwortlich für einkommende Requests und passende
  // Responses.
  // Können Requests akzeptieren, etwas damit zu machen und danach eine Antwort
  // zurückzuliefern.
  // Ersetzen den Router von ExpressJS
  controllers: [AppController],

  // Service
  // Services können injected werden in z.B. Controller um zusätzliche
  // Funktionalitäten zur Verfügung zu stellen.
  // Ein Controller kann z.B. einen Service für die Datenbankzugriffe nutzen.
  // Damit soll der Code im Controller relativ schlank gehalten werden.
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('api');
  }
}
