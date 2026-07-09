import { Controller, Get, Headers, Logger, Param, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { DOWNLOAD_RATE_LIMIT_PER_HOUR } from '../../config/rate-limit.constants';
import { DownloadService } from './download.service';

const ONE_HOUR_MS = 60 * 60 * 1000;

@Controller('download')
@Throttle({ default: { limit: DOWNLOAD_RATE_LIMIT_PER_HOUR, ttl: ONE_HOUR_MS } })
export class DownloadController {
  private readonly logger = new Logger(DownloadController.name);

  constructor(private readonly downloadService: DownloadService) {}

  @Get(':token')
  async download(
    @Param('token') token: string,
    @Headers('range') rangeHeader: string | undefined,
    @Res() res: Response,
  ) {
    const { status, headers, stream, file, isFullDownload } =
      await this.downloadService.prepareDownload(token, rangeHeader);

    res.status(status).set(headers);

    stream.on('error', (error) => {
      this.logger.error(`Error streaming file ${file.id}: ${error.message}`);
      if (!res.headersSent) {
        res.status(500);
      }
      res.end();
    });

    res.on('close', () => {
      if (!res.writableEnded) {
        stream.destroy();
      }
    });

    stream.pipe(res);

    if (isFullDownload) {
      res.on('finish', () => {
        this.downloadService.recordCompletion(file).catch((error) => {
          this.logger.error(`Failed to record download completion for ${file.id}: ${error.message}`);
        });
      });
    }
  }
}
