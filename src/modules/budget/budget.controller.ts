import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('budget')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createBudgetDto: CreateBudgetDto, @Request() req) {
    const user = req.user;
    return this.budgetService.create(createBudgetDto, user?._id);
  }

  @UseGuards(JwtAuthGuard)
  // @UseInterceptors(CacheInterceptor) //Can be used to cache this route
  @Get()
  async findAll(
    @Query('limit') limit: number,
    @Query('page') page: number,
    @Query('date') date: string,
    @Query('timeZone') timeZone: string,
    @Request() req,
  ) {
    const user = req.user;
    return this.budgetService.findAll(+limit, +page, date, timeZone, user?._id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('limit-check')
  async checkLimit(@Request() req) {
    const user = req.user;
    return this.budgetService.checkLimit(user?._id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('analytics')
  async getAnalytics(@Query('timeZone') timeZone: string, @Request() req) {
    const user = req.user;
    return this.budgetService.getAnalytics(timeZone, user?._id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.budgetService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ) {
    return this.budgetService.update(id, updateBudgetDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.budgetService.remove(id);
  }
}
