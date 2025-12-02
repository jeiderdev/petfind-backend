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
import { OtpCodeEntity } from './entities/otp-code.entity';
import { EncryptionService } from 'src/security/encryption.service';
import { SmtpService } from 'src/smtp/smtp.service';
import { ValidateOtpCodeDto } from './dto/validate-otp-code.dto';
import { ResendOtpCodeDto } from './dto/resend-otp-code.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly hashingService: HashingService,
    private readonly encryptionService: EncryptionService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(SystemRoleEntity)
    private readonly systemRoleRepository: Repository<SystemRoleEntity>,
    @InjectRepository(OtpCodeEntity)
    private readonly OtpCodeRepository: Repository<OtpCodeEntity>,
    private readonly smtpService: SmtpService,
  ) {}

  async hashPassword(password: string): Promise<string> {
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

  async generateOtpCode(userId: number): Promise<string> {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    const encryptedOtpCode = await this.encryptionService.encrypt(otpCode);
    const emailOtpCode = this.OtpCodeRepository.create({
      userId,
      otpCode: encryptedOtpCode,
      expiresAt,
      consumedAt: null,
      attempts: 0,
    });
    await this.OtpCodeRepository.save(emailOtpCode);
    return otpCode;
  }

  async generateAndSendEmailOtpCode(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const otpCode = await this.generateOtpCode(userId);
    const supportEmail = process.env.SUPPORT_EMAIL || 'soporte@petfind.com';
    await this.smtpService.sendEmail({
      userId: user.id,
      email: user.email,
      subject: 'Tu código OTP de verificación',
      template: 'otp-code',
      context: {
        userName: user.firstName,
        verificationCode: otpCode,
        supportEmail,
        validTime: 10,
        year: new Date().getFullYear(),
      },
    });
  }

  async resendEmailOtpCode(resendOtpCode: ResendOtpCodeDto): Promise<string> {
    const { email } = resendOtpCode;
    const user = await this.userRepository.findOne({
      where: { email },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    await this.generateAndSendEmailOtpCode(user.id);
    return 'OTP code sent successfully';
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
    const passwordHash = await this.hashPassword(password);
    const newUser = this.userRepository.create({
      ...signUpDto,
      password: passwordHash,
      systemRoleId: defaultSystemRole.id,
      isVerified: false,
    });
    await this.userRepository.save(newUser);
    await this.generateAndSendEmailOtpCode(newUser.id);
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
    if (!user.isVerified) {
      return 'UNVERIFIED_USER';
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

  async validateOtpCode(dto: ValidateOtpCodeDto): Promise<string> {
    const { email, code } = dto;
    const user = await this.userRepository.findOne({
      where: { email },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const otpRecord = await this.OtpCodeRepository.findOne({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
    });
    if (!otpRecord) {
      throw new BadRequestException('OTP code not found');
    }
    const { consumedAt, expiresAt, otpCode } = otpRecord;
    if (consumedAt) {
      throw new BadRequestException('OTP code has already been used');
    }
    if (expiresAt < new Date()) {
      throw new BadRequestException('OTP code has expired');
    }
    const decryptedOtpCode = await this.encryptionService.decrypt(otpCode);
    if (decryptedOtpCode !== code) {
      otpRecord.attempts += 1;
      await this.OtpCodeRepository.save(otpRecord);
      throw new BadRequestException('Invalid OTP code');
    }
    otpRecord.consumedAt = new Date();
    otpRecord.attempts += 1;
    await this.OtpCodeRepository.save(otpRecord);
    user.isVerified = true;
    await this.userRepository.save(user);
    return this.generateUserJwtToken(user.id);
  }
}
