import { AnimalEntity } from 'src/models/animal/entities/animal.entity';
import { ShelterEntity } from 'src/models/shelter/entities/shelter.entity';
import { UserEntity } from 'src/models/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum AdoptionRequestStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

@Entity('adoption_requests')
export class AdoptionRequestEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  animalId: number;

  @Column()
  requesterId: number;

  @Column()
  shelterId: number;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    default: AdoptionRequestStatus.PENDING,
  })
  status: AdoptionRequestStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  sentAt: Date;

  @Column({ type: 'int', nullable: true })
  reviewedById?: number;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt?: Date;

  @Column({ type: 'text', nullable: true })
  reviewNotes?: string;

  // Relationships

  @ManyToOne(() => AnimalEntity, (animal) => animal.adoptionRequests)
  @JoinColumn({ name: 'animalId' })
  animal: AnimalEntity;

  @ManyToOne(() => UserEntity, (user) => user.adoptionRequests)
  @JoinColumn({ name: 'requesterId' })
  requester: UserEntity;

  @ManyToOne(() => ShelterEntity, (shelter) => shelter.adoptionRequests)
  @JoinColumn({ name: 'shelterId' })
  shelter: ShelterEntity;

  @ManyToOne(() => UserEntity, (user) => user.reviewers)
  @JoinColumn({ name: 'reviewedById' })
  reviewedBy: UserEntity;
}
