import { BadRequestException, Body, Controller, Get, Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../user/dto/login.dto';
import { SignUpDto } from '../user/dto/signup.dto';
import { FileInterceptor } from '@nestjs/platform-express';


@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
    @UseInterceptors(FileInterceptor('file'))
  signUp(@Body() signUpDto: SignUpDto , @UploadedFile() file?: Express.Multer.File,)
 {
        return this.authService.signUp(signUpDto,file);
    }

  @Post('login')
  login(@Body() loginDto: LoginDto): Promise<{ token: string }> {
    return this.authService.login(loginDto);
  }

}

