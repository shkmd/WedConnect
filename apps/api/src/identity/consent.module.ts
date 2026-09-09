import { Module } from '@nestjs/common';
import { AuthModule } from './auth.module';
import { ConsentController } from './consent.controller';
import { ConsentService } from './consent.service';
@Module({ imports: [AuthModule], controllers: [ConsentController], providers: [ConsentService] })
export class ConsentModule {}
