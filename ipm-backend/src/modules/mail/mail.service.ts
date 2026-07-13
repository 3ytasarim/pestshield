import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { LicenseType } from '../../common/enums/license.enum';

const LICENSE_TYPE_LABELS: Record<LicenseType, string> = {
  [LicenseType.DEMO]: 'Demo (5 gün)',
  [LicenseType.MONTHLY]: 'Aylık',
  [LicenseType.YEARLY]: 'Yıllık',
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    this.fromAddress = this.configService.get<string>(
      'SMTP_FROM',
      'PestShield <no-reply@pestshield.app>',
    );
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('SMTP_HOST'),
      port: Number(this.configService.get<string>('SMTP_PORT', '587')),
      secure: this.configService.get<string>('SMTP_SECURE', 'false') === 'true',
      auth: {
        user: this.configService.getOrThrow<string>('SMTP_USER'),
        pass: this.configService.getOrThrow<string>('SMTP_PASSWORD'),
      },
    });
  }

  async sendLicenseKeyEmail(params: {
    to: string;
    companyName: string;
    licenseKey: string;
    type: LicenseType;
    expiresAt: Date | null;
  }): Promise<void> {
    const typeLabel = LICENSE_TYPE_LABELS[params.type];
    const expiryText = params.expiresAt
      ? params.expiresAt.toLocaleDateString('tr-TR')
      : 'aktivasyondan itibaren hesaplanacak';

    await this.transporter.sendMail({
      from: this.fromAddress,
      to: params.to,
      subject: `PestShield - ${typeLabel} Lisans Anahtarınız`,
      text: [
        `Merhaba ${params.companyName},`,
        '',
        `${typeLabel} lisans anahtarınız oluşturuldu:`,
        '',
        params.licenseKey,
        '',
        `Geçerlilik: ${expiryText}`,
        '',
        'Bu anahtarı PestShield uygulamasında "Lisans Aktive Et" ekranına girerek kullanabilirsiniz.',
      ].join('\n'),
    });

    this.logger.log(`Lisans anahtarı e-postası gönderildi: ${params.to}`);
  }
}
