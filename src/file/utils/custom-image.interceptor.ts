import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Type,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { mixin } from '@nestjs/common';

export function CustomImageInterceptor(
  uploadField: string,
): Type<NestInterceptor> {
  @Injectable()
  class ImageUploadInterceptor implements NestInterceptor {
    private readonly multer = FileInterceptor(uploadField, {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_, file, callback) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/jpg',
        ];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              'Solo se permiten imágenes jpeg, jpg, png o webp.',
            ),
            false,
          );
        }
        callback(null, true);
      },
    });

    async intercept(ctx: ExecutionContext, next: CallHandler) {
      const instance = new (this.multer as any)();
      return instance.intercept(ctx, next);
    }
  }

  return mixin(ImageUploadInterceptor);
}
