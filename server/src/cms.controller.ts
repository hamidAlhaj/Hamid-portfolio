import {
  BadRequestException,
  NotFoundException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { z } from "zod";
import { AdminGuard } from "./admin.guard";
import { CmsService } from "./cms.service";
import { DbService } from "./db.service";
import { contactSchema, kindOf } from "./content.schema";
import { StorageService } from "./storage.service";
function pagination(page?: string, limit?: string) {
  const result = z
    .object({
      page: z.coerce.number().int().min(1).max(100000).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    })
    .safeParse({ page, limit });
  if (!result.success) throw new BadRequestException("Invalid pagination");
  return result.data;
}
@Controller()
export class PublicController {
  constructor(
    private readonly cms: CmsService,
    private readonly db: DbService,
  ) {}
  @Get("portfolio") portfolio() {
    return this.cms.portfolio();
  }
  @Get("content/:kind") list(
    @Param("kind") kind: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const p = pagination(page, limit);
    return this.cms.list(kindOf(kind), p.page, p.limit);
  }
  @Get("content/:kind/:slug") one(
    @Param("kind") kind: string,
    @Param("slug") slug: string,
  ) {
    return this.cms.one(kindOf(kind), slug);
  }
  @Post("contact")
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async contact(@Body() body: unknown) {
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success)
      throw new BadRequestException(
        "Please provide valid contact details and a message of 10–4000 characters",
      );
    const { website, ...data } = parsed.data;
    await this.db.message.create({ data });
    return {
      success: true,
      message: "Thank you. Your message has been received.",
    };
  }
}
@Controller("admin")
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly cms: CmsService,
    private readonly db: DbService,
    private readonly storage: StorageService,
  ) {}
  @Get("content/:kind") list(
    @Param("kind") kind: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const p = pagination(page, limit);
    return this.cms.list(kindOf(kind), p.page, p.limit, true);
  }
  @Post("content/:kind") create(
    @Param("kind") kind: string,
    @Body() body: unknown,
  ) {
    return this.cms.save(kindOf(kind), body);
  }
  @Put("content/:kind/:id") update(
    @Param("kind") kind: string,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.cms.save(kindOf(kind), body, id);
  }
  @Delete("content/:kind/:id") remove(
    @Param("kind") kind: string,
    @Param("id") id: string,
  ) {
    return this.cms.remove(kindOf(kind), id);
  }
  @Post("reorder/:kind") reorder(
    @Param("kind") kind: string,
    @Body() body: unknown,
  ) {
    const value = z
      .object({ ids: z.array(z.string()).max(500) })
      .strict()
      .safeParse(body);
    if (!value.success) throw new BadRequestException();
    return this.cms.reorder(kindOf(kind), value.data.ids);
  }
  @Get("messages") async messages(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const p = pagination(page, limit);
    const [items, total] = await this.db.$transaction([
      this.db.message.findMany({
        orderBy: { createdAt: "desc" },
        skip: (p.page - 1) * p.limit,
        take: p.limit,
      }),
      this.db.message.count(),
    ]);
    return { items, total, ...p };
  }
  @Patch("messages/:id") async read(
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const value = z.object({ read: z.boolean() }).strict().safeParse(body);
    if (!value.success) throw new BadRequestException();
    const result = await this.db.message.updateMany({
      where: { id },
      data: value.data,
    });
    if (!result.count) throw new NotFoundException("Message not found");
    return this.db.message.findUnique({ where: { id } });
  }
  @Delete("messages/:id") async deleteMessage(@Param("id") id: string) {
    const result = await this.db.message.deleteMany({ where: { id } });
    if (!result.count) throw new NotFoundException("Message not found");
    return { success: true };
  }
  @Post("uploads")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 8 * 1024 * 1024, files: 1, fields: 0 },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    return this.storage.upload(file);
  }
}
