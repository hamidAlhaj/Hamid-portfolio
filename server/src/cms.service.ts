import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DbService } from "./db.service";
import { Kind, parseEntry, readingTime } from "./content.schema";
import { Prisma } from "@prisma/client";
@Injectable()
export class CmsService {
  constructor(private readonly db: DbService) {}
  async list(kind: Kind, page = 1, limit = 20, admin = false) {
    const where = { kind, ...(admin ? {} : { published: true }) };
    const [items, total] = await this.db.$transaction([
      this.db.content.findMany({
        where,
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.content.count({ where }),
    ]);
    return {
      items: items.map((item) => this.present(item)),
      total,
      page,
      limit,
    };
  }
  present(item: any) {
    return {
      ...item,
      ...(item.kind === "articles"
        ? { readTime: readingTime(item.data.content) }
        : {}),
    };
  }
  async one(kind: Kind, slug: string) {
    const item = await this.db.content.findFirst({
      where: { kind, slug, published: true },
    });
    if (!item) throw new NotFoundException();
    return this.present(item);
  }
  async portfolio() {
    const items = await this.db.content.findMany({
      where: { published: true },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    });
    const find = (kind: string) =>
      items.filter((i) => i.kind === kind).map((i) => this.present(i));
    return {
      profile: find("profile")[0] ?? null,
      settings: find("settings")[0] ?? null,
      projects: find("projects"),
      skills: find("skills"),
      articles: find("articles"),
      journey: find("journey"),
    };
  }
  async save(kind: Kind, body: unknown, id?: string) {
    const value = parseEntry(kind, body);
    if (id) {
      const old = await this.db.content.findUnique({ where: { id } });
      if (!old || old.kind !== kind) throw new NotFoundException();
    }
    try {
      const data = {
        ...value,
        kind,
        data: value.data as Prisma.InputJsonValue,
      };
      return id
        ? await this.db.content.update({ where: { id }, data })
        : await this.db.content.create({ data });
    } catch (e: any) {
      if (e.code === "P2002")
        throw new ConflictException("This slug already exists");
      throw e;
    }
  }
  async remove(kind: Kind, id: string) {
    if (kind === "profile" || kind === "settings")
      throw new BadRequestException("Singletons cannot be deleted");
    const result = await this.db.content.deleteMany({ where: { kind, id } });
    if (!result.count) throw new NotFoundException();
    return { success: true };
  }
  async reorder(kind: Kind, ids: unknown) {
    if (
      !Array.isArray(ids) ||
      ids.length > 500 ||
      ids.some((id) => typeof id !== "string") ||
      new Set(ids).size !== ids.length
    )
      throw new BadRequestException("Unique IDs required");
    const records = await this.db.content.findMany({
      where: { kind, id: { in: ids } },
    });
    if (records.length !== ids.length)
      throw new BadRequestException("Unknown entry");
    await this.db.$transaction(
      ids.map((id, position) =>
        this.db.content.update({ where: { id }, data: { position } }),
      ),
    );
    return { success: true };
  }
}
