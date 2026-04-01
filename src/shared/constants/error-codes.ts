export enum AppErrorCode {
  SUCCESS = 0,

  VALIDATION_ERROR = 10001,
  INVALID_JSON = 10002,
  BAD_REQUEST = 10003,

  UNAUTHORIZED = 20001,
  FORBIDDEN = 20002,
  TOKEN_EXPIRED = 20003,
  TOKEN_INVALID = 20004,

  RESOURCE_NOT_FOUND = 30001,
  CONFLICT = 30002,

  INTERNAL_ERROR = 50000,
}

export const APP_ERROR_MESSAGES: Record<AppErrorCode, string> = {
  [AppErrorCode.SUCCESS]: 'ok',
  [AppErrorCode.VALIDATION_ERROR]: '参数校验失败',
  [AppErrorCode.INVALID_JSON]: '无效的 JSON',
  [AppErrorCode.BAD_REQUEST]: '请求参数错误',
  [AppErrorCode.UNAUTHORIZED]: '未认证或登录已失效',
  [AppErrorCode.FORBIDDEN]: '无权限访问',
  [AppErrorCode.TOKEN_EXPIRED]: '登录已过期',
  [AppErrorCode.TOKEN_INVALID]: '令牌无效',
  [AppErrorCode.RESOURCE_NOT_FOUND]: '资源不存在',
  [AppErrorCode.CONFLICT]: '资源冲突',
  [AppErrorCode.INTERNAL_ERROR]: '服务器内部错误',
};
