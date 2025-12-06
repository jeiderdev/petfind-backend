import { ShelterStatus } from 'src/common/enums/shelter.enum';
import { AnimalEntity } from 'src/models/animal/entities/animal.entity';
import { ShelterUserEntity } from 'src/models/shelter-user/entities/shelter-user.entity';
import { UserEntity } from 'src/models/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ShelterImageEntity } from './shelter-image.entity';

@Entity('shelters')
export class ShelterEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  image: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ type: 'varchar', length: 20, default: ShelterStatus.PENDING })
  status: ShelterStatus;

  @Column()
  createdById: number;

  @Column({ nullable: true })
  approvedById: number;

  @Column({ nullable: true })
  comments: string;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => UserEntity, (user) => user.sheltersCreated)
  @JoinColumn({ name: 'createdById' })
  createdBy: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.sheltersApproved)
  @JoinColumn({ name: 'approvedById' })
  approvedBy: UserEntity;

  @OneToMany(() => ShelterUserEntity, (shelterUser) => shelterUser.shelter)
  members: ShelterUserEntity[];

  @OneToMany(() => AnimalEntity, (animal) => animal.shelter)
  animals: AnimalEntity[];

  @OneToMany(() => ShelterImageEntity, (image) => image.shelter)
  images: ShelterImageEntity[];
}
