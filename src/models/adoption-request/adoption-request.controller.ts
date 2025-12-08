import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AdoptionRequestService } from './adoption-request.service';
import { CreateAdoptionRequestDto } from './dto/create-adoption-request.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { getUserFronRequest } from 'src/auth/utils';

@ApiTags('Adoption Requests')
@ApiBearerAuth()
@Controller('adoption-request')
export class AdoptionRequestController {
  constructor(
    private readonly adoptionRequestService: AdoptionRequestService,
  ) {}

  @Auth()
  @Post()
  create(
    @Body() createAdoptionRequestDto: CreateAdoptionRequestDto,
    @Req() req: Request,
  ) {
    const user = getUserFronRequest(req);
    if (!user) throw new UnauthorizedException();
    return this.adoptionRequestService.create(
      createAdoptionRequestDto,
      user.id,
    );
  }

  @Auth()
  @Get()
  findAll(@Req() req: Request) {
    const user = getUserFronRequest(req);
    if (!user) throw new UnauthorizedException();
    return this.adoptionRequestService.findAll({}, user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adoptionRequestService.findOne(+id);
  }

  @Auth()
  @Post(':id/approve')
  approve(@Param('id') id: string, @Req() req: Request) {
    const user = getUserFronRequest(req);
    if (!user) throw new UnauthorizedException();
    return this.adoptionRequestService.approve(+id, user.id);
  }

  @Auth()
  @Post(':id/reject')
  reject(@Param('id') id: string, @Req() req: Request) {
    const user = getUserFronRequest(req);
    if (!user) throw new UnauthorizedException();
    return this.adoptionRequestService.reject(+id, user.id);
  }
}
