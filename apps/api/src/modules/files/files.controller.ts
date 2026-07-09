import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { AccessFileDto } from './dto/access-file.dto';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get(':slug')
  getMetadata(@Param('slug') slug: string) {
    return this.filesService.getMetadata(slug);
  }

  @Post(':slug/access')
  @HttpCode(HttpStatus.OK)
  requestAccess(@Param('slug') slug: string, @Body() body: AccessFileDto) {
    return this.filesService.requestAccess(slug, body.password);
  }
}
