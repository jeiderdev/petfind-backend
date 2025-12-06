import {
  AnimalGender,
  AnimalSize,
  AnimalStatus,
} from 'src/common/enums/animal.enum';
import { BreedEntity } from 'src/models/breed/entities/breed.entity';
import { ShelterEntity } from 'src/models/shelter/entities/shelter.entity';
import { SpeciesEntity } from 'src/models/species/entities/species.entity';
import { UserEntity } from 'src/models/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('animals')
export class AnimalEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  shelterId: number;

  @Column({ type: 'varchar', length: 20, default: AnimalStatus.PENDING })
  status: AnimalStatus;

  @Column()
  name: string;

  @Column({ nullable: false })
  speciesId: number;

  @Column({ nullable: true })
  breedId: number;

  @Column({ type: 'varchar', length: 15, default: AnimalGender.UNKNOWN })
  gender: AnimalGender;

  @Column({ type: 'date', nullable: true })
  birthDate: Date;

  estimatedAgeMonths?: number;

  @Column({ type: 'varchar', length: 15, default: AnimalSize.MEDIUM })
  size: AnimalSize;

  @Column({ nullable: true })
  color: string;

  @Column({ default: false })
  isSterilized: boolean;

  @Column({ default: false })
  isVaccinated: boolean;

  @Column({ default: false })
  hasMicrochip: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  healthNotes: string;

  // Adoption info
  @Column({ nullable: true })
  adoptedById: number;

  @Column({ type: 'date', nullable: true })
  adoptionDate: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  // Relationships

  @ManyToOne(() => ShelterEntity, (shelter) => shelter.animals)
  @JoinColumn({ name: 'shelterId' })
  shelter: ShelterEntity;

  @ManyToOne(() => SpeciesEntity, (species) => species.animals, {
    nullable: false,
  })
  @JoinColumn({ name: 'speciesId' })
  species: SpeciesEntity;

  @ManyToOne(() => BreedEntity, (breed) => breed.animals, { nullable: false })
  @JoinColumn({ name: 'breedId' })
  breed: BreedEntity;

  @ManyToOne(() => UserEntity, (user) => user.adoptedAnimals, {
    nullable: true,
  })
  @JoinColumn({ name: 'adoptedById' })
  adoptedBy: UserEntity;

  // adoptionRequests?: AdoptionRequest[];
}
