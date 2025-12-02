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
} from '@nestjs/common';
import { ShelterService } from './shelter.service';
import { CreateShelterDto } from './dto/create-shelter.dto';
import { UpdateShelterDto } from './dto/update-shelter.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { getUserFronRequest } from 'src/auth/utils';
import { SystemRoles } from 'src/common/enums/system-role.enum';
import { RejectShelterDto } from './dto/reject-shelter.dto';

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

  @Get()
  findAll() {
    return this.shelterService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shelterService.findOne(+id);
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
  getAnimals(@Param('id') id: string) {
    return this.shelterService.findAll({
      where: { id: +id },
      relations: {
        animals: {
          species: true,
          breed: true,
        },
      },
    });
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
