export class ApiError extends Error {
  code: 'NETWORK' | 'HTTP' | 'INVALID_RESPONSE' | 'CONFIG';
  status?: number;

  constructor(message: string, code: ApiError['code'], status?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}
