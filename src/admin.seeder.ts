// src/database/seeders/admin.seeder.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // To get values from .env
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './user/schemas/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { UserRole } from './user/enum/user.role.enum';

@Injectable()
export class AdminSeeder implements OnModuleInit {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private configService: ConfigService, // Inject ConfigService to access .env variables
  ) {}

  async onModuleInit() {
    console.log('AdminSeeder: Checking for admin user...');
    await this.seedAdminUser();
  }

  private async seedAdminUser() {
       const adminName = this.configService.get<string>('ADMIN_NAME');
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');
         const adminName2 = this.configService.get<string>('ADMIN_NAME2');
    const adminEmail2 = this.configService.get<string>('ADMIN_EMAIL2');

    if (!adminEmail || !adminPassword) {
      console.warn('WARNING: ADMIN_EMAIL or ADMIN_PASSWORD not set in environment variables. Skipping admin seeding.');
      return;
    }

    try {
      const existingAdmin = await this.userModel.findOne({ email: adminEmail });
      const existingAdmin2 = await this.userModel.findOne({ email: adminEmail2 });

      if (!existingAdmin && !existingAdmin2) {
        const saltRounds = 10; // Standard salt rounds for bcrypt
        const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
          //  const hashedPassword = await argon2.hash(adminPassword);

        const adminUser = new this.userModel({
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
          role: UserRole.ADMIN, 
        },
      {
          name: adminName2,
          email: adminEmail2,
          password: hashedPassword,
          role: UserRole.ADMIN, 
        });

        await adminUser.save();
        console.log(`SUCCESS: Admin user '${adminEmail}' seeded.`);
         console.log(`SUCCESS: Admin user '${adminEmail2}' seeded.`);
      } else {
        console.log(`INFO: Admin user '${adminEmail}' already exists. Skipping seeding.`);
   console.log(`INF8: Admin user '${adminEmail2}' already exists. Skipping seeding.`);
      }
    } catch (error) {
      console.error('ERROR: Failed to seed admin user:', error);
    }
  }
}