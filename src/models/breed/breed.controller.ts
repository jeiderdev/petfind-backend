import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { BreedService } from './breed.service';
import { CreateBreedDto } from './dto/create-breed.dto';
import { UpdateBreedDto } from './dto/update-breed.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { SystemRoles } from 'src/common/enums/system-role.enum';
import { getUserFronRequest } from 'src/auth/utils';

@ApiTags('Breed')
@ApiBearerAuth()
@Controller('breed')
export class BreedController {
  constructor(private readonly breedService: BreedService) {}

  @Auth({ roles: [SystemRoles.ADMIN, SystemRoles.VOLUNTEER] })
  @Post()
  create(@Body() createBreedDto: CreateBreedDto, @Req() req: Request) {
    const user = getUserFronRequest(req);
    if (!user) throw new BadRequestException('User not found in request');
    return this.breedService.create(createBreedDto, user.id);
  }

  @Get()
  findAll() {
    return this.breedService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.breedService.findOne(+id);
  }

  @Auth({ roles: [SystemRoles.ADMIN, SystemRoles.VOLUNTEER] })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBreedDto: UpdateBreedDto,
    @Req() req: Request,
  ) {
    const user = getUserFronRequest(req);
    if (!user) throw new BadRequestException('User not found in request');
    return this.breedService.update(+id, updateBreedDto, user.id);
  }

  @Auth({ roles: [SystemRoles.ADMIN] })
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = getUserFronRequest(req);
    if (!user) throw new BadRequestException('User not found in request');
    return this.breedService.remove(+id, user.id);
  }
}
