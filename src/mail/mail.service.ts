// src/mail/mail.service.ts
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
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

  constructor(private readonly config: ConfigService) {
    // ������ Убедись, что эти значения реально boolean/number
    const port = Number(this.config.get('MAIL_PORT'));
    const secure = String(this.config.get('MAIL_SECURE')).toLowerCase() === 'true';

    this.transporter = nodemailer.createTransport({
      host: this.config.getOrThrow<string>('MAIL_HOST'),
      port,
      secure,
      auth: {
        user: this.config.getOrThrow<string>('MAIL_USER'),
        pass: this.config.getOrThrow<string>('MAIL_PASS'),
      },
    });
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    const html = await this.compileTemplate(options.templateName, options.context);
    try {
      await this.transporter.sendMail({
        from: this.config.getOrThrow<string>('MAIL_FROM'),
        to: options.to,
        subject: options.subject,
        html,
      });
      this.logger.log(`Email sent to ${options.to} — subject: ${options.subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error.stack);
      throw new InternalServerErrorException('Ошибка при отправке письма');
    }
  }

  private async compileTemplate(templateName: string, context: any): Promise<string> {
    // 1) dist: .../dist/mail/templates/<name>.hbs  (в проде)
    // 2) src : .../src/mail/templates/<name>.hbs   (локально)
    // 3) MAIL_TEMPLATES_DIR=<путь> (если хочешь переопределять)
    const candidates = [
      path.join(__dirname, 'templates', `${templateName}.hbs`),
      path.resolve(process.cwd(), 'src', 'mail', 'templates', `${templateName}.hbs`),
      this.config.get<string>('MAIL_TEMPLATES_DIR')
        ? path.join(this.config.get<string>('MAIL_TEMPLATES_DIR')!, `${templateName}.hbs`)
        : null,
    ].filter(Boolean) as string[];

    let filePath: string | null = null;
    for (const p of candidates) {
      try {
        await fs.promises.access(p, fs.constants.F_OK);
        filePath = p;
        break;
      } catch (_) {}
    }

    if (!filePath) {
      this.logger.error(`Template "${templateName}" not found. Tried: ${candidates.join(' | ')}`);
      throw new InternalServerErrorException(`Не удалось загрузить шаблон: ${templateName}`);
    }

    // Кэшируем по имени шаблона (можно по пути, если нужно)
    let compiled = this.templateCache.get(templateName);
    if (!compiled) {
      const source = await fs.promises.readFile(filePath, 'utf-8');
      compiled = handlebars.compile(source);
      this.templateCache.set(templateName, compiled);
    }

    return compiled(context);
  }
}
