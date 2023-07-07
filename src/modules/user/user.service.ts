import { Injectable, NotFoundException, UseInterceptors } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User, UserDocument } from 'src/models';
import { SignupDto } from '../auth/dto/signup.dto';
import { SentryInterceptor } from 'src/helpers/sentry.interceptor';

@UseInterceptors(SentryInterceptor)
@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: mongoose.Model<User>,
  ) {}

  async createUser(createUserDto: SignupDto): Promise<UserDocument> {
    const user = new this.userModel(createUserDto);
    await user.save();
    return user;
  }

  async remove(email: string) {
    const user = await this.userModel.findOneAndDelete({ email });
    if (!user) {
      throw new NotFoundException(`User not found`);
    }
    return 'User Deleted Successfully';
  }

  async findById(id: string): Promise<UserDocument | undefined> {
    return this.userModel.findById(id).lean();
  }

  async findByEmail(email: string): Promise<UserDocument | undefined> {
    return this.userModel.findOne({ email });
  }
}
