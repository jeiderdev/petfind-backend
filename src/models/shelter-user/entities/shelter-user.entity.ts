import { ShelterRole } from 'src/common/enums/shelter.enum';
import { ShelterEntity } from 'src/models/shelter/entities/shelter.entity';
import { UserEntity } from 'src/models/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('shelter_users')
export class ShelterUserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  shelterId: number;

  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 20 })
  role: ShelterRole;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  // Relationships

  @ManyToOne(() => ShelterEntity, (shelter) => shelter.members)
  @JoinColumn({ name: 'shelterId' })
  shelter: ShelterEntity;

  @ManyToOne(() => UserEntity, (user) => user.shelterMemberships)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;
}
