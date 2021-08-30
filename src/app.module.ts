import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BuchModule } from './buch/buch.module';
import { DbModule } from './db/db.module';
import { DbService } from './db/db.service';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { dbConfig } from './config/db';

@Module({
    // Module
    // Andere Module können hier zum "Hauptmodul" hinzugefügt und somit verbunden werden.
    // Module können bspw. Features oder Produkte des Projekts sein. Hier etwa "Buch".
    imports: [MongooseModule.forRoot(dbConfig.url), BuchModule, DbModule],

    // Controller
    // Controller sind verantwortlich für einkommende Requests und passende Responses.
    // Können Requests akzeptieren, etwas damit zu machen und danach eine Antwort zurückzuliefern.
    // Ersetzen den Router von ExpressJS
    controllers: [AppController],

    // Service
    // Services können injected werden in z.B. Controller um zusätzliche Funktionalitäten zur Verfügung zu stellen.
    // Ein Controller kann z.B. einen Service für die Datenbankzugriffe nutzen. Damit soll der Code im Controller relativ schlank gehalten werden.
    providers: [AppService],
})
export class AppModule {}
