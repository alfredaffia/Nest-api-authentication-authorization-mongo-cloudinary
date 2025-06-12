import { PartialType } from '@nestjs/mapped-types';
import { SignUpDto } from './signup.dto';

export class UpdateUserDto extends PartialType(SignUpDto) {}
