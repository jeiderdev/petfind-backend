import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ShelterEntity } from './shelter.entity';

@Entity('shelter_images')
export class ShelterImageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  shelterId: number;

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
  @ManyToOne(() => ShelterEntity, (shelter) => shelter.images, {
    cascade: true,
  })
  @JoinColumn({ name: 'shelterId' })
  shelter: ShelterEntity;
}
