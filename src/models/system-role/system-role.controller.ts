import { Controller, Get, Body, Patch, Param } from '@nestjs/common';
import { SystemRoleService } from './system-role.service';
import { UpdateSystemRoleDto } from './dto/update-system-role.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { SystemRoles } from 'src/common/enums/system-role.enum';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('System Roles')
@ApiBearerAuth()
@Controller('system-role')
export class SystemRoleController {
  constructor(private readonly systemRoleService: SystemRoleService) {}

  @Auth({ roles: [SystemRoles.ADMIN] })
  @Get()
  findAll() {
    return this.systemRoleService.findAll();
  }

  @Auth({ roles: [SystemRoles.ADMIN] })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.systemRoleService.findOne(+id);
  }

  @Auth({ roles: [SystemRoles.ADMIN] })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSystemRoleDto: UpdateSystemRoleDto,
  ) {
    return this.systemRoleService.update(+id, updateSystemRoleDto);
  }
}
