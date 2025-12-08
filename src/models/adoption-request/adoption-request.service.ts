import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateAdoptionRequestDto } from './dto/create-adoption-request.dto';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AdoptionRequestEntity,
  AdoptionRequestStatus,
} from './entities/adoption-request.entity';
import { FindManyOptions, In, Not, Repository } from 'typeorm';
import { AnimalService } from '../animal/animal.service';
import { SmtpService } from 'src/smtp/smtp.service';
import { ShelterUserEntity } from '../shelter-user/entities/shelter-user.entity';
import { ShelterRole } from 'src/common/enums/shelter.enum';
import { SendEmailDto } from 'src/smtp/dtos/send-email.dto';
import { UserEntity } from '../user/entities/user.entity';

@Injectable()
export class AdoptionRequestService {
  private supportEmail: string;

  constructor(
    @InjectRepository(AdoptionRequestEntity)
    private readonly adoptionRequestRepository: Repository<AdoptionRequestEntity>,
    @InjectRepository(ShelterUserEntity)
    private readonly shelterUserRepository: Repository<ShelterUserEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly animalService: AnimalService,
    private readonly smtpService: SmtpService,
  ) {
    const envSupportEmail = process.env.SUPPORT_EMAIL;
    if (!envSupportEmail) {
      throw new Error('SUPPORT_EMAIL environment variable is not set.');
    }
    this.supportEmail = envSupportEmail;
  }

  async getDirectives(shelterId: number): Promise<ShelterUserEntity[]> {
    return this.shelterUserRepository.find({
      where: {
        shelterId,
        role: In([ShelterRole.OWNER, ShelterRole.DIRECTIVE]),
      },
      relations: {
        user: true,
      },
    });
  }

