import { AnimalEntity } from 'src/models/animal/entities/animal.entity';
import { BreedEntity } from 'src/models/breed/entities/breed.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('species')
export class SpeciesEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
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

  @OneToMany(() => BreedEntity, (breed) => breed.species)
  breeds: BreedEntity[];

  @OneToMany(() => AnimalEntity, (animal) => animal.species)
  animals: AnimalEntity[];
}
