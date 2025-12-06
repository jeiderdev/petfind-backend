import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AnimalEntity } from './animal.entity';

@Entity('animal_images')
export class AnimalImageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  animalId: number;

  @Column({ nullable: false })
  image: string;

  @Column({ nullable: false })
  uploadedById: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  // Relationships

  @ManyToOne(() => AnimalEntity, (animal) => animal.images)
  @JoinColumn({ name: 'animalId' })
  animal: AnimalEntity;
}
