import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { PosterTemplate } from './entities/poster-template.entity';
import { PosterTemplatesController } from './poster-templates.controller';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([PosterTemplate])],
  controllers: [PosterTemplatesController],
})
export class PosterTemplatesModule {}
