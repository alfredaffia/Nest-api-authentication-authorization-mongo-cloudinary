import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '../auth/enum/user.role.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { RolesGuard } from 'src/auth/guard/role.guard';
import { Roles } from 'src/auth/guard/role';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }


  @UseGuards(AuthGuard())
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserRole.Admin)
  @Get('/fetch-all')
  findAll() {
    return this.userService.findAll();
  }


  @UseGuards(AuthGuard())
  @Post('upload/:id')
  @UseInterceptors(FileInterceptor('file')) // Ensure this matches the form-data key
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Param('id') id: string) {
    if (!file) {
      throw new BadRequestException('No file received. Please upload a valid file.');
    }

    try {
      return await this.userService.uploadProfilePicture(file, id);
    } catch (error) {
      throw new BadRequestException(`File upload failed: ${error.message}`);
    }
  }

  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserRole.Admin)
  @Patch(':id/block')
  async updateBlockStatus(
    @Param('id') id: string) {
    return this.userService.blockUser(id);
  }

  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserRole.Admin

  )
  @Patch(':id/unblock')
  async updateUnBlockStatus(@Param('id') id: string) {
    return this.userService.unblockUser(id);
  }

  @Post('seed-admins')
  async seedAdmins() {
    return await this.userService.seedDefaultAdmins();

  }
}
