import { FileStsatus, FileType } from 'src/common/enums/file.enum';
import { UserEntity } from 'src/models/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CollectionEntity } from './collection.entity';
import { FileReferenceEntity } from './file-reference.entity';

@Entity('files')
export class FileEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false, unique: true })
  filename: string;

  @Column({ nullable: true })
  originalname: string;

  @Column({ nullable: true })
  mimetype: string;

  @Column({ type: 'tinyint', nullable: true, default: FileType.GENERAL })
  type: FileType;

  @Column({ type: 'text', nullable: true })
  path: string;

  @Column({ type: 'tinyint', default: FileStsatus.TEMPORAL })
  status: FileStsatus;

  @Column({ type: 'tinyint', default: 1 })
  isPublic: number;

  @Column({ nullable: false })
  userId: number;

  @Column({ nullable: false })
  collectionId: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => UserEntity, (user) => user.files, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ManyToOne(() => CollectionEntity, (collection) => collection.files, {
    nullable: true,
  })
  @JoinColumn({ name: 'collectionId' })
  collection: CollectionEntity;

  @OneToMany(() => FileReferenceEntity, (fr) => fr.file)
  fileReferences: FileReferenceEntity[];
}
