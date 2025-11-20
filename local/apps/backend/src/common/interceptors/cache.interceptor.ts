import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(private readonly redisService: RedisService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    // Only cache GET requests
    if (method !== 'GET') {
      return next.handle();
    }

    const cacheKey = `cache:${url}`;
    const redis = this.redisService.getClient();

    try {
      // Try to get from cache
      const cached = await redis.get(cacheKey);
      if (cached) {
        return of(JSON.parse(cached));
      }

      // If not cached, proceed and cache the response
      return next.handle().pipe(
        tap((data) => {
          // Cache for 5 minutes
          redis.setex(cacheKey, 300, JSON.stringify(data)).catch(() => {
            // Ignore cache errors
          });
        }),
      );
    } catch (error) {
      // If Redis fails, just proceed without caching
      return next.handle();
    }
  }
}

