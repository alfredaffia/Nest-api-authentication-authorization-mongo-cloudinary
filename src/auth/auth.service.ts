import { BadRequestException, ConflictException, HttpException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    private jwtService: JwtService,
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

      console.log('Uploaded file:', file);
  
      // If a profile picture is provided, upload it
      if (file) {
        try {
          const profilePictureUrl = await this.uploadProfilePicture(file, UserDetails._id.toString());
          UserDetails.profilePictureUrl = profilePictureUrl;
  
          // Save the updated user details
          await UserDetails.save();
          console.log('Profile picture URL saved:', profilePictureUrl);
        } catch (error) {
          console.error('Error uploading profile picture:', error.message);
          throw new BadRequestException('Failed to upload profile picture.');
        }
      }
    const token = this.jwtService.sign({ id: UserDetails.id });
  

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

    const token = this.jwtService.sign({ id: user._id });

    return { token };
  }

    async findEmail(email: string) {
    const mail = await this.userModel.findOne({ email })
    if (!mail) {
      throw new UnauthorizedException()
    }
    return mail;
  }


    async findOne(id: string) {
    // const user = await this.userModel.find()

    const findUserById = await this.userModel.findById(id );
    if (!findUserById) {
      throw new NotFoundException('User not found');
    }

    return findUserById;
  }

  

  // Upload or update a profile picture
  async uploadProfilePicture(file: Express.Multer.File, userId: string): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided.');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPG and PNG are allowed.');
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('File size exceeds 5MB limit.');
    }

    return new Promise(async (resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'image' },
        async (error, result) => {
          if (error) {
            console.error('Cloudinary Upload Error:', error);
            return reject(new BadRequestException('File upload failed.'));
          }

          if (!result) {
            return reject(new BadRequestException('Cloudinary did not return a result.'));
          }

          try {
            const user = await this.userModel.findById(userId);
            if (!user) {
              throw new NotFoundException('User not found');
            }

            // Update the user's profile picture URL
            user.profilePictureUrl = result.secure_url;
            await user.save();

            resolve(result.secure_url);
          } catch (dbError) {
            console.error('Database Save Error:', dbError);
            reject(new BadRequestException('Database save failed.'));
          }
        },
      );

      const fileStream = Readable.from(file.buffer);
      fileStream.pipe(uploadStream);
    });
  }


async BlockUser(id: string): Promise<{ message: string }> {
  const user = await this.userModel.findOne({ where: { id } });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  await this.userModel.updateOne(
    { _id: user._id }, // filter - which document to update
    { isBlocked: false } // update - what fields to change
  );

  return { message: `User with ID ${id} has been unblocked.` };
}

  async unBlockUser(id: string): Promise<{ message: string }> {
    const user = await this.userModel.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isBlocked = false;
    await this.userModel.updateOne(user);

    return { message: `User with ID ${id} has been unblocked.` };
  }


  async user(headers: any): Promise<any> {
    const authorizationHeader = headers.authorization; //It tries to extract the authorization header from the incoming request headers. This header typically contains the token used for authentication.
    if (authorizationHeader) {
      const token = authorizationHeader.replace('Bearer ', '');
      const secret = process.env.JWTSECRET;
      //checks if the authorization header exists. If not, it will skip to the else block and throw an error.
      try {
        const decoded = this.jwtService.verify(token);
        let id = decoded["id"]; // After verifying the token, the function extracts the user's id from the decoded token payload.
        let user = await this.userModel.findById({ id });
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
