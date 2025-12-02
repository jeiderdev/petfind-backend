import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBreedDto } from './dto/create-breed.dto';
import { UpdateBreedDto } from './dto/update-breed.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { BreedEntity } from './entities/breed.entity';
import { FindManyOptions, Repository } from 'typeorm';
import { SpeciesEntity } from '../species/entities/species.entity';
import { UserEntity } from '../user/entities/user.entity';
import { SystemRoles } from 'src/common/enums/system-role.enum';
import { SmtpService } from 'src/smtp/smtp.service';
import { SendEmailDto } from 'src/smtp/dtos/send-email.dto';

@Injectable()
export class BreedService {
  constructor(
    @InjectRepository(BreedEntity)
    private readonly breedRepository: Repository<BreedEntity>,
    @InjectRepository(SpeciesEntity)
    private readonly speciesRepository: Repository<SpeciesEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly smtpService: SmtpService,
  ) {}

  async create(
    createBreedDto: CreateBreedDto,
    userId: number,
  ): Promise<BreedEntity> {
    const { speciesId, name } = createBreedDto;
    const existingBreed = await this.breedRepository.findOneBy({
      name,
      speciesId,
    });
    if (existingBreed) {
      throw new BadRequestException(
        'Breed with this name already exists for the given species',
      );
    }
    const species = await this.speciesRepository.findOneBy({ id: speciesId });
    if (!species) {
      throw new NotFoundException('Species not found');
    }
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const newBreed = this.breedRepository.create({
      ...createBreedDto,
    });
    const res = this.breedRepository.save(newBreed);

    const admins = await this.userRepository.find({
      where: { systemRole: { name: SystemRoles.ADMIN } },
    });
    await Promise.all(
      admins.map(async (admin) => {
        const emailDto = {
          email: admin.email,
          userId: admin.id,
          subject: 'Nueva raza creada',
          template: 'breed-created',
          context: {
            adminName: admin.firstName + ' ' + admin.lastName,
            breedName: newBreed.name,
            speciesName: species.name,
            breedDescription: newBreed.description || 'No description provided',
            createdBy: user.firstName + ' ' + user.lastName,
            userEmail: user.email,
            createdAt: newBreed.createdAt,
            year: new Date().getFullYear(),
          },
        };
        return this.smtpService.sendEmail(emailDto);
      }),
    );
    return res;
  }

  async findAll(
    options: FindManyOptions<BreedEntity> = {},
  ): Promise<BreedEntity[]> {
    return this.breedRepository.find(options);
  }

  async findOne(
    id: number,
    options: FindManyOptions<BreedEntity> = {},
  ): Promise<BreedEntity | null> {
    if (!id) throw new Error('ID must be provided');
    return this.breedRepository.findOne({
      ...options,
      where: { ...(options.where || {}), id },
    });
  }

  async update(
    id: number,
    updateBreedDto: UpdateBreedDto,
    userId: number,
  ): Promise<BreedEntity> {
    const breed = await this.findOne(id);
    if (!breed) {
      throw new Error('Breed not found');
    }
    const { name } = updateBreedDto;
    if (name && name !== breed.name) {
      const existingBreed = await this.breedRepository.findOneBy({
        name,
        speciesId: breed.speciesId,
      });
      if (existingBreed) {
        throw new BadRequestException('Breed with this name already exists');
      }
    }
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    let hasChanges = false;
    for (const key in updateBreedDto) {
      if (updateBreedDto[key] !== breed[key]) {
        hasChanges = true;
        break;
      }
    }
    if (!hasChanges) {
      return breed;
    }
    Object.assign(breed, updateBreedDto);
    const res = await this.breedRepository.save(breed);

    const admins = await this.userRepository.find({
      where: { systemRole: { name: SystemRoles.ADMIN } },
    });
    await Promise.all(
      admins.map(async (admin) => {
        const emailDto: SendEmailDto = {
          email: admin.email,
          userId: admin.id,
          subject: 'Raza actualizada',
          template: 'breed-updated',
          context: {
            adminName: admin.firstName + ' ' + admin.lastName,
            breedName: breed.name,
            breedId: breed.id,
            updatedBy: user.firstName + ' ' + user.lastName,
            userEmail: user.email,
            updatedAt: new Date(),
            year: new Date().getFullYear(),
          },
        };
        return this.smtpService.sendEmail(emailDto);
      }),
    );
    return res;
  }

  async remove(id: number, userId: number): Promise<void> {
    const breed = await this.findOne(id);
    if (!breed) {
      throw new NotFoundException('Breed not found');
    }
    console.log(`User with ID ${userId} has deleted breed with ID ${id}`);
    // TODO:
    // Validar si la raza está asociada a mascotas(animales) antes de eliminar
    // Enviar notificación a los administradores del sistema sobre la eliminación
    await this.breedRepository.remove(breed);
  }
}
