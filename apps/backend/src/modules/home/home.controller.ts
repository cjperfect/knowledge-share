import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Result } from '../../util/result';
import { HomeOverviewQueryDto } from './dto/home-overview.dto';
import { SessionGuard } from '../../common/guards/session.guard';
import { HomeService } from './home.service';

@Controller('home')
@UseGuards(SessionGuard)
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('overview')
  async getOverview(@Query() query: HomeOverviewQueryDto) {
    return Result.ok(await this.homeService.getOverview(query));
  }
}
