import { AnimalEntity } from 'src/models/animal/entities/animal.entity';
import { SpeciesEntity } from 'src/models/species/entities/species.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('breeds')
export class BreedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  speciesId: number;

  @Column({ nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  image: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => SpeciesEntity, (species) => species.breeds)
  @JoinColumn({ name: 'speciesId' })
  species: SpeciesEntity;

  @OneToMany(() => AnimalEntity, (animal) => animal.breed)
  @JoinColumn({ name: 'breedId' })
  animals: AnimalEntity[];
}
