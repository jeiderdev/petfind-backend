import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateShelterDto } from './dto/create-shelter.dto';
import { UpdateShelterDto } from './dto/update-shelter.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ShelterEntity } from './entities/shelter.entity';
import { FindManyOptions, Repository } from 'typeorm';
import { ShelterRole, ShelterStatus } from 'src/common/enums/shelter.enum';
import { UserEntity } from '../user/entities/user.entity';
import { SystemRoles } from 'src/common/enums/system-role.enum';
import { ShelterUserService } from '../shelter-user/shelter-user.service';
import { SmtpService } from 'src/smtp/smtp.service';
import { SendEmailDto } from 'src/smtp/dtos/send-email.dto';
import { RejectShelterDto } from './dto/reject-shelter.dto';
import { AnimalService } from '../animal/animal.service';

@Injectable()
export class ShelterService {
  private supportEmail: string;
  private frontEndUrl: string;

  constructor(
    @InjectRepository(ShelterEntity)
    private readonly shelterRepository: Repository<ShelterEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly shelterUserService: ShelterUserService,
    private readonly smtpService: SmtpService,
    private readonly animalService: AnimalService,
  ) {
    const auxSupportEmail = process.env.SUPPORT_EMAIL;
    const auxFrontEndUrl = process.env.FRONTEND_URL;
    if (!auxSupportEmail) {
      throw new Error('SUPPORT_EMAIL is not defined in environment variables');
    }
    if (!auxFrontEndUrl) {
      throw new Error('FRONTEND_URL is not defined in environment variables');
    }
    this.supportEmail = auxSupportEmail;
    this.frontEndUrl = auxFrontEndUrl;
  }

  async create(
    createShelterDto: CreateShelterDto,
    userId: number,
  ): Promise<ShelterEntity> {
    const shelter = this.shelterRepository.create({
      ...createShelterDto,
      createdById: userId,
    });
    const admins = await this.userRepository.find({
      where: {
        systemRole: {
          name: SystemRoles.ADMIN,
        },
      },
    });
    const res = await this.shelterRepository.save(shelter);
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    await Promise.all(
      admins.map((admin) => {
        const sendEmailDto: SendEmailDto = {
          userId: admin.id,
          email: admin.email,
          subject: 'Nuevo refugio creado - Requiere aprobación',
          template: 'shelter-created',
          context: {
            userName: admin.firstName + ' ' + admin.lastName,
            shelterName: res.name,
            createdBy: `${user?.firstName} ${user?.lastName} (${user?.email})`,
            contactEmail: res.contactEmail,
            contactPhone: res.contactPhone,
            location: res.address,
            createdAt: res.createdAt,
            shelterUrl: `${this.frontEndUrl}/admin/shelters/${res.id}`,
            year: new Date().getFullYear(),
          },
        };
        return this.smtpService.sendEmail(sendEmailDto);
      }),
    );
    return res;
  }

  async findAll(
    options: FindManyOptions<ShelterEntity> = {},
  ): Promise<ShelterEntity[]> {
    return this.shelterRepository.find(options);
  }

  async findOne(
    id: number,
    options: FindManyOptions<ShelterEntity> = {},
  ): Promise<ShelterEntity | null> {
    if (!id) throw new BadRequestException('Shelter ID is required');
    return this.shelterRepository.findOne({
      ...options,
      where: { ...(options.where || {}), id },
    });
  }

  async findOneWithAnimals(
    id: number,
    query: Record<string, string> = {},
  ): Promise<ShelterEntity | null> {
    if (!id) throw new BadRequestException('Shelter ID is required');
    const shelter = await this.shelterRepository.findOne({
      where: { id },
    });
    if (!shelter) {
      throw new BadRequestException(`Shelter with ID ${id} not found`);
    }
    const animals = await this.animalService.findAllWithFilters({
      ...query,
      shelterId: String(id),
    });
    shelter.animals = animals;
    return shelter;
  }

