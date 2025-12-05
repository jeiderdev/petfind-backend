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
import { AnimalService } from './animal.service';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { getUserFronRequest } from 'src/auth/utils';

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

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.animalService.findAllWithFilters(query);
  }

  @Get('of-shelter/:shelterId')
  findOneOfShelter(@Param('shelterId') shelterId: string) {
    return this.animalService.findAll({
      where: { shelterId: +shelterId },
    });
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
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = getUserFronRequest(req);
    if (!user) throw new UnauthorizedException();
    return this.animalService.remove(+id, user.id);
  }
}
