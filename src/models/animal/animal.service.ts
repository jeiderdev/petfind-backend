import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AnimalEntity } from './entities/animal.entity';
import { FindManyOptions, FindOptionsWhere, In, Repository } from 'typeorm';
import { ShelterUserEntity } from '../shelter-user/entities/shelter-user.entity';
import { SmtpService } from 'src/smtp/smtp.service';
import { ShelterRole } from 'src/common/enums/shelter.enum';
import { SendEmailDto } from 'src/smtp/dtos/send-email.dto';
import { ShelterEntity } from '../shelter/entities/shelter.entity';
import { SpeciesEntity } from '../species/entities/species.entity';
import { BreedEntity } from '../breed/entities/breed.entity';
import {
  AnimalGender,
  AnimalSize,
  AnimalStatus,
} from 'src/common/enums/animal.enum';
import { AnimalImageEntity } from './entities/animal-image.entity';
import { SystemRoles } from 'src/common/enums/system-role.enum';

@Injectable()
export class AnimalService {
  private supportEmail: string;

  constructor(
    @InjectRepository(AnimalEntity)
    private readonly animalRepository: Repository<AnimalEntity>,
    @InjectRepository(AnimalImageEntity)
    private readonly animalImageRepository: Repository<AnimalImageEntity>,
    @InjectRepository(ShelterEntity)
    private readonly shelterRepository: Repository<ShelterEntity>,
    @InjectRepository(ShelterUserEntity)
    private readonly shelterUserRepository: Repository<ShelterUserEntity>,
    @InjectRepository(SpeciesEntity)
    private readonly speciesRepository: Repository<SpeciesEntity>,
    @InjectRepository(BreedEntity)
    private readonly breedRepository: Repository<BreedEntity>,
    private readonly smtpService: SmtpService,
  ) {
    const auxSupportEmail = process.env.SUPPORT_EMAIL;
    if (!auxSupportEmail) {
      throw new Error('SUPPORT_EMAIL is not defined in environment variables');
    }
    this.supportEmail = auxSupportEmail;
  }

  async hasPermissionToManageAnimalsInfo(
    shelterId: number,
    userId: number,
  ): Promise<boolean> {
    if (!userId || !shelterId) return false;
    const shelterUser = await this.shelterUserRepository.findOne({
      where: { shelterId, userId },
      relations: { user: { systemRole: true } },
    });
    if (!shelterUser) return false;
    const systemRole = shelterUser.user.systemRole;
    if (systemRole && systemRole.name === SystemRoles.ADMIN) {
      return true;
    }
    const role = shelterUser.role;
    return (
      role === ShelterRole.OWNER ||
      role === ShelterRole.DIRECTIVE ||
      role === ShelterRole.MEMBER
    );
  }

  async hasPermissionToManageAdoptions(
    shelterId: number,
    userId: number,
  ): Promise<boolean> {
    if (!userId || !shelterId) return false;
    const shelterUser = await this.shelterUserRepository.findOne({
      where: { shelterId, userId },
      relations: { user: { systemRole: true } },
    });
    if (!shelterUser) return false;
    const systemRole = shelterUser.user.systemRole;
    if (systemRole && systemRole.name === SystemRoles.ADMIN) {
      return true;
    }
    const role = shelterUser.role;
    return role === ShelterRole.OWNER || role === ShelterRole.DIRECTIVE;
  }

  async getShelterDirectives(shelterId: number) {
    return this.shelterUserRepository.find({
      where: { shelterId, role: ShelterRole.DIRECTIVE },
      relations: { user: true },
    });
  }

  async create(
    createAnimalDto: CreateAnimalDto,
    userId: number,
  ): Promise<AnimalEntity> {
    const { shelterId, speciesId, breedId } = createAnimalDto;
    const shelter = await this.shelterRepository.findOne({
      where: { id: shelterId },
    });
    if (!shelter) {
      throw new NotFoundException('Shelter not found');
    }
    const species = await this.speciesRepository.findOne({
      where: { id: speciesId },
    });
    if (!species) {
      throw new NotFoundException('Species not found');
    }
    const breed = await this.breedRepository.findOne({
      where: { id: breedId, speciesId: speciesId },
    });
    if (!breed) {
      throw new NotFoundException('Breed not found for the given species');
    }
    const userInfo = await this.shelterUserRepository.findOne({
      where: { userId, shelterId },
      relations: { user: true },
    });
    if (!userInfo) {
      throw new NotFoundException(
        'User is not associated with the specified shelter',
      );
    }
    const hasPermission = await this.hasPermissionToManageAnimalsInfo(
      shelterId,
      userId,
    );
    if (!hasPermission) {
      throw new UnauthorizedException(
        'Only shelter members, directive, or owners can register animals',
      );
    }
    const animal = this.animalRepository.create({
      ...createAnimalDto,
      status: AnimalStatus.NOT_AVAILABLE,
    });
    const res = await this.animalRepository.save(animal);
    // Notify shelter admins about the new animal registration
    const directives = await this.getShelterDirectives(shelterId);
    const usr = userInfo.user;
    await Promise.all(
      directives.map((d) => {
        const user = d.user;
        const emailDto: SendEmailDto = {
          email: user.email,
          userId: user.id,
          subject: 'Nuevo animal registrada en el refugio',
          template: 'animal-created',
          context: {
            directorName: user.firstName + ' ' + user.lastName,
            shelterName: shelter.name,
            animalName: animal.name,
            speciesName: species.name,
            breedName: breed.name,
            createdByName: usr.firstName + ' ' + usr.lastName,
            createdByEmail: usr.email,
            createdAt: new Date(),
            supportEmail: this.supportEmail,
            year: new Date().getFullYear(),
          },
        };
        return this.smtpService.sendEmail(emailDto);
      }),
    );
    return res;
  }

