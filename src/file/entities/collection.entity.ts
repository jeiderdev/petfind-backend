import { UserEntity } from 'src/models/user/entities/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FileEntity } from './file.entity';

export const DEFAULT_COLLECTION_NAME = 'Mi colección publica';

@Entity('collections')
export class CollectionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'tinyint', default: 1 })
  isPublic: number;

  @Column({ nullable: false })
  userId: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => UserEntity, (user) => user.collections, { nullable: false })
  user: UserEntity;

  @OneToMany(() => FileEntity, (file) => file.collection)
  files: FileEntity[];
}
