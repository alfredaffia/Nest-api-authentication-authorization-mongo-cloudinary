import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { UserRole } from '../auth/enum/user.role.enum';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import * as bcrypt from 'bcryptjs';


@Injectable()
export class UserService {
      private readonly ADMIN_USERS_TO_SEED = [
      {
        email: 'admin@gmail.com',
        password: 'SuperSecureAdminPassword123!', 
        name: 'Admin',
        role:UserRole.Admin
      },
      {
        email: 'admin2@dmail.com',
        password: 'AnotherStrongPassword456!', 
        name: 'Secondary Administrator',
        role:UserRole.Admin
      },
    ];
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  // find a user by id
    async findOne(id: string) {
    const findUserById = await this.userModel.findById(id );
    if (!findUserById) {
      throw new NotFoundException('User not found');
    }
    return findUserById;
  }

async findAll(){
    const users = await this.userModel.find();
    if (!users || users.length === 0) {
      throw new NotFoundException('No users found');
    }
    return users;
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


  async blockUser(id: string): Promise<{ message: string }> {
    const user = await this.userModel.findById(id); // Use `findById` to query by MongoDB `_id`
  
    if (!user) {
      throw new NotFoundException('User not found');
    }
  
    // Set the user's `isBlocked` status to true
    user.isBlocked = true;
    await user.save(); // Save the updated user document
  
    return { message: `User with ID ${id} has been blocked.` };
  }

    async unblockUser(id: string): Promise<{ message: string }> {
    const user = await this.userModel.findById(id); // Use `findById` to query by MongoDB `_id`
  
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isBlocked = false;
    await user.save(); // Save the updated user document
  
    return { message: `User with ID ${id} has been unblocked.` };
  }



    
    async seedDefaultAdmins() {
    if (!this.ADMIN_USERS_TO_SEED || this.ADMIN_USERS_TO_SEED.length === 0) {
      console.warn('No admin users defined for seeding. Skipping.');
      return;
    }

    for (const adminData of this.ADMIN_USERS_TO_SEED) {
      try {
        const existingAdmin = await this.userModel.findOne({ email: adminData.email }).exec();
        if (existingAdmin) {
          console.warn(`Admin "${adminData.email}" already exists. Skipping.`);
          continue;
        }

        const hashedPassword = await bcrypt.hash(adminData.password, 10);

        const newAdmin = new this.userModel({
          name: adminData.name,
          email: adminData.email,
          password: hashedPassword,
       role: adminData.role || UserRole.Admin, 
          profilePictureUrl: null,
        });

        await newAdmin.save();
          console.log(`Admin "${adminData.email}" seeded successfully.`);
      

      } catch (error) {
        console.error(`Error seeding admin "${adminData.email}": ${error.message}`);
      }
    }
  }



  async promoteToAdmin(id :string){


  }


}