  async addImage(
    animalId: number,
    image: string,
    userId: number,
  ): Promise<AnimalImageEntity> {
    const animal = await this.findOne(animalId);
    if (!animal) {
      throw new NotFoundException('Animal not found');
    }
    const hasPermission = await this.hasPermissionToManageAnimalsInfo(
      animal.shelterId,
      userId,
    );
    if (!hasPermission) {
      throw new UnauthorizedException(
        'Only shelter members, directive, or owners can add images to animals',
      );
    }
    const animalImage = this.animalImageRepository.create({
      animalId,
      image,
      uploadedById: userId,
    });
    return this.animalImageRepository.save(animalImage);
  }

  async menberOfShelters(userId?: number): Promise<number[]> {
    if (!userId) return [-1];
    const shelterUsers = await this.shelterUserRepository.find({
      where: { userId },
    });
    const res = shelterUsers.map((su) => su.shelterId);
    if (res.length === 0) return [-1];
    return res;
  }

  async findAll(
    options: FindManyOptions<AnimalEntity> = {},
    userId?: number,
  ): Promise<AnimalEntity[]> {
    const meberOf = await this.menberOfShelters(userId);
    options.where = [
      { status: In([AnimalStatus.AVAILABLE]) },
      { shelterId: In(meberOf) },
    ];
    options.relations = {
      ...(options.relations || {}),
      shelter: true,
      species: true,
      breed: true,
    };
    options.order = {
      ...(options.order || {}),
      createdAt: 'DESC',
    };
    return this.animalRepository.find(options);
  }

  async findAllWithFilters(
    query: Record<string, string> = {},
    userId?: number,
  ): Promise<AnimalEntity[]> {
    if (!query) {
      query = {};
    }
    const {
      shelterId,
      speciesId,
      breedId,
      gender,
      size,
      color,
      city,
      isSterilized,
      isVaccinated,
      hasMicrochip,
      status,
    } = query;

    const where: FindOptionsWhere<AnimalEntity> = {};

    if (shelterId) where.shelterId = +shelterId;
    if (speciesId) where.speciesId = +speciesId;
    if (breedId) where.breedId = +breedId;
    if (gender) {
      if (Object.values(AnimalGender).includes(gender as any)) {
        where.gender = gender as AnimalGender;
      }
    }
    if (size) {
      if (Object.values(AnimalSize).includes(size as any)) {
        where.size = size as AnimalSize;
      }
    }
    if (color) where.color = color;
    if (status) {
      if (Object.values(AnimalStatus).includes(status as any)) {
        where.status = status as AnimalStatus;
      }
    }

    // booleanos deben convertirse desde string
    if (isSterilized !== undefined)
      where.isSterilized = isSterilized === 'true';
    if (isVaccinated !== undefined)
      where.isVaccinated = isVaccinated === 'true';
    if (hasMicrochip !== undefined)
      where.hasMicrochip = hasMicrochip === 'true';

    // where.status = In([AnimalStatus.AVAILABLE]);
    const where2: FindOptionsWhere<AnimalEntity> = JSON.parse(
      JSON.stringify(where),
    ) as FindOptionsWhere<AnimalEntity>;
    where2.status = AnimalStatus.AVAILABLE;

    if (!shelterId) {
      const meberOf = await this.menberOfShelters(userId);
      where.shelterId = In(meberOf);
    }

    const queryBuilder = this.animalRepository
      .createQueryBuilder('animal')
      .leftJoinAndSelect('animal.shelter', 'shelter')
      .leftJoinAndSelect('animal.species', 'species')
      .leftJoinAndSelect('animal.breed', 'breed')
      .leftJoinAndSelect('animal.images', 'images')
      .where(shelterId ? where : [where, where2]);

    if (city) {
      queryBuilder.andWhere('shelter.city ILIKE :city', { city });
    }
    queryBuilder.orderBy('animal.createdAt', 'DESC');

    return queryBuilder.getMany();
  }

