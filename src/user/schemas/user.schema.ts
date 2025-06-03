import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../../auth/enum/user.role.enum';

export type UserDocument = User & Document;

@Schema({})
export class User extends Document {

  @Prop()
  id:string;

  @Prop()
  name: string;

  @Prop()
  email: string;

  @Prop()
  password: string;

  @Prop()
  profilePictureUrl: string;

  
  @Prop({
    enum:UserRole,
    default :UserRole.User
  })
  role:UserRole

  @Prop({default: false})
  isBlocked: boolean;
}
export const UserSchema = SchemaFactory.createForClass(User);
