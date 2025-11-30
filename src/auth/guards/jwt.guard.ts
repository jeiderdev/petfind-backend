import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { isUserPayload } from '../utils';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  extractTokenFromHeader(request: Request): string | null {
    const authHeader: unknown = request.headers['authorization'];
    if (!authHeader) return null;
    if (typeof authHeader !== 'string') return null;
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }

  canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Unauthorized');
    }
    try {
      const payload: unknown = this.jwtService.verify(token);
      if (!isUserPayload(payload)) {
        throw new UnauthorizedException('Unauthorized');
      }
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('Unauthorized');
    }
    return Promise.resolve(true);
  }
}
