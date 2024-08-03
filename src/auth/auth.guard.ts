import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_ROUTE_KEY } from './decorators/public-route.decorator'

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const isPublic = this.reflector.getAllAndOverride<boolean>(
			IS_PUBLIC_ROUTE_KEY,
			[context.getHandler(), context.getClass()]
		)

		if (isPublic) {
			return true
		}

		throw new UnauthorizedException()
	}
}
