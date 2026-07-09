import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { UPLOAD_RATE_LIMIT_PER_HOUR } from '../../config/rate-limit.constants';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { InitUploadDto } from './dto/init-upload.dto';
import { UploadService } from './upload.service';

const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Chunk PUTs are exempt from the global JSON body parser (see AppModule's
 * middleware configuration) so `req` here is the raw request stream —
 * chunk bytes are piped straight to disk and never buffered into a
 * `Buffer` the way `express.json()`/`multer` memory storage would.
 */
@Controller('uploads')
@Throttle({ default: { limit: UPLOAD_RATE_LIMIT_PER_HOUR, ttl: ONE_HOUR_MS } })
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  initUpload(@Body() dto: InitUploadDto) {
    return this.uploadService.initUpload(dto);
  }

  @Get(':id')
  getStatus(@Param('id') id: string) {
    return this.uploadService.getStatus(id);
  }

  @Put(':id/chunks/:index')
  putChunk(
    @Param('id') id: string,
    @Param('index', ParseIntPipe) index: number,
    @Req() req: Request,
  ) {
    const contentLength = req.headers['content-length']
      ? parseInt(req.headers['content-length'], 10)
      : undefined;
    return this.uploadService.writeChunk(id, index, contentLength, req);
  }

  @Post(':id/complete')
  async completeUpload(@Param('id') id: string, @Body() dto: CompleteUploadDto) {
    const result = await this.uploadService.completeUpload(id, dto);
    // Only ever return the public share-link shape — never the raw File
    // entity, which carries the password hash and internal foreign keys.
    return {
      slug: result.file.slug,
      shareUrl: result.shareUrl,
      qrCodeDataUrl: result.qrCodeDataUrl,
      deduplicated: result.deduplicated,
    };
  }
}
