import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateFileDto } from './dto/create-file.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { FileEntity } from './entities/file.entity';
import { FindManyOptions, Repository } from 'typeorm';
import {
  CollectionEntity,
  DEFAULT_COLLECTION_NAME,
} from './entities/collection.entity';
import { FileReferenceEntity } from './entities/file-reference.entity';
import { FileAccess } from 'src/common/enums/file.enum';
import { extname } from 'path';
import * as fs from 'fs';
import { createFileReferenceDto } from './dto/create-file-reference.dto';

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    @InjectRepository(CollectionEntity)
    private readonly collectionRepository: Repository<CollectionEntity>,
    @InjectRepository(FileReferenceEntity)
    private readonly fileReferenceRepository: Repository<FileReferenceEntity>,
  ) {}

  async sanitizeFileName(originalName: string): Promise<string> {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');

    const cleaned = nameWithoutExt
      .replace(/[\r\n]/g, '')
      .replace(/"/g, "'")
      .normalize('NFD')
      .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ _-]/g, '')
      .replace(/\s+/g, '_')
      .trim();

    return Promise.resolve(cleaned);
  }

  async getUserCollection(
    userId: number,
    collectionId: number | undefined,
  ): Promise<CollectionEntity> {
    if (collectionId) {
      const collection = await this.collectionRepository.findOne({
        where: { id: collectionId, userId },
      });
      if (collection) {
        return collection;
      } else {
        throw new BadRequestException('La colección no existe.');
      }
    }
    let defaultCollection = await this.collectionRepository.findOne({
      where: { name: DEFAULT_COLLECTION_NAME, userId },
    });
    if (defaultCollection) {
      return defaultCollection;
    }
    defaultCollection = this.collectionRepository.create({
      name: DEFAULT_COLLECTION_NAME,
      description: 'Colección predeterminada de imágenes',
      isPublic: FileAccess.PUBLIC,
      userId,
    });
    return this.collectionRepository.save(defaultCollection);
  }

  async create(
    createFileDto: CreateFileDto,
    file: Express.Multer.File,
    userId: number,
  ): Promise<Partial<FileEntity>> {
    const { isPublic, collectionId } = createFileDto;
    const collection = await this.getUserCollection(userId, collectionId);
    const cleaned = await this.sanitizeFileName(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = extname(file.originalname);
    const finalName = `${uniqueSuffix}${extension}`;
    const dir = `.uploads/temp/${userId}/${collection.id}`;
    fs.mkdirSync(dir, { recursive: true });
    const finalPath = `${dir}/${finalName}`;
    fs.writeFileSync(finalPath, file.buffer);
    const newFile = this.fileRepository.create({
      filename: finalName,
      isPublic: isPublic || FileAccess.PUBLIC,
      mimetype: file.mimetype,
      originalname: cleaned + extension,
      path: finalPath,
      userId,
      collectionId: collection.id,
    });
    const savedFile = await this.fileRepository.save(newFile);
    return {
      id: savedFile.id,
      filename: savedFile.filename,
      originalname: savedFile.originalname,
      mimetype: savedFile.mimetype,
    };
  }

  async findOneById(id: number, options: FindManyOptions<FileEntity> = {}) {
    return this.fileRepository.findOne({
      ...options,
      where: { ...(options.where || {}), id },
    });
  }

  async findOneByName(
    filename: string,
    options: FindManyOptions<FileEntity> = {},
  ) {
    return this.fileRepository.findOne({
      ...options,
      where: { ...(options.where || {}), filename },
    });
  }

  async createFileReference(
    dto: createFileReferenceDto,
  ): Promise<FileReferenceEntity> {
    const file = await this.fileRepository.findOne({
      where: { id: dto.fileId },
    });
    if (!file) {
      throw new BadRequestException('El archivo especificado no existe.');
    }
    const fileReference = this.fileReferenceRepository.create({
      fileId: dto.fileId,
      tableName: dto.tableName,
      columnName: dto.columnName,
    });
    return this.fileReferenceRepository.save(fileReference);
  }

  async validatePath(path: string): Promise<void> {
    if (!fs.existsSync(path)) {
      throw new NotFoundException(`Archivo no encontrado.`);
    }
    await Promise.resolve();
  }

  async getRawReadStream(file: FileEntity): Promise<Buffer> {
    await this.validatePath(file.path);
    return new Promise((resolve, reject) => {
      const chunks: any[] = [];
      const readStream = fs.createReadStream(file.path);

      readStream.on('data', (chunk) => {
        chunks.push(chunk);
      });

      readStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      readStream.on('error', (error) => {
        console.error('Error reading file stream:', error);
        reject(
          new NotFoundException(`Archivo '${file.filename}' no encontrado.`),
        );
      });
    });
  }
}
