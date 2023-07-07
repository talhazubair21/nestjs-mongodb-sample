import { Module } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { BudgetController } from './budget.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { BudgetSchema } from 'src/models';
import { UserModule } from '../user/user.module';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Budget', schema: BudgetSchema }]),
    UserModule,
  ],
  controllers: [BudgetController],
  providers: [BudgetService],
})
export class BudgetModule {}
