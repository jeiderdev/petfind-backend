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
import { SpeciesService } from './species.service';
import { CreateSpeciesDto } from './dto/create-species.dto';
import { UpdateSpeciesDto } from './dto/update-species.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { getUserFronRequest } from 'src/auth/utils';
import { SystemRoles } from 'src/common/enums/system-role.enum';

@ApiTags('Species')
@ApiBearerAuth()
@Controller('species')
export class SpeciesController {
  constructor(private readonly speciesService: SpeciesService) {}

  @Auth({ roles: [SystemRoles.ADMIN, SystemRoles.VOLUNTEER] })
  @Post()
  create(@Body() createSpeciesDto: CreateSpeciesDto, @Req() req: Request) {
    const user = getUserFronRequest(req);
    if (!user) throw new BadRequestException('User not found in request');
    const userId = user.id;
    return this.speciesService.create(createSpeciesDto, userId);
  }

  @Get()
  findAll() {
    return this.speciesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.speciesService.findOne(+id);
  }

  @Auth({ roles: [SystemRoles.ADMIN, SystemRoles.VOLUNTEER] })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSpeciesDto: UpdateSpeciesDto,
    @Req() req: Request,
  ) {
    const user = getUserFronRequest(req);
    if (!user) throw new BadRequestException('User not found in request');
    const userId = user.id;
    return this.speciesService.update(+id, updateSpeciesDto, userId);
  }

  @Auth({ roles: [SystemRoles.ADMIN] })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.speciesService.remove(+id);
  }
}
