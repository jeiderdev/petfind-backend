import { SystemRoles } from 'src/common/enums/system-role.enum';
import { UserEntity } from 'src/models/user/entities/user.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('system_roles')
export class SystemRoleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: SystemRoles, unique: true })
  name: SystemRoles;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // Relationships
  @OneToMany(() => UserEntity, (user) => user.systemRole)
  users: UserEntity[];
}
