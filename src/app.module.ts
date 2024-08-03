import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { ProjectModule } from './project/project.module';
import { AuthModule } from './auth/auth.module';
import { FileService } from './file/file.service';
import { FileController } from './file/file.controller';
import { FileModule } from './file/file.module';

@Module({
  imports: [PrismaModule, UserModule, ProjectModule, AuthModule, FileModule],
  controllers: [AppController, FileController],
  providers: [AppService, FileService],
})
export class AppModule {}
