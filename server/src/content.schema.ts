import { BadRequestException } from "@nestjs/common";
import { z } from "zod";
const text = z.string().trim().max(200);
const long = z.string().max(100000);
const url = z
  .string()
  .max(2048)
  .refine(
    (v) =>
      !v ||
      (v.startsWith("/") && !v.startsWith("//") && !v.includes("\\")) ||
      /^https?:\/\//i.test(v),
    "Use a relative path or HTTP(S) URL",
  );
const link = z
  .object({
    label: text.min(1),
    href: z
      .string()
      .url()
      .regex(/^https?:\/\//i),
  })
  .strict();
export const sections = [
  "projects",
  "skills",
  "about",
  "articles",
  "journey",
  "contact",
] as const;
export const schemas = {
  profile: z
    .object({
      name: text.min(1),
      role: text.min(1),
      introduction: text.min(1),
      summary: long,
      about: long,
      location: text,
      availability: text,
      imageUrl: url,
      cvUrl: url,
      email: z.string().email(),
      socialLinks: z.array(link).max(15),
    })
    .strict(),
  projects: z
    .object({
      name: text.min(1),
      category: z.enum(["Frontend", "Backend", "Full-stack", "Security"]),
      subtitle: text,
      description: z.string().max(2000),
      content: long,
      contribution: long,
      challenges: long,
      solutions: long,
      tags: z.array(text.min(1)).max(30),
      imageUrl: url,
      gallery: z.array(url).max(12),
      githubUrl: url,
      liveUrl: url,
      status: z.enum(["In progress", "Completed"]),
      featured: z.boolean(),
    })
    .strict(),
  skills: z
    .object({
      title: text.min(1),
      note: text,
      skills: z
        .array(
          z.object({ name: text.min(1), icon: text, imageUrl: url }).strict(),
        )
        .max(100),
    })
    .strict(),
  articles: z
    .object({
      title: text.min(1),
      excerpt: z.string().max(2000),
      content: long,
      coverUrl: url,
      tags: z.array(text).max(30),
      topic: text,
      linkedinUrl: url,
      publishedAt: z.string().datetime().nullable(),
    })
    .strict(),
  journey: z
    .object({
      period: text,
      title: text.min(1),
      organization: text,
      description: long,
      kind: z.enum(["education", "bootcamp", "project"]),
    })
    .strict(),
  settings: z
    .object({
      sections: z
        .array(
          z.object({ id: z.enum(sections), visible: z.boolean() }).strict(),
        )
        .length(6)
        .refine(
          (a) => new Set(a.map((s) => s.id)).size === 6,
          "Include each section exactly once",
        ),
      background: z.literal(
        "linear-gradient(135deg, #3d00b8 0%, #21dda2 100%)",
      ),
    })
    .strict(),
};
export type Kind = keyof typeof schemas;
export function kindOf(value: string): Kind {
  if (!(value in schemas) || !Object.hasOwn(schemas, value))
    throw new BadRequestException("Unknown content type");
  return value as Kind;
}
export const entrySchema = z
  .object({
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(120),
    published: z.boolean(),
    position: z.number().int().min(0).max(100000),
    data: z.unknown(),
  })
  .strict();
export function parseEntry(kind: Kind, value: unknown) {
  const entry = entrySchema.safeParse(value);
  if (!entry.success)
    throw new BadRequestException(
      entry.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    );
  const data = schemas[kind].safeParse(entry.data.data);
  if (!data.success)
    throw new BadRequestException(
      data.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    );
  if ((kind === "profile" || kind === "settings") && entry.data.slug !== "main")
    throw new BadRequestException("Singleton slug must be main");
  return { ...entry.data, data: data.data };
}
export const contactSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z.string().email().max(254),
    subject: z.string().trim().max(120).default(""),
    message: z.string().trim().min(10).max(4000),
    website: z.string().max(0).optional(),
  })
  .strict();
export function readingTime(content: string) {
  return `${Math.max(1, Math.ceil(content.trim().split(/\s+/).filter(Boolean).length / 220))} min read`;
}
