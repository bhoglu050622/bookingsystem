import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import Handlebars, { TemplateDelegate } from 'handlebars';
import { readFile } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class NotificationTemplateService {
  private readonly logger = new Logger(NotificationTemplateService.name);

  private readonly cache = new Map<string, TemplateDelegate>();

  async render(
    channel: NotificationChannel,
    templateName: string,
    data: Record<string, unknown>,
  ): Promise<string> {
    const template = await this.loadTemplate(channel, templateName);
    return template(data);
  }

  private async loadTemplate(
    channel: NotificationChannel,
    templateName: string,
  ) {
    const cacheKey = `${channel}:${templateName}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const fileName = `${templateName}.${channel.toLowerCase()}.hbs`;
    const templatePath = join(__dirname, 'templates', fileName);

    try {
      const contents = await readFile(templatePath, 'utf8');
      const compiled = Handlebars.compile(contents);
      this.cache.set(cacheKey, compiled);
      return compiled;
    } catch (error) {
      this.logger.error(
        `Failed to load notification template ${fileName}`,
        error as Error,
      );
      throw error;
    }
  }
}
