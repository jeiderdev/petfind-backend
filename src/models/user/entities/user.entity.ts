import { SystemRoleEntity } from 'src/models/system-role/entities/system-role.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

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

  // shelterMemberships?: ShelterUser[];
  // sheltersCreated?: Shelter[];
  // notifications?: Notification[];
  // adoptionRequests?: AdoptionRequest[];
  // adoptedAnimals?: Animal[];
  // animalsPublished?: Animal[];
}
