// src/database/seeders/admin.seeder.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // To get values from .env
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './auth/schemas/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { UserRole } from './auth/enum/user.role.enum';

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

    if (!adminEmail || !adminPassword) {
      console.warn('WARNING: ADMIN_EMAIL or ADMIN_PASSWORD not set in environment variables. Skipping admin seeding.');
      return;
    }

    try {
      // 1. Check if admin user already exists
      const existingAdmin = await this.userModel.findOne({ email: adminEmail }).exec();

      if (!existingAdmin) {
        const saltRounds = 10; // Standard salt rounds for bcrypt
        const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
          //  const hashedPassword = await argon2.hash(adminPassword);

        const adminUser = new this.userModel({
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
          role: UserRole.ADMIN, 
        });

        await adminUser.save();
        console.log(`SUCCESS: Admin user '${adminEmail}' seeded.`);
      } else {
        console.log(`INFO: Admin user '${adminEmail}' already exists. Skipping seeding.`);
      }
    } catch (error) {
      console.error('ERROR: Failed to seed admin user:', error);
    }
  }
}