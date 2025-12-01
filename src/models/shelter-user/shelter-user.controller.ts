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
  BadRequestException,
} from '@nestjs/common';
import { ShelterUserService } from './shelter-user.service';
import { CreateShelterUserDto } from './dto/create-shelter-user.dto';
import { UpdateShelterUserDto } from './dto/update-shelter-user.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { getUserFronRequest } from 'src/auth/utils';
import { SystemRoles } from 'src/common/enums/system-role.enum';

@ApiTags('Shelter User')
@ApiBearerAuth()
@Controller('shelter-user')
export class ShelterUserController {
  constructor(private readonly shelterUserService: ShelterUserService) {}

  @Auth()
  @Post()
  create(
    @Body() createShelterUserDto: CreateShelterUserDto,
    @Req() req: Request,
  ) {
    const user = getUserFronRequest(req);
    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }
    return this.shelterUserService.create(createShelterUserDto, user.id);
  }

  @Auth({ roles: [SystemRoles.ADMIN] })
  @Get()
  findAll() {
    return this.shelterUserService.findAll();
  }

  @Auth()
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const user = getUserFronRequest(req);
    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }
    const hasPermission =
      await this.shelterUserService.hasPermissionToManageMembers(+id, user.id);
    if (!hasPermission) {
      throw new BadRequestException(
        'Only shelter admins or system admins can view shelter users',
      );
    }
    return this.shelterUserService.findOne(+id);
  }

  @Auth()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateShelterUserDto: UpdateShelterUserDto,
    @Req() req: Request,
  ) {
    const user = getUserFronRequest(req);
    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }
    return this.shelterUserService.update(+id, updateShelterUserDto, user.id);
  }

  @Auth()
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = getUserFronRequest(req);
    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }
    return this.shelterUserService.remove(+id, user.id);
  }
}
