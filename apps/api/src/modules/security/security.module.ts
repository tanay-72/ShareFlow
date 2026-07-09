import { Global, Module } from '@nestjs/common';
import { MimeSniffingService } from './mime-sniffing.service';
import { PasswordService } from './password.service';
import { SignedTokenService } from './signed-token.service';

@Global()
@Module({
  providers: [PasswordService, SignedTokenService, MimeSniffingService],
  exports: [PasswordService, SignedTokenService, MimeSniffingService],
})
export class SecurityModule {}
