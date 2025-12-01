import { UserEntity } from 'src/models/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('emails')
export class EmailEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  userId?: number;

  @Column()
  email: string;

  @Column()
  subject: string;

  @Column({ nullable: true })
  message?: string;

  @Column({ nullable: true })
  template?: string;

  @Column({ type: 'json', nullable: true })
  context?: Record<string, unknown>;

  @Column({ type: 'tinyint', default: 0 })
  sent: number; // Si se ha enviado el correo. 0 = false, 1 = true

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => UserEntity, (user) => user.emails, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;
}
