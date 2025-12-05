import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  Req,
  UnauthorizedException,
  UploadedFile,
  Get,
  Param,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { FileService } from './file.service';
import { CreateFileDto } from './dto/create-file.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CustomImageInterceptor } from './utils/custom-image.interceptor';
import { ImageOptimizationPipe } from './utils/custom-image.pipe';
import { getUserFronRequest } from 'src/auth/utils';
import { type Response } from 'express';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Auth()
  @Post()
  @UseInterceptors(CustomImageInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiExtraModels(CreateFileDto)
  @ApiBody({
    schema: {
      allOf: [
        { $ref: getSchemaPath(CreateFileDto) },
        {
          type: 'object',
          properties: {
            file: { type: 'string', format: 'binary' },
          },
        },
      ],
    },
  })
  create(
    @Body() createFileDto: CreateFileDto,
    @UploadedFile(new ImageOptimizationPipe()) image: Express.Multer.File,
    @Req() req: Request,
  ) {
    const user = getUserFronRequest(req);
    if (!user) throw new UnauthorizedException();
    return this.fileService.create(createFileDto, image, user.id);
  }

  @Get('get/:name')
  async getFile(@Param('name') name: string, @Res() res: Response) {
    const file = await this.fileService.findOneByName(name);
    if (!file) {
      throw new NotFoundException('Archivo no encontrado');
    }
    const stream = await this.fileService.getRawReadStream(file);
    const encodedName = encodeURIComponent(file.originalname);
    res.setHeader('Content-Type', file.mimetype);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.originalname}"; filename*=UTF-8''${encodedName}`,
    );
    res.send(Buffer.from(stream));
  }
}
