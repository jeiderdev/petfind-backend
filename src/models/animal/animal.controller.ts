import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Req,
  UnauthorizedException,
  Query,
} from '@nestjs/common';
import { AnimalService } from './animal.service';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { getUserFronRequest } from 'src/auth/utils';
import { CreateAnimalImageDto } from './dto/create-animal-image.dto';

@ApiTags('Animals')
@ApiBearerAuth()
@Controller('animal')
export class AnimalController {
  constructor(private readonly animalService: AnimalService) {}

  @Auth()
  @Post()
  create(@Body() createAnimalDto: CreateAnimalDto, @Req() req: Request) {
    const user = getUserFronRequest(req);
    if (!user) throw new UnauthorizedException();
    return this.animalService.create(createAnimalDto, user.id);
  }

  @Auth()
  @Get()
  findAll(@Query() query: Record<string, string>, @Req() req: Request) {
    const user = getUserFronRequest(req);
    if (!user) throw new UnauthorizedException();
    return this.animalService.findAllWithFilters(query, user.id);
  }

  @Auth()
  @Get('can-manage-adoptions/:shelterId')
  async canManageAdoptions(
    @Param('shelterId') shelterId: string,
    @Req() req: Request,
  ) {
    const user = getUserFronRequest(req);
    if (!user) throw new UnauthorizedException();
    const res = await this.animalService.hasPermissionToManageAdoptions(
      +shelterId,
      user.id,
    );
    return {
      hasPermission: res,
    };
  }

  @Auth()
  @Get('can-edit-animal/:shelterId')
  async canEditAnimal(
    @Param('shelterId') shelterId: string,
    @Req() req: Request,
  ) {
    const user = getUserFronRequest(req);
    if (!user) throw new UnauthorizedException();
    const res = await this.animalService.hasPermissionToManageAnimalsInfo(
      +shelterId,
      user.id,
    );
    return {
      hasPermission: res,
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.animalService.findOne(+id);
  }

  @Auth()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAnimalDto: UpdateAnimalDto,
    @Req() req: Request,
  ) {
    const user = getUserFronRequest(req);
    if (!user) throw new UnauthorizedException();
    return this.animalService.update(+id, updateAnimalDto, user.id);
  }

  @Auth()
  @Post(':id/image')
  addImage(
    @Param('id') id: string,
    @Body() dto: CreateAnimalImageDto,
    @Req() req: Request,
  ) {
    const user = getUserFronRequest(req);
    if (!user) throw new UnauthorizedException();
    return this.animalService.addImage(+id, dto.image, user.id);
  }

  @Auth()
  @Post(':id/publicate')
  publicate(@Param('id') id: string, @Req() req: Request) {
    const user = getUserFronRequest(req);
    if (!user) throw new UnauthorizedException();
    return this.animalService.publicate(+id, user.id);
  }
}
