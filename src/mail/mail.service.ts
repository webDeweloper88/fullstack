// src/mail/mail.service.ts
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { SendMailOptions } from './types/send-mail-options.interface';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);
  private templateCache = new Map<string, HandlebarsTemplateDelegate>();

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('MAIL_HOST'),
      port: this.configService.getOrThrow<number>('MAIL_PORT'),
      secure: this.configService.getOrThrow<boolean>('MAIL_SECURE'),
      auth: {
        user: this.configService.getOrThrow<string>('MAIL_USER'),
        pass: this.configService.getOrThrow<string>('MAIL_PASS'),
      },
    });
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    const html = await this.compileTemplate(
      options.templateName,
      options.context,
    );

    try {
      await this.transporter.sendMail({
        from: this.configService.getOrThrow<string>('MAIL_FROM'),
        to: options.to,
        subject: options.subject,
        html,
      });
      this.logger.log(
        `Email sent to ${options.to} — subject: ${options.subject}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error.stack);
      throw new InternalServerErrorException('Ошибка при отправке письма');
    }
  }

  private async compileTemplate(
    templateName: string,
    context: any,
  ): Promise<string> {
    if (!this.templateCache.has(templateName)) {
      // ✅ Путь из корня проекта, а не __dirname (dist/)
      const filePath = path.resolve(
        process.cwd(),
        'src',
        'mail',
        'templates',
        `${templateName}.hbs`,
      );

      let source: string;
      try {
        source = await fs.promises.readFile(filePath, 'utf-8');
      } catch (err) {
        throw new InternalServerErrorException(
          `Не удалось загрузить шаблон: ${templateName}`,
        );
      }

      const compiled = handlebars.compile(source);
      this.templateCache.set(templateName, compiled);
    }

    const templateFn = this.templateCache.get(templateName);
    if (!templateFn) {
      throw new InternalServerErrorException(
        `Не найден шаблон: ${templateName}`,
      );
    }

    return templateFn(context);
  }
}
