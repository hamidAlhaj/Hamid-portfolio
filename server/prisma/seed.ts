import { PrismaClient, Prisma } from "@prisma/client";
import { readFileSync } from "node:fs";
const legacy = JSON.parse(
  readFileSync(
    require("node:path").join(__dirname, "legacy-content.json"),
    "utf8",
  ),
);
const db = new PrismaClient();
async function add(kind: string, slug: string, data: any, position = 0) {
  await db.content.upsert({
    where: { kind_slug: { kind, slug } },
    update: {},
    create: {
      kind,
      slug,
      data: data as Prisma.InputJsonValue,
      published: true,
      position,
    },
  });
}
async function main() {
  const p = legacy.initialProfile;
  await add("profile", "main", {
    name: p.name,
    role: p.role,
    introduction: "Hi, I’m Hamid. I build web apps and APIs.",
    summary: p.summary,
    about:
      "I’m an Informatics Engineering graduate focused on full-stack development, backend systems, and API security. I value readable code, practical projects, and working well with a team.",
    location: p.location,
    availability: p.availability,
    imageUrl: "",
    cvUrl: p.cvUrl,
    email: "hamid2alden2alhaj@gmail.com",
    socialLinks: [
      ...p.socialLinks.map(({ label, href }: any) => ({ label, href })),
      { label: "X", href: "https://x.com/HamidAlhaj_JS" },
      {
        label: "YouTube",
        href: "https://www.youtube.com/channel/UCG1YaggAjTSmPwWp1W5UmVA",
      },
      { label: "Instagram", href: "https://www.instagram.com/hamidalhaj_/" },
    ],
  });
  for (const [i, p] of legacy.initialProjects.entries())
    await add(
      "projects",
      p.id,
      {
        name: p.name,
        category: p.category,
        subtitle: p.subtitle,
        description: p.description,
        content: p.highlights.map((s: string) => `- ${s}`).join("\n"),
        contribution: "",
        challenges: "",
        solutions: "",
        tags: p.tags,
        imageUrl: p.imageUrl || "",
        gallery: [],
        githubUrl: p.githubUrl || "",
        liveUrl: p.liveUrl || "",
        status: ["decisionlab"].includes(p.id) ? "In progress" : "Completed",
        featured: i < 3,
      },
      i,
    );
  for (const [i, s] of legacy.initialSkills.entries())
    await add(
      "skills",
      s.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-$/, ""),
      {
        title: s.title,
        note: s.note,
        skills: s.skills.map((name: string) => ({
          name,
          icon: name,
          imageUrl: "",
        })),
      },
      i,
    );
  for (const [i, a] of legacy.initialArticles.entries())
    await add(
      "articles",
      a.id,
      {
        title: a.title,
        excerpt: a.excerpt,
        content: a.body.join("\n\n"),
        coverUrl: a.coverUrl,
        tags: a.tags,
        topic: a.topic,
        linkedinUrl: a.linkedinUrl || "",
        publishedAt: null,
      },
      i,
    );
  for (const [i, j] of legacy.journey.entries())
    await add("journey", `journey-${i}`, j, i);
  await add("settings", "main", {
    sections: [
      "projects",
      "skills",
      "about",
      "articles",
      "journey",
      "contact",
    ].map((id) => ({ id, visible: true })),
    background: "linear-gradient(135deg, #3d00b8 0%, #21dda2 100%)",
  });
  console.log("Seed complete. Existing records were left untouched.");
}
main().finally(() => db.$disconnect());
