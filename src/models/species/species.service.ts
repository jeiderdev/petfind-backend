import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSpeciesDto } from './dto/create-species.dto';
import { UpdateSpeciesDto } from './dto/update-species.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { SpeciesEntity } from './entities/species.entity';
import { FindManyOptions, Repository } from 'typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { SmtpService } from 'src/smtp/smtp.service';
import { SendEmailDto } from 'src/smtp/dtos/send-email.dto';
import { SystemRoles } from 'src/common/enums/system-role.enum';

@Injectable()
export class SpeciesService {
  constructor(
    @InjectRepository(SpeciesEntity)
    private readonly speciesRepository: Repository<SpeciesEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly smtpService: SmtpService,
  ) {}

  async create(
    createSpeciesDto: CreateSpeciesDto,
    userId: number,
  ): Promise<SpeciesEntity> {
    const { name, description } = createSpeciesDto;
    const existingSpecies = await this.speciesRepository.findOneBy({ name });
    if (existingSpecies) {
      throw new BadRequestException('Species with this name already exists');
    }
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const newSpecie = this.speciesRepository.create({
      ...createSpeciesDto,
    });
    const savedSpecie = await this.speciesRepository.save(newSpecie);
    const admins = await this.userRepository.find({
      where: { systemRole: { name: SystemRoles.ADMIN } },
    });
    await Promise.all(
      admins.map(async (admin) => {
        const emailDto: SendEmailDto = {
          email: admin.email,
          userId: admin.id,
          subject: 'Nueva especie creada',
          template: 'species-created',
          context: {
            adminName: admin.firstName + ' ' + admin.lastName,
            speciesName: savedSpecie.name,
            speciesDescription: description || 'No description provided',
            createdBy: user.firstName + ' ' + user.lastName,
            userEmail: user.email,
            createdAt: savedSpecie.createdAt,
            year: new Date().getFullYear(),
          },
        };
        return this.smtpService.sendEmail(emailDto);
      }),
    );
    return savedSpecie;
  }

  async findAll(
    options: FindManyOptions<SpeciesEntity> = {},
  ): Promise<SpeciesEntity[]> {
    return this.speciesRepository.find(options);
  }

  async findOne(
    id: number,
    options: FindManyOptions<SpeciesEntity> = {},
  ): Promise<SpeciesEntity | null> {
    if (!id) throw new BadRequestException('ID must be provided');
    return this.speciesRepository.findOne({
      ...options,
      where: { ...(options.where || {}), id },
    });
  }

  async update(
    id: number,
    updateSpeciesDto: UpdateSpeciesDto,
    userId: number,
  ): Promise<SpeciesEntity> {
    const species = await this.findOne(id);
    if (!species) {
      throw new Error('Species not found');
    }
    const { name } = updateSpeciesDto;
    if (name && name !== species.name) {
      const existingSpecies = await this.speciesRepository.findOneBy({ name });
      if (existingSpecies) {
        throw new BadRequestException('Species with this name already exists');
      }
    }
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    Object.assign(species, updateSpeciesDto);
    const res = this.speciesRepository.save(species);
    const admins = await this.userRepository.find({
      where: { systemRole: { name: SystemRoles.ADMIN } },
    });
    await Promise.all(
      admins.map(async (admin) => {
        const emailDto: SendEmailDto = {
          email: admin.email,
          userId: admin.id,
          subject: 'Especie actualizada',
          template: 'species-updated',
          context: {
            adminName: admin.firstName + ' ' + admin.lastName,
            speciesName: species.name,
            speciesId: species.id,
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

  async remove(id: number): Promise<void> {
    const species = await this.findOne(id);
    if (!species) {
      throw new NotFoundException('Species not found');
    }
    await this.speciesRepository.remove(species);
  }
}
