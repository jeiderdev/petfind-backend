import { OtpCodeEntity } from 'src/auth/entities/otp-code.entity';
import { ShelterUserEntity } from 'src/models/shelter-user/entities/shelter-user.entity';
import { ShelterEntity } from 'src/models/shelter/entities/shelter.entity';
import { SystemRoleEntity } from 'src/models/system-role/entities/system-role.entity';
import { EmailEntity } from 'src/smtp/entities/email.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  systemRoleId: number;

  @Column()
  firstName: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column()
  documentId: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone?: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => SystemRoleEntity, (systemRole) => systemRole.users)
  systemRole: SystemRoleEntity;

  @OneToMany(() => OtpCodeEntity, (otpCode) => otpCode.user)
  otpCodes: OtpCodeEntity[];

  @OneToMany(() => EmailEntity, (email) => email.user)
  emails: EmailEntity[];

  @OneToMany(() => ShelterEntity, (shelter) => shelter.createdBy)
  sheltersCreated: ShelterEntity[];

  @OneToMany(() => ShelterEntity, (shelter) => shelter.approvedBy)
  sheltersApproved: ShelterEntity[];

  @OneToMany(() => ShelterUserEntity, (shelterUser) => shelterUser.user)
  shelterMemberships?: ShelterUserEntity[];
  // notifications?: Notification[];
  // adoptionRequests?: AdoptionRequest[];
  // adoptedAnimals?: Animal[];
  // animalsPublished?: Animal[];
}
