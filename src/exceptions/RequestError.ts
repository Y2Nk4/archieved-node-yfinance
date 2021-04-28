import { Response } from 'got'

export class RequestError extends Error {
  public statusCode: number;
  public message: string;
  public code: string;

  constructor (message: string, response: Response, code: string = null) {
    super(message)
    this.message = message
    this.code = code
    this.statusCode = response.statusCode
  }
}
