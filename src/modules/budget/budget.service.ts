import { Injectable, NotFoundException, UseInterceptors } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  startOfMonth,
  subMonths,
  endOfMonth,
  eachDayOfInterval,
  format,
  eachMonthOfInterval,
} from 'date-fns';

import { Budget } from 'src/models';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { UserService } from '../user/user.service';
import { SentryInterceptor } from 'src/helpers/sentry.interceptor';

@UseInterceptors(SentryInterceptor)
@Injectable()
export class BudgetService {
  constructor(
    @InjectModel(Budget.name) private budgetModel: Model<Budget>,
    private userService: UserService,
  ) {}

  async create(createBudgetDto: CreateBudgetDto, userId: string) {
    const createdBudget = new this.budgetModel({ ...createBudgetDto, userId });
    createdBudget.save();
    const currentDate = new Date(createBudgetDto.date);
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    const isCurrentMonth = currentDate >= start && currentDate <= end;

    let user;
    let budgetsThisMonth;
    if (isCurrentMonth) {
      budgetsThisMonth = await this.budgetModel.aggregate([
        { $match: { userId: new Types.ObjectId(userId) } },
        { $match: { date: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$price' } } },
      ]);
      budgetsThisMonth = budgetsThisMonth[0] || {};

      user = await this.userService.findById(userId);
    }

    const data = {
      totalBudgetThisMonth: budgetsThisMonth?.total || 0,
      isCurrentMonth,
      budgetLimit: user?.budgetLimit,
    };
    return data;
  }

  async findAll(
    limit: number,
    page: number,
    date: string,
    timeZone: string,
    userId: string,
  ) {
    const stage2Pipeline = [];
    if (limit != 0) {
      stage2Pipeline.push(
        {
          $skip: (page - 1) * limit,
        },
        { $limit: limit * 1 },
      );
    }

    const filterPipeline: any = [
      { $match: { userId: new Types.ObjectId(userId) } },
    ];

    if (date) {
      filterPipeline.push(
        {
          $addFields: {
            dateFormatted: {
              $dateToString: {
                format: '%d-%m-%Y',
                date: '$date',
                timezone: timeZone,
              },
            },
          },
        },
        {
          $match: {
            dateFormatted: date,
          },
        },
      );
    }

    const budgetsData = await this.budgetModel.aggregate([
      ...filterPipeline,
      {
        $sort: { createdAt: -1 },
      },
      {
        $facet: {
          stage1: [{ $group: { _id: null, count: { $sum: 1 } } }],
          stage2: stage2Pipeline,
        },
      },
      {
        $unwind: {
          path: '$stage1',
        },
      },
      {
        $project: {
          count: '$stage1.count',
          data: '$stage2',
        },
      },
    ]);

    const budgetsCountNumber = budgetsData[0] ? budgetsData[0].count : 0;
    const budgets = budgetsData[0] ? budgetsData[0].data : [];

    const data = {
      budgets,
      totalBudgets: budgetsCountNumber,
      currentPage: page,
    };
    return data;
  }

  async checkLimit(userId: string) {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());

    let budgetsThisMonth;
    budgetsThisMonth = await this.budgetModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      { $match: { date: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$price' } } },
    ]);
    budgetsThisMonth = budgetsThisMonth[0] || {};

    const user = await this.userService.findById(userId);

    const data = {
      totalBudgetThisMonth: budgetsThisMonth?.total || 0,
      budgetLimit: user?.budgetLimit,
    };
    return data;
  }

  async getAnalytics(timeZone: string, userId: string) {
    const lastMonthStartDate = startOfMonth(subMonths(new Date(), 1));
    const lastMonthEndDate = endOfMonth(subMonths(new Date(), 1));
    const last12MonthStartDate = startOfMonth(subMonths(new Date(), 12));

    let data: any = await this.budgetModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $facet: {
          lastMonth: [
            {
              $match: {
                date: { $gte: lastMonthStartDate, $lte: lastMonthEndDate },
              },
            },
            {
              $addFields: {
                dateId: {
                  $concat: [
                    {
                      $toString: {
                        $month: { date: '$date', timezone: timeZone },
                      },
                    },
                    '/',
                    {
                      $toString: {
                        $dayOfMonth: { date: '$date', timezone: timeZone },
                      },
                    },
                  ],
                },
              },
            },
            {
              $group: {
                _id: '$dateId',
                price: { $sum: '$price' },
              },
            },
            {
              $sort: {
                _id: 1,
              },
            },
          ],
          last12Months: [
            {
              $match: {
                date: { $gte: last12MonthStartDate, $lte: lastMonthEndDate },
              },
            },
            {
              $addFields: {
                dateId: {
                  $concat: [
                    { $toString: { $month: '$date' } },
                    '/',
                    { $toString: { $year: '$date' } },
                  ],
                },
              },
            },
            {
              $group: {
                _id: '$dateId',
                price: { $sum: '$price' },
              },
            },
          ],
        },
      },
    ]);

    const user = await this.userService.findById(userId);

    data = data[0] ? data[0] : {};

    const dateRangeLastMonth = eachDayOfInterval({
      start: lastMonthStartDate,
      end: lastMonthEndDate,
    });
    const lastMonthCategories = dateRangeLastMonth.map((date) =>
      format(date, 'M/d'),
    );
    const lastMonthData = lastMonthCategories.map((category) => {
      const priceData = data.lastMonth.find((item) => category === item._id);
      return priceData?.price || 0;
    });

    const dateRangeLast12Month = eachMonthOfInterval({
      start: last12MonthStartDate,
      end: lastMonthEndDate,
    });
    const last12MonthsCategories = dateRangeLast12Month.map((date) =>
      format(date, 'M/yyyy'),
    );
    const last12MonthsData = last12MonthsCategories.map((category) => {
      const priceData = data.last12Months.find((item) => category === item._id);
      return priceData?.price || 0;
    });

    const last6MonthsCategories = last12MonthsCategories.slice(6);
    const last6MonthsData = last12MonthsData.slice(6);

    const graphData = {
      lastMonth: {
        categories: lastMonthCategories,
        data: lastMonthData,
      },
      last6Months: {
        categories: last6MonthsCategories,
        data: last6MonthsData,
      },
      last12Months: {
        categories: last12MonthsCategories,
        data: last12MonthsData,
      },
      budgetLimit: user?.budgetLimit,
    };
    return graphData;
  }

  async findOne(id: string): Promise<Budget> {
    return this.budgetModel.findById(id).exec();
  }

  async update(id: string, updateBudgetDto: UpdateBudgetDto): Promise<Budget> {
    const budget = this.budgetModel
      .findByIdAndUpdate(id, updateBudgetDto, { new: true })
      .exec();
    if (!budget) {
      throw new NotFoundException(`Budget not found`);
    }
    return budget;
  }

  async remove(id: string): Promise<Budget> {
    return this.budgetModel.findByIdAndDelete(id).exec();
  }
}
