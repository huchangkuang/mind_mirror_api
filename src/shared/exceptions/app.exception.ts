import { HttpException, HttpStatus } from '@nestjs/common';
import { AppErrorCode, APP_ERROR_MESSAGES } from '../constants/error-codes';

export class AppException extends HttpException {
  constructor(
    public readonly code: AppErrorCode,
    public readonly messageText?: string,
    status?: HttpStatus,
  ) {
    super(messageText ?? APP_ERROR_MESSAGES[code], status ?? HttpStatus.BAD_REQUEST);
  }
}
