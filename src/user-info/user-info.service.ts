import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserInfoDto } from './dto/user-info.dto';


@Injectable()
export class UserInfoService {
  constructor(private prisma: PrismaService) {}

  async updateUserInfo(userId: number, data: UpdateUserInfoDto) {
    return this.prisma.userInfo.update({
      where: { userId },
      data,
    });
  }
}
