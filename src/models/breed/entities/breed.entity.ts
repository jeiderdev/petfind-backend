import { SpeciesEntity } from 'src/models/species/entities/species.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

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
  imageUrl: string;

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
  species: SpeciesEntity;

  // animals?: Animal[];
}
