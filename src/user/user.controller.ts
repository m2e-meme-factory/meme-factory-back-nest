import { Controller, Post, Get, Query, Body, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { BadRequestException } from '@nestjs/common';
import { VerifyUserDto, IsUserVerifiedDto, GetReferalsCountDto, GetUserDataDto, CreateUserDto } from './dto/user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  async createUser(@Body() createUserDto: CreateUserDto) {
    return await this.userService.createUser(createUserDto);
  }

  @Post('is_user_verified')
  async isUserVerified(@Body() body: IsUserVerifiedDto): Promise<{ isUser: boolean }> {
    const { userId } = body;
    try {
      return await this.userService.isUserVerified(userId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('verify_user')
  async verifyUser(
    @Body() body: VerifyUserDto,
  ): Promise<any> {
    const { userId } = body;
    try {
      return await this.userService.verifyUser(userId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('referals_info')
  async getReferalsCount(@Query() query: GetReferalsCountDto): Promise<{ count: number }> {
    const { refId } = query;
    try {
      return await this.userService.getReferalsCount(refId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('get_user_data')
  async getUserData(@Query() query: GetUserDataDto): Promise<any> {
    const { userId } = query;
    try {
      return await this.userService.getUserData(userId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  @Get('')
  async getAllUsers(): Promise<any> {
    try {
      return await this.userService.getAllUsers();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  @Get('/by-id/:userId')
  async getUserById(@Param('userId') userId: string): Promise<any> {
    try {
      return await this.userService.getUserById(parseInt(userId));
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  @Get('/by-telegram/:telegramId')
  async getUserByTelegramId(@Param('telegramId') telegramId: string): Promise<any> {
    try {
      return await this.userService.getUserByTelegramId(telegramId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
