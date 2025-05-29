import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BookModule } from './book/book.module';
import { AuthModule } from './auth/auth.module';
import { CloudinaryModule } from './cloudinary/coudinary.module';
import { AdminSeeder } from './admin.seeder';
import { User, UserSchema } from './auth/schemas/user.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    CloudinaryModule,
    MongooseModule.forRoot(process.env.DB_URI),
      MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), 
    BookModule,
    AuthModule,
  ],
  controllers: [],
  providers: [AdminSeeder],
})
export class AppModule {}