  async findOne(
    id: number,
    options: FindManyOptions<AnimalEntity> = {},
  ): Promise<AnimalEntity | null> {
    if (!id) {
      throw new BadRequestException('Animal ID must be provided');
    }
    return this.animalRepository.findOne({
      ...options,
      where: { ...(options.where || {}), id },
      relations: {
        ...(options.relations || {}),
        shelter: true,
        species: true,
        breed: true,
        images: true,
        adoptionRequests: {
          requester: true,
        },
      },
    });
  }

  async update(
    id: number,
    updateAnimalDto: UpdateAnimalDto,
    userId: number,
  ): Promise<AnimalEntity> {
    const animal = await this.findOne(id);
    if (!animal) {
      throw new NotFoundException('Animal not found');
    }
    const hasPermission = await this.hasPermissionToManageAnimalsInfo(
      animal.shelterId,
      userId,
    );
    if (!hasPermission) {
      throw new UnauthorizedException(
        'Only shelter members, directive, or owners can update animals',
      );
    }
    const userInfo = await this.shelterUserRepository.findOne({
      where: { userId, shelterId: animal.shelterId },
      relations: { user: true },
    });
    if (!userInfo) {
      throw new NotFoundException(
        'User is not associated with the specified shelter',
      );
    }
    let hasChanges = false;
    for (const key in updateAnimalDto) {
      if (updateAnimalDto[key] !== animal[key]) {
        hasChanges = true;
        break;
      }
    }
    if (!hasChanges) {
      return animal;
    }
    Object.assign(animal, updateAnimalDto);
    const res = this.animalRepository.save(animal);
    const species = await this.speciesRepository.findOne({
      where: { id: animal.speciesId },
    });
    const breed = await this.breedRepository.findOne({
      where: { id: animal.breedId },
    });

    const directives = await this.getShelterDirectives(animal.shelterId);
    const usr = userInfo.user;
    await Promise.all(
      directives.map((d) => {
        const user = d.user;
        const emailDto: SendEmailDto = {
          email: user.email,
          userId: user.id,
          subject: 'Información del animal actualizada',
          template: 'animal-updated',
          context: {
            directorName: user.firstName + ' ' + user.lastName,
            shelterName: userInfo.shelter.name,
            animalName: animal.name,
            speciesName: species ? species.name : 'N/A',
            breedName: breed ? breed.name : 'N/A',
            updatedByName: usr.firstName + ' ' + usr.lastName,
            updatedByEmail: usr.email,
            updatedAt: new Date(),
            supportEmail: this.supportEmail,
            year: new Date().getFullYear(),
          },
        };
        return this.smtpService.sendEmail(emailDto);
      }),
    );
    return res;
  }

  async publicate(id: number, userId: number): Promise<AnimalEntity> {
    const animal = await this.findOne(id);
    if (!animal) {
      throw new NotFoundException('Animal not found');
    }
    const hasPermission = await this.hasPermissionToManageAdoptions(
      animal.shelterId,
      userId,
    );
    if (!hasPermission) {
      throw new UnauthorizedException(
        'Only shelter directive or owners can publicate animals',
      );
    }
    const species = await this.speciesRepository.findOne({
      where: { id: animal.speciesId },
    });
    const breed = await this.breedRepository.findOne({
      where: { id: animal.breedId },
    });
    animal.status = AnimalStatus.AVAILABLE;
    const res = await this.animalRepository.save(animal);
    const userInfo = await this.shelterUserRepository.findOne({
      where: { userId, shelterId: animal.shelterId },
      relations: { user: true },
    });
    const directives = await this.getShelterDirectives(animal.shelterId);
    const usr = userInfo?.user;
    await Promise.all(
      directives.map((d) => {
        const user = d.user;
        const emailDto: SendEmailDto = {
          email: user.email,
          userId: user.id,
          subject: 'Animal publicado para adopción',
          template: 'animal-publicated',
          context: {
            directorName: user.firstName + ' ' + user.lastName,
            shelterName: userInfo ? userInfo.shelter.name : 'N/A',
            animalName: animal.name,
            speciesName: species ? species.name : 'N/A',
            breedName: breed ? breed.name : 'N/A',
            publishedByName: usr ? usr.firstName + ' ' + usr.lastName : 'N/A',
            publishedByEmail: usr ? usr.email : 'N/A',
            publishedAt: new Date(),
            supportEmail: this.supportEmail,
            year: new Date().getFullYear(),
          },
        };
        return this.smtpService.sendEmail(emailDto);
      }),
    );
    return res;
  }

  async setAdoptedByUser(
    animalId: number,
    userId: number,
  ): Promise<AnimalEntity> {
    const animal = await this.findOne(animalId);
    if (!animal) {
      throw new NotFoundException('Animal not found');
    }
    animal.status = AnimalStatus.ADOPTED;
    animal.adoptedById = userId;
    animal.adoptionDate = new Date();
    return this.animalRepository.save(animal);
  }
}
