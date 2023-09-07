import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { pick } from 'lodash';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { authConfig } from '../../../configs/auth.config';
import { AuthConfig } from '../../../configs/auth.config';
import { AUTH_COOKIE } from '../../../const';
import { UserService } from '../../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @AuthConfig() readonly config: ConfigType<typeof authConfig>,
    private readonly userService: UserService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        JwtStrategy.fromAuthCookieAsToken,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.jwt.secret,
    });
  }

  public static fromAuthCookieAsToken(req: Request): string | null {
    return req.cookies?.[AUTH_COOKIE] ?? null;
  }

  async validate(payload: { id: string }) {
    const user = await this.userService.getUserById(payload.id);
    if (!user) {
      throw new UnauthorizedException();
    }
    return pick(user, 'id', 'name', 'avatar', 'phone', 'email');
  }
}