import { BadRequestException, ConflictException, HttpException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import { SignUpDto } from '../user/dto/signup.dto';
import { LoginDto } from '../user/dto/login.dto';
import { Readable } from 'stream';
import { UserRole } from './enum/user.role.enum';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcryptjs';


@Injectable()
export class AuthService {
  constructor(

    @InjectModel(User.name)
    private userModel: Model<User>,
    private jwtService: JwtService,
    private userService:UserService
  ) {}

  async signUp(signUpDto: SignUpDto,file?:Express.Multer.File){
    try{
 
    const {name, email, password, profilePictureUrl,...rest} = signUpDto;

    const hashedPassword = await bcrypt.hash(password, 10);

         const existinguser=await this.userModel.findOne({email:signUpDto.email})
      if(existinguser){
        throw new ConflictException('user with this email already exist')
      }
    // const ProfilePictureUrl =await this.uploadProfilePicture(file,signUpDto.id)

    const UserDetails = await this.userModel.create({
      name,
      email,
      password: hashedPassword,
           ...rest
    });

      // console.log('Uploaded file:', file);
  
      // If a profile picture is provided, upload it
      if (file) {
        try {
          const profilePictureUrl = await this.userService.uploadProfilePicture(file, UserDetails._id.toString());
          UserDetails.profilePictureUrl = profilePictureUrl;
  
          // Save the updated user details
          await UserDetails.save();
          console.log('Profile picture URL saved:', profilePictureUrl);
        } catch (error) {
          console.error('Error uploading profile picture:', error.message);
          throw new BadRequestException('Failed to upload profile picture.');
        }
      }
    const token = this.jwtService.sign({ id: UserDetails.id,email: UserDetails.email, role: UserDetails.role });
  

    return { token 
, user: { id: UserDetails.id, name: UserDetails.name, email: UserDetails.email, profilePictureUrl: UserDetails.profilePictureUrl }
    };
  }
  catch (error) {
      console.error('Error creating user:', error.message);
      throw error;
    }
}

  async login(loginDto: LoginDto): Promise<{ token: string }> {
    const { email, password } = loginDto;

    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.jwtService.sign({ id: user._id,email: user.email, role: user.role });

    return { token };
  }



    async findEmail(email: string) {
    const mail = await this.userModel.findOne({ email })
    if (!mail) {
      throw new UnauthorizedException()
    }
    return mail;
  }


  async user(headers: any): Promise<any> {
    const authorizationHeader = headers.authorization; //It tries to extract the authorization header from the incoming request headers. This header typically contains the token used for authentication.
    if (authorizationHeader) {
      const token = authorizationHeader.replace('Bearer ', '');
      const secret = process.env.JWT_SECRET;
      //checks if the authorization header exists. If not, it will skip to the else block and throw an error.
      try {
        const decoded = this.jwtService.verify(token);
        let id = decoded["id"]; // After verifying the token, the function extracts the user's id from the decoded token payload.
        let user = await this.userModel.findOne({ id });
        return { id: id, email: user?.email, role: user?.role };
      } catch (error) {
        throw new UnauthorizedException('Invalid token');

      }
    } else
      throw new UnauthorizedException('Invalid or missing Bearer token');

  }


































  

  // // Update profile picture for an existing user
  // async updateProfilePicture(file: Express.Multer.File, headers: any): Promise<any> {
  //   const user = await this.authenticateUser(headers);
  //   const profilePictureUrl = await this.uploadProfilePicture(file, user.id);

  //   return {
  //     message: 'Profile picture updated successfully',
  //     profilePictureUrl,
  //   };
  // }
}
