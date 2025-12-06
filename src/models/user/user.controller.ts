import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { SystemRoles } from 'src/common/enums/system-role.enum';
import { getUserFronRequest } from 'src/auth/utils';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Auth({ roles: [SystemRoles.ADMIN] })
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Auth()
  @Get('me')
  findMe(@Req() req: Request) {
    const user = getUserFronRequest(req);
    if (!user) throw new BadRequestException('User not found in request');
    return this.userService.findOne(user.id, {
      relations: {
        systemRole: true,
        sheltersCreated: true,
        sheltersApproved: true,
        adoptedAnimals: true,
      },
    });
  }

  @Auth({ roles: [SystemRoles.ADMIN] })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Auth()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request,
  ) {
    const user = getUserFronRequest(req);
    if (!user) throw new BadRequestException('User not found in request');
    if (user.id !== +id)
      throw new BadRequestException('You can only update your own profile');
    return this.userService.update(+id, updateUserDto);
  }
}
