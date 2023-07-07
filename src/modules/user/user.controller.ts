import { Controller, Param, Delete } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Delete(':email')
  remove(@Param('email') email: string) {
    return this.userService.remove(email);
  }
}
