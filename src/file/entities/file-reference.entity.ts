import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FileEntity } from './file.entity';

@Entity('file_references')
export class FileReferenceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  fileId: number;

  @Column()
  tableName: string;

  @Column()
  columnName: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => FileEntity, (file) => file.fileReferences, {
    nullable: false,
  })
  @JoinColumn({ name: 'fileId' })
  file: FileEntity;
}
