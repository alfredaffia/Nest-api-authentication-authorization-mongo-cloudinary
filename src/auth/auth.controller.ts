import { BadRequestException, Body, Controller, Get, Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from './guard/role.guard';
import { Roles } from './guard/role';
import { UserRole } from './enum/user.role.enum';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
    @UseInterceptors(FileInterceptor('file'))
  signUp(@Body() signUpDto: SignUpDto , @UploadedFile() file?: Express.Multer.File,)
 {
        return this.authService.signUp(signUpDto,file);
    }

  @Post('/login')
  login(@Body() loginDto: LoginDto): Promise<{ token: string }> {
    return this.authService.login(loginDto);
  }

    @UseGuards(AuthGuard())
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authService.findOne(id);
  }


    @Post('upload/:id')
  @UseInterceptors(FileInterceptor('file')) // Ensure this matches the form-data key
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Param('id') id: string) {
    if (!file) {
      throw new BadRequestException('No file received. Please upload a valid file.');
    }

    try {
      return await this.authService.uploadProfilePicture(file,id);
    } catch (error) {
      throw new BadRequestException(`File upload failed: ${error.message}`);
    }
  }

    @UseGuards(AuthGuard(),RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/block')
  async updateBlockStatus(
    @Param('id') id: string) {
    return this.authService.BlockUser(id);
  }

    @UseGuards(AuthGuard(),RolesGuard)
  @Roles(UserRole.ADMIN) 
  @Patch(':id/unblock')
  async updateUnBlockStatus(
    @Param('id') id: string) {
    return this.authService.unBlockUser(id);
  }
}

