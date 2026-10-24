import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { timingSafeEqual } from "node:crypto";
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const expected = process.env.ADMIN_API_KEY;
    const header = context.switchToHttp().getRequest().headers.authorization;
    if (!expected || expected.length < 32 || typeof header !== "string")
      throw new UnauthorizedException();
    const supplied = Buffer.from(header),
      target = Buffer.from(`Bearer ${expected}`);
    if (supplied.length !== target.length || !timingSafeEqual(supplied, target))
      throw new UnauthorizedException();
    return true;
  }
}
