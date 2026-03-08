import { Controller, Get, Req } from '@nestjs/common';
import { UsersService } from './users.service';

type AuthedReq = { user: { id: number } };

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('my-team')
  myTeam(@Req() req: AuthedReq) {
    return this.users.getMyTeam(req.user.id);
  }
}
