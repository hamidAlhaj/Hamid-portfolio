import { Injectable, Logger } from '@nestjs/common';
import { appendFile, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import type { CreateContactDto } from './contact.dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  async saveMessage(dto: CreateContactDto) {
    const entry = {
      id: randomUUID(),
      name: dto.name.trim(),
      email: dto.email.trim(),
      subject: dto.subject?.trim() || 'No subject',
      message: dto.message.trim(),
      createdAt: new Date().toISOString(),
    };

    const dataDirectory = join(process.cwd(), 'data');
    const filePath = join(dataDirectory, 'messages.jsonl');
    await mkdir(dataDirectory, { recursive: true });
    await appendFile(filePath, `${JSON.stringify(entry)}\n`, { encoding: 'utf8', mode: 0o600 });
    this.logger.log(`Saved a contact message (${entry.id})`);

    return { success: true, message: 'Message saved successfully.' };
  }
}
