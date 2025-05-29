import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { Model } from 'mongoose';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { User } from './schemas/user.schema';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload) {
    const { id } = payload;
    const user = await this.userModel.findById(id);
 console.log('User validated:', user);
    if (!user) {
      throw new UnauthorizedException('Login first to access this endpoint.');
    }
       if (user.isBlocked===true) {
      throw new UnauthorizedException(`${user.name} Your account is blocked`);
    }
    console.log('User found:', user);

    return user;
   
  }
//     async validate(payload: {email}): Promise<User>{
//     const {email} = payload;
//     const user = await this.authService.findEmail(email)
 
//     if(!user){
//         throw new UnauthorizedException('Login first to access this endpoint')
//     }
//     return user;
// }
}
