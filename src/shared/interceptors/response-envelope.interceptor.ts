import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { AppErrorCode, APP_ERROR_MESSAGES } from '../constants/error-codes';

@Injectable()
export class ResponseEnvelopeInterceptor<T>
  implements NestInterceptor<T, unknown>
{
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => ({
        code: AppErrorCode.SUCCESS,
        message: APP_ERROR_MESSAGES[AppErrorCode.SUCCESS],
        data: data ?? null,
      })),
    );
  }
}
