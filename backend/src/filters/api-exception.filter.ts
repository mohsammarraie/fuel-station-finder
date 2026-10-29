import {
  Catch,
  HttpException,
  HttpStatus,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { logger } from "../logger.js";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    if (!(exception instanceof HttpException)) {
      (request.log ?? logger).error({ err: exception }, "Unhandled request error");
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred.",
        },
      });
      return;
    }

    if (exception.getStatus() === HttpStatus.NOT_FOUND) {
      response.status(HttpStatus.NOT_FOUND).json({
        error: {
          code: "NOT_FOUND",
          message: "The requested resource was not found.",
        },
      });
      return;
    }

    response.status(exception.getStatus()).json(exception.getResponse());
  }
}
