import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UnauthorizedException,
  Query,
} from '@nestjs/common';
import { ShelterService } from './shelter.service';
import { CreateShelterDto } from './dto/create-shelter.dto';
import { UpdateShelterDto } from './dto/update-shelter.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { getUserFronRequest } from 'src/auth/utils';
import { SystemRoles } from 'src/common/enums/system-role.enum';
import { RejectShelterDto } from './dto/reject-shelter.dto';
import { CretaeShelterImageDto } from './dto/create-shelter-image.dto';
import { FindManyOptions } from 'typeorm';
import { ShelterEntity } from './entities/shelter.entity';
import { ShelterStatus } from 'src/common/enums/shelter.enum';

@ApiTags('Shelters')
@ApiBearerAuth()
@Controller('shelter')
export class ShelterController {
  constructor(private readonly shelterService: ShelterService) {}

  @Auth()
  @Post()
  create(@Body() createShelterDto: CreateShelterDto, @Req() req: Request) {
    const user = getUserFronRequest(req);
    if (!user) throw new UnauthorizedException();
    return this.shelterService.create(createShelterDto, user.id);
  }

  @Auth()
  @Get()
  findAll(@Req() req: Request) {
    const user = getUserFronRequest(req);
    if (!user) throw new UnauthorizedException();
    const options: FindManyOptions<ShelterEntity> = {};
    if (user.role !== String(SystemRoles.ADMIN)) {
      options.where = [
        { status: ShelterStatus.APPROVED },
        { createdById: user.id },
      ];
    }
    return this.shelterService.findAll(options);
  }

  @Auth()
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const user = getUserFronRequest(req);
    if (!user) throw new UnauthorizedException();
    return this.shelterService.findOne(
      +id,
      {
        relations: {
          images: true,
        },
      },
      user.id,
    );
  }

  @Auth()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateShelterDto: UpdateShelterDto,
    @Req() req: Request,
  ) {
    const user = getUserFronRequest(req);
    if (!user) throw new UnauthorizedException();
    return this.shelterService.update(+id, updateShelterDto, user.id);
  }

  @Get(':id/with-animals')
  getAnimals(@Param('id') id: string, @Query() query: Record<string, string>) {
    return this.shelterService.findOneWithAnimals(+id, query);
  }

  @Auth({ roles: [SystemRoles.ADMIN] })
  @Post(':id/approve')
  approve(@Param('id') id: string, @Req() req: Request) {
    const user = getUserFronRequest(req);
    if (!user) throw new UnauthorizedException();
    return this.shelterService.approve(+id, user.id);
  }

  @Auth({ roles: [SystemRoles.ADMIN] })
  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() rejectShelterDto: RejectShelterDto,
    @Req() req: Request,
  ) {
    const user = getUserFronRequest(req);
    if (!user) throw new UnauthorizedException();
    return this.shelterService.reject(+id, rejectShelterDto, user.id);
  }

  @Auth()
  @Post(':id/image')
  addImage(
    @Param('id') id: string,
    @Body() dto: CretaeShelterImageDto,
    @Req() req: Request,
  ) {
    const user = getUserFronRequest(req);
    if (!user) throw new UnauthorizedException();
    return this.shelterService.addImage(+id, dto.image, user.id);
  }

  @Auth()
  @Get(':id/with-members')
  getMembers(@Param('id') id: string, @Req() req: Request) {
    const user = getUserFronRequest(req);
    if (!user) throw new UnauthorizedException();
    return this.shelterService.getShelterMembers(+id, user.id);
  }

  @Auth({ roles: [SystemRoles.ADMIN] })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shelterService.remove(+id);
  }
}
