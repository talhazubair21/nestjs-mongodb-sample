import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { comparePassword, generateAuthToken } from 'src/helpers/utils';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { UserService } from '../user/user.service';
import { SentryInterceptor } from 'src/helpers/sentry.interceptor';

@UseInterceptors(SentryInterceptor)
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUser: SignupDto) {
    const { email } = createUser;
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new NotFoundException('User already exists');
    }
    const user = await this.userService.createUser(createUser);
    const tokenData = {
      _id: user._id,
      email: user.email,
    };
    const data = {
      token: generateAuthToken(tokenData, this.jwtService),
      userId: user._id,
    };
    return data;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const tokenData = {
      _id: user._id,
      email: user.email,
    };
    const data = {
      token: generateAuthToken(tokenData, this.jwtService),
      userId: user._id,
    };
    return data;
  }
}
