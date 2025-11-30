import { Controller, Get, Body, Patch, Param, Delete } from '@nestjs/common';
import { SystemRoleService } from './system-role.service';
import { UpdateSystemRoleDto } from './dto/update-system-role.dto';

@Controller('system-role')
export class SystemRoleController {
  constructor(private readonly systemRoleService: SystemRoleService) {}

  @Get()
  findAll() {
    return this.systemRoleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.systemRoleService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSystemRoleDto: UpdateSystemRoleDto,
  ) {
    return this.systemRoleService.update(+id, updateSystemRoleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.systemRoleService.remove(+id);
  }
}