  async create(
    createAdoptionRequestDto: CreateAdoptionRequestDto,
    userId: number,
  ): Promise<AdoptionRequestEntity> {
    const { animalId } = createAdoptionRequestDto;
    const animal = await this.animalService.findOne(animalId, {
      relations: { shelter: true, species: true, breed: true },
    });
    if (!animal) {
      throw new BadRequestException('Animal not found.');
    }
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found.');
    }
    const existingRequest = await this.adoptionRequestRepository.findOne({
      where: { animalId, requesterId: userId },
    });
    if (existingRequest) {
      throw new BadRequestException(
        'You have already submitted an adoption request for this animal.',
      );
    }
    const newRequest = this.adoptionRequestRepository.create({
      ...createAdoptionRequestDto,
      requesterId: userId,
      status: AdoptionRequestStatus.PENDING,
    });
    const res = await this.adoptionRequestRepository.save(newRequest);
    const directives = await this.getDirectives(newRequest.shelterId);
    const species = animal.species;
    const breed = animal.breed;
    const shelter = animal.shelter;
    await Promise.all(
      directives.map((dir) => {
        const userr = dir.user;
        const sendEmailDto: SendEmailDto = {
          userId: userr.id,
          email: userr.email,
          subject: 'Nueva solicitud de adopción - PetFind',
          template: 'adoption-request-created',
          context: {
            directorName: userr.firstName + ' ' + userr.lastName,
            shelterName: shelter.name,
            animalName: animal.name,
            speciesName: species.name,
            breedName: breed.name,
            applicantName: user.firstName + ' ' + user.lastName,
            applicantEmail: user.email,
            requestDate: res.sentAt.toDateString(),
            requestStatus: res.status,
            supportEmail: this.supportEmail,
            year: new Date().getFullYear(),
          },
        };
        return this.smtpService.sendEmail(sendEmailDto);
      }),
    );
    return res;
  }

  async findAll(
    options: FindManyOptions<AdoptionRequestEntity> = {},
    requesterId: number,
  ): Promise<AdoptionRequestEntity[]> {
    const finalOptions: FindManyOptions<AdoptionRequestEntity> = {
      ...options,
      where: {
        ...(options.where || {}),
        requesterId,
      },
      relations: {
        ...(options.relations || {}),
        animal: true,
        requester: true,
        shelter: true,
      },
    };
    return this.adoptionRequestRepository.find(finalOptions);
  }

  async findAllForShelter(
    options: FindManyOptions<AdoptionRequestEntity> = {},
    userId: number,
    shelterId: number,
  ): Promise<AdoptionRequestEntity[]> {
    const hasPermission =
      await this.animalService.hasPermissionToManageAdoptions(
        shelterId,
        userId,
      );
    if (!hasPermission) {
      throw new BadRequestException(
        'You do not have permission to view adoption requests for this shelter.',
      );
    }
    const finalOptions: FindManyOptions<AdoptionRequestEntity> = {
      ...options,
      where: {
        ...(options.where || {}),
        shelterId,
      },
      relations: {
        ...(options.relations || {}),
        animal: true,
        requester: true,
        shelter: true,
      },
    };
    return this.adoptionRequestRepository.find(finalOptions);
  }

  async findOne(
    id: number,
    options: FindManyOptions<AdoptionRequestEntity> = {},
  ): Promise<AdoptionRequestEntity | null> {
    const finalOptions: FindManyOptions<AdoptionRequestEntity> = {
      ...options,
      where: {
        ...(options.where || {}),
        id,
      },
      relations: {
        ...(options.relations || {}),
        animal: true,
        requester: true,
        shelter: true,
      },
    };
    return this.adoptionRequestRepository.findOne(finalOptions);
  }

  async approve(id: number, userId: number): Promise<AdoptionRequestEntity> {
    if (!id) {
      throw new BadRequestException('Adoption request ID is required.');
    }
    const request = await this.adoptionRequestRepository.findOne({
      where: { id },
      relations: {
        shelter: true,
        animal: {
          species: true,
          breed: true,
        },
        requester: true,
      },
    });
    if (!request) {
      throw new BadRequestException('Adoption request not found.');
    }
    const hasPermission =
      await this.animalService.hasPermissionToManageAdoptions(
        request.shelterId,
        userId,
      );
    if (!hasPermission) {
      throw new BadRequestException(
        'You do not have permission to approve this adoption request.',
      );
    }
    request.status = AdoptionRequestStatus.APPROVED;
    const res = await this.adoptionRequestRepository.save(request);
    await this.animalService.setAdoptedByUser(
      request.animalId,
      request.requesterId,
    );
    const requester = request.requester;
    const animal = request.animal;
    const species = animal.species;
    const breed = animal.breed;
    const shelter = request.shelter;
    const sendEmailDto: SendEmailDto = {
      userId: requester.id,
      email: requester.email,
      subject: '¡Tu solicitud de adopción ha sido aprobada! - PetFind',
      template: 'adoption-request-approved',
      context: {
        userName: requester.firstName + ' ' + requester.lastName,
        shelterName: shelter.name,
        animalName: animal.name,
        speciesName: species.name,
        breedName: breed.name,
        approvalDate: new Date().toDateString(),
        supportEmail: this.supportEmail,
        year: new Date().getFullYear(),
      },
    };
    try {
      await this.smtpService.sendEmail(sendEmailDto);
    } catch (error) {
      console.error('Error sending approval email:', error);
    }
    const otherRequests = await this.adoptionRequestRepository.find({
      where: {
        animalId: request.animalId,
        id: Not(id),
      },
    });
    try {
      await Promise.all(
        otherRequests.map(async (otherRequest) => {
          return this.reject(otherRequest.id, userId);
        }),
      );
    } catch (error) {
      console.error('Error rejecting other adoption requests:', error);
    }
    return res;
  }

  async reject(id: number, userId: number): Promise<AdoptionRequestEntity> {
    const request = await this.adoptionRequestRepository.findOne({
      where: { id },
      relations: {
        shelter: true,
        animal: {
          species: true,
          breed: true,
        },
        requester: true,
      },
    });
    if (!request) {
      throw new BadRequestException('Adoption request not found.');
    }
    const hasPermission =
      await this.animalService.hasPermissionToManageAdoptions(
        request.shelterId,
        userId,
      );
    if (!hasPermission) {
      throw new BadRequestException(
        'You do not have permission to reject this adoption request.',
      );
    }
    request.status = AdoptionRequestStatus.REJECTED;
    const res = await this.adoptionRequestRepository.save(request);
    const requester = request.requester;
    const animal = request.animal;
    const species = animal.species;
    const breed = animal.breed;
    const shelter = request.shelter;
    const sendEmailDto: SendEmailDto = {
      userId: requester.id,
      email: requester.email,
      subject: 'Tu solicitud de adopción ha sido rechazada - PetFind',
      template: 'adoption-request-rejected',
      context: {
        userName: requester.firstName + ' ' + requester.lastName,
        shelterName: shelter.name,
        animalName: animal.name,
        speciesName: species.name,
        breedName: breed.name,
        rejectionDate: new Date().toDateString(),
        supportEmail: this.supportEmail,
        year: new Date().getFullYear(),
      },
    };
    try {
      await this.smtpService.sendEmail(sendEmailDto);
    } catch (error) {
      console.error('Error sending rejection email:', error);
    }
    return res;
  }
}
