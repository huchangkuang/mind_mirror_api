import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  AppErrorCode,
  APP_ERROR_MESSAGES,
} from '../constants/error-codes';
import { AppException } from '../exceptions/app.exception';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = this.resolveStatus(exception);
    const code = this.resolveCode(exception, status);
    const message = this.resolveMessage(exception, code);

    response.status(status).json({
      code,
      message,
      data: null,
    });
  }

  private resolveStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private resolveCode(exception: unknown, status: number): AppErrorCode {
    if (exception instanceof AppException) {
      return exception.code;
    }
    if (status === HttpStatus.BAD_REQUEST) return AppErrorCode.BAD_REQUEST;
    if (status === HttpStatus.UNAUTHORIZED) return AppErrorCode.UNAUTHORIZED;
    if (status === HttpStatus.FORBIDDEN) return AppErrorCode.FORBIDDEN;
    if (status === HttpStatus.NOT_FOUND) return AppErrorCode.RESOURCE_NOT_FOUND;
    if (status === HttpStatus.CONFLICT) return AppErrorCode.CONFLICT;
    return AppErrorCode.INTERNAL_ERROR;
  }

  private resolveMessage(exception: unknown, code: AppErrorCode): string {
    if (exception instanceof AppException && exception.messageText) {
      return exception.messageText;
    }
    if (exception instanceof HttpException) {
      const payload = exception.getResponse() as
        | { message?: string | string[] }
        | string;
      if (typeof payload === 'string') return payload;
      if (Array.isArray(payload?.message)) return payload.message.join('; ');
      if (typeof payload?.message === 'string') return payload.message;
    }
    return APP_ERROR_MESSAGES[code];
  }
}
