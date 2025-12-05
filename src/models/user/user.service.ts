import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { FindManyOptions, Repository } from 'typeorm';
import { AuthService } from 'src/auth/auth.service';
import { SignupDto } from 'src/auth/dto/signup.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly authService: AuthService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const signupDto = new SignupDto();
    Object.assign(signupDto, createUserDto);
    return this.authService.signUp(signupDto);
  }

  async findAll(
    options: FindManyOptions<UserEntity> = {},
  ): Promise<UserEntity[]> {
    return this.userRepository.find(options);
  }

  async findOne(
    id: number,
    options?: FindManyOptions<UserEntity>,
  ): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      ...options,
      where: { ...(options?.where || {}), id },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    if (!id) throw new BadGatewayException('User ID is required for update');
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException(`User not found`);
    await this.userRepository.update(id, updateUserDto);
    return this.findOne(id);
  }
}
