import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import sharp from 'sharp';

export const MAX_IMAGE_SIZE_PX = 1000;

@Injectable()
export class ImageOptimizationPipe implements PipeTransform {
  async transform(file: Express.Multer.File) {
    // Si no hay archivo → salir
    if (!file || !file.buffer) return file;

    try {
      // Obtenemos metadatos para saber tamaño original
      const metadata = await sharp(file.buffer).metadata();

      if (!metadata.width) {
        throw new BadRequestException('No se pudo leer la imagen.');
      }

      const shouldResize = metadata.width > MAX_IMAGE_SIZE_PX;

      // Construimos la instancia de sharp
      let processor = sharp(file.buffer);

      if (shouldResize) {
        processor = processor.resize(MAX_IMAGE_SIZE_PX);
      }

      // Convertimos a webp
      const optimizedImageBuffer = await processor
        .webp({ quality: 80 })
        .toBuffer();

      // Actualizamos los datos del archivo
      file.buffer = optimizedImageBuffer;
      file.mimetype = 'image/webp';
      file.originalname = file.originalname.replace(/\.[^/.]+$/, '') + '.webp';

      return file;
    } catch (e) {
      console.error('Sharp error:', e);
      throw new BadRequestException('La imagen enviada no es válida.');
    }
  }
}
