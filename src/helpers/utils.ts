import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

export const generatePassword = async (password) => {
  const bcrypted_password = await bcrypt.hash(password, 8);
  return bcrypted_password;
};

export const comparePassword = (
  candidatePassword: string,
  hashedPassword: string,
) => {
  const isMatched = bcrypt.compare(candidatePassword, hashedPassword);
  return isMatched;
};

export const generateAuthToken = (user, jwtService: JwtService) => {
  return jwtService.sign(user);
};