  async update(
    id: number,
    updateShelterDto: UpdateShelterDto,
    userId: number,
  ): Promise<ShelterEntity> {
    const shelter = await this.findOne(id);
    if (!shelter) {
      throw new BadRequestException(`Shelter with ID ${id} not found`);
    }
    if (!userId)
      throw new BadRequestException('User ID is required for update');
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: {
        systemRole: true,
      },
    });
    if (!user) {
      throw new BadRequestException(`User with ID ${userId} not found`);
    }
    const isAdmin = user.systemRole?.name === SystemRoles.ADMIN;
    // TODO: Validar en la tabla ShelterUser los permisos del usuario
    if (!isAdmin && shelter.createdById !== userId) {
      throw new BadRequestException(
        `You are not authorized to update this shelter`,
      );
    }
    Object.assign(shelter, updateShelterDto);
    return await this.shelterRepository.save(shelter);
  }

  async approve(id: number, approverId: number): Promise<ShelterEntity> {
    const shelter = await this.findOne(id, {
      relations: {
        createdBy: true,
      },
    });
    if (!shelter) {
      throw new BadRequestException(`Shelter with ID ${id} not found`);
    }
    const approver = await this.userRepository.findOne({
      where: { id: approverId },
    });
    if (!approver) {
      throw new BadRequestException(`User with ID ${approverId} not found`);
    }
    shelter.status = ShelterStatus.APPROVED;
    shelter.approvedById = approverId;
    shelter.approvedAt = new Date();
    const res = await this.shelterRepository.save(shelter);
    try {
      const ownerRoleDto = {
        shelterId: shelter.id,
        userId: approverId,
        role: ShelterRole.OWNER,
      };
      await this.shelterUserService.create(ownerRoleDto, approverId);
    } catch (error) {
      // Log error but do not block the approval process
      console.error('Error assigning OWNER role to approver:', error);
    }
    const creator = shelter.createdBy;
    const sendEmailDto: SendEmailDto = {
      userId: shelter.createdById,
      email: creator.email,
      subject: 'Tu refugio ha sido aprobado',
      template: 'shelter-approved',
      context: {
        userName: creator.firstName + ' ' + creator.lastName,
        shelterName: shelter.name,
        supportEmail: this.supportEmail,
        shelterUrl: `${this.frontEndUrl}/shelters/${shelter.id}`,
        year: new Date().getFullYear(),
      },
    };
    await this.smtpService.sendEmail(sendEmailDto);
    return res;
  }

  async reject(
    id: number,
    dto: RejectShelterDto,
    rejectorId: number,
  ): Promise<ShelterEntity> {
    const shelter = await this.findOne(id, {
      relations: {
        createdBy: true,
      },
    });
    if (!shelter) {
      throw new BadRequestException(`Shelter with ID ${id} not found`);
    }
    const rejector = await this.userRepository.findOne({
      where: { id: rejectorId },
    });
    if (!rejector) {
      throw new BadRequestException(`User with ID ${rejectorId} not found`);
    }
    shelter.status = ShelterStatus.REJECTED;
    shelter.approvedById = rejectorId;
    shelter.approvedAt = new Date();
    shelter.rejectionReason = dto.reason;
    const res = await this.shelterRepository.save(shelter);
    const creator = shelter.createdBy;
    const sendEmailDto: SendEmailDto = {
      userId: shelter.createdById,
      email: creator.email,
      subject: 'Tu refugio ha sido rechazado',
      template: 'shelter-rejected',
      context: {
        userName: creator.firstName + ' ' + creator.lastName,
        shelterName: shelter.name,
        rejectionReason: dto.reason,
        supportEmail: this.supportEmail,
        year: new Date().getFullYear(),
      },
    };
    await this.smtpService.sendEmail(sendEmailDto);
    return res;
  }

  async getShelterMembers(
    shelterId: number,
    userId: number,
  ): Promise<ShelterEntity> {
    const hasPermission =
      await this.shelterUserService.hasPermissionToManageMembers(
        shelterId,
        userId,
      );
    if (!hasPermission) {
      throw new UnauthorizedException(
        `You do not have permission to manage members of shelter ID ${shelterId}`,
      );
    }
    const shelter = await this.findOne(shelterId, {
      relations: {
        members: {
          user: true,
        },
      },
    });
    if (!shelter) {
      throw new BadRequestException(`Shelter with ID ${shelterId} not found`);
    }
    return shelter;
  }

  async remove(id: number): Promise<void> {
    const shelter = await this.findOne(id);
    if (!shelter) {
      throw new BadRequestException(`Shelter with ID ${id} not found`);
    }
    await this.shelterRepository.remove(shelter);
  }
}
