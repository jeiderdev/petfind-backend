import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HashingService } from 'src/security/hashing.service';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/models/user/entities/user.entity';
import { Repository } from 'typeorm';
import { DEFAULT_SYSTEM_ROLE, UserPayload } from './utils';
import { SignupDto } from './dto/signup.dto';
import { SystemRoleEntity } from 'src/models/system-role/entities/system-role.entity';
import { SigninDto } from './dto/signin.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly hashingService: HashingService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(SystemRoleEntity)
    private readonly systemRoleRepository: Repository<SystemRoleEntity>,
  ) {}

  async encodePassword(password: string): Promise<string> {
    return this.hashingService.hash(password);
  }

  async comparePasswords(
    password: string,
    passwordHash: string,
  ): Promise<boolean> {
    return this.hashingService.compare(password, passwordHash);
  }

  async generateJwtToken(payload: any): Promise<string> {
    return await this.jwtService.signAsync(payload);
  }

  async generateUserJwtToken(userId: number): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: {
        systemRole: true,
      },
    });
    if (!user || !user.systemRole) {
      throw new UnauthorizedException('Invalid user credentials');
    }
    const payload: UserPayload = {
      id: user.id,
      email: user.email,
      role: user.systemRole.name,
    };
    return await this.generateJwtToken(payload);
  }

  async signUp(signUpDto: SignupDto): Promise<UserEntity> {
    const { email, documentId, password } = signUpDto;
    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { documentId }],
    });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }
    const defaultSystemRole = await this.systemRoleRepository.findOne({
      where: { name: DEFAULT_SYSTEM_ROLE },
    });
    if (!defaultSystemRole) {
      throw new BadRequestException(
        `Default system role '${DEFAULT_SYSTEM_ROLE}' not found`,
      );
    }
    const passwordHash = await this.encodePassword(password);
    const newUser = this.userRepository.create({
      ...signUpDto,
      password: passwordHash,
      systemRoleId: defaultSystemRole.id,
    });
    await this.userRepository.save(newUser);
    return newUser;
  }

  async signIn(signinDto: SigninDto): Promise<string> {
    const { email, password } = signinDto;
    const user = await this.userRepository.findOne({
      where: { email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid user credentials');
    }
    const isPasswordValid = await this.comparePasswords(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid user credentials');
    }
    return this.generateUserJwtToken(user.id);
  }

  async getUserProfile(userId: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: {
        systemRole: true,
      },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }
}
