import { Module } from '@nestjs/common';
import { CityMatchController } from './city-match.controller';
import { CityMatchService } from './city-match.service';

@Module({
  controllers: [CityMatchController],
  providers: [CityMatchService],
})
export class CityMatchModule {}
