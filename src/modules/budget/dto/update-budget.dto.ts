import { IsNotEmpty, IsNumber, IsDateString } from 'class-validator';

export class UpdateBudgetDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsNotEmpty()
  @IsDateString()
  date: Date;
}
