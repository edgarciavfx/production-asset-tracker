import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { hashSync } from "bcryptjs"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

function daysFromNow(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(12, 0, 0, 0)
  return date
}

async function main() {
  console.log("Seeding database...")

  // ── Clear existing data (FK order) ──
  await prisma.comment.deleteMany()
  await prisma.task.deleteMany()
  await prisma.shot.deleteMany()
  await prisma.asset.deleteMany()
  await prisma.project.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.user.deleteMany()
  await prisma.role.deleteMany()

  // ── Roles ──
  const adminRole = await prisma.role.create({ data: { name: "Admin" } })
  const producerRole = await prisma.role.create({ data: { name: "Producer" } })
  const artistRole = await prisma.role.create({ data: { name: "Artist" } })
  console.log("Roles created: Admin, Producer, Artist")

  // ── Users ──
  const hash = (pw: string) => hashSync(pw, 10)

  await prisma.user.create({
    data: { name: "Alex Turner", email: "admin@neoncut.com", passwordHash: hash("neoncut2024"), roleId: adminRole.id },
  })
  const producerUser = await prisma.user.create({
    data: { name: "Sarah Chen", email: "producer@neoncut.com", passwordHash: hash("producer123"), roleId: producerRole.id },
  })
  const alice = await prisma.user.create({
    data: { name: "Alice Martinez", email: "alice@neoncut.com", passwordHash: hash("alice123"), roleId: artistRole.id },
  })
  const bob = await prisma.user.create({
    data: { name: "Bob Tanaka", email: "bob@neoncut.com", passwordHash: hash("bob123"), roleId: artistRole.id },
  })
  console.log("Users created (4): admin, producer, alice, bob")

  // ── Projects ──
  const echoProtocol = await prisma.project.create({
    data: {
      name: "Echo Protocol",
      description: "Cinematic trailer for a sci-fi FPS. Heavy VFX — particle simulations, holographic UI, alien environments.",
      status: "ACTIVE",
      startDate: daysFromNow(-30),
      endDate: daysFromNow(60),
    },
  })
  const obsidianCrown = await prisma.project.create({
    data: {
      name: "Obsidian Crown",
      description: "Announcement trailer for an open-world RPG. Medieval environments, creature work, cloth simulation.",
      status: "ACTIVE",
      startDate: daysFromNow(-14),
      endDate: daysFromNow(45),
    },
  })
  const starfallDrift = await prisma.project.create({
    data: {
      name: "Starfall Drift",
      description: "Vertical slice trailer for an arcade racer. Vehicle modeling, speed effects, neon cityscapes.",
      status: "ON_HOLD",
      startDate: daysFromNow(-60),
      endDate: daysFromNow(30),
    },
  })
  const wardensOath = await prisma.project.create({
    data: {
      name: "Warden's Oath",
      description: "Launch trailer for a dark fantasy action game. Delivered.",
      status: "COMPLETE",
      startDate: daysFromNow(-120),
      endDate: daysFromNow(-14),
    },
  })
  const neonRequiem = await prisma.project.create({
    data: {
      name: "Neon Requiem",
      description: "Teaser trailer for a cyberpunk stealth game. Early pre-production.",
      status: "ACTIVE",
      startDate: daysFromNow(-7),
      endDate: daysFromNow(90),
    },
  })
  console.log("Projects created: 5")

  // ── Assets ──
  // Echo Protocol
  const commanderKael = await prisma.asset.create({
    data: { name: "Commander Kael", type: "CHARACTER", status: "IN_PROGRESS", projectId: echoProtocol.id },
  })
  const holographicDrone = await prisma.asset.create({
    data: { name: "Holographic Drone", type: "PROP", status: "REVIEW", projectId: echoProtocol.id },
  })
  const xenomorphHive = await prisma.asset.create({
    data: { name: "Xenomorph Hive", type: "ENVIRONMENT", status: "NOT_STARTED", projectId: echoProtocol.id },
  })
  const phaseRifle = await prisma.asset.create({
    data: { name: "Phase Rifle", type: "PROP", status: "APPROVED", projectId: echoProtocol.id },
  })
  // Obsidian Crown
  const knightValerius = await prisma.asset.create({
    data: { name: "Knight Valerius", type: "CHARACTER", status: "IN_PROGRESS", projectId: obsidianCrown.id },
  })
  const ironThrone = await prisma.asset.create({
    data: { name: "Iron Throne", type: "PROP", status: "REVIEW", projectId: obsidianCrown.id },
  })
  const whisperingWoods = await prisma.asset.create({
    data: { name: "Whispering Woods", type: "ENVIRONMENT", status: "NOT_STARTED", projectId: obsidianCrown.id },
  })
  // Starfall Drift
  const cygnusRacer = await prisma.asset.create({
    data: { name: "Cygnus Racer", type: "VEHICLE", status: "APPROVED", projectId: starfallDrift.id },
  })
  const downtownTokyo = await prisma.asset.create({
    data: { name: "Downtown Tokyo", type: "ENVIRONMENT", status: "IN_PROGRESS", projectId: starfallDrift.id },
  })
  // Warden's Oath
  const theWarden = await prisma.asset.create({
    data: { name: "The Warden", type: "CHARACTER", status: "COMPLETE", projectId: wardensOath.id },
  })
  const shadowCitadel = await prisma.asset.create({
    data: { name: "Shadow Citadel", type: "ENVIRONMENT", status: "COMPLETE", projectId: wardensOath.id },
  })
  // Neon Requiem
  const rogueNetrunner = await prisma.asset.create({
    data: { name: "Rogue Netrunner", type: "CHARACTER", status: "NOT_STARTED", projectId: neonRequiem.id },
  })
  const rainSlickAlley = await prisma.asset.create({
    data: { name: "Rain-Slick Alley", type: "ENVIRONMENT", status: "NOT_STARTED", projectId: neonRequiem.id },
  })
  console.log("Assets created: 13")

  // ── Shots ──
  const epShot001 = await prisma.shot.create({
    data: { code: "SHOT_001", description: "Alien planet establishing shot", status: "REVIEW", projectId: echoProtocol.id },
  })
  const epShot002 = await prisma.shot.create({
    data: { code: "SHOT_002", description: "Player dropship entry", status: "IN_PROGRESS", projectId: echoProtocol.id },
  })
  const epShot003 = await prisma.shot.create({
    data: { code: "SHOT_003", description: "Holographic UI interaction", status: "NOT_STARTED", projectId: echoProtocol.id },
  })
  const ocShot001 = await prisma.shot.create({
    data: { code: "SHOT_001", description: "Castle courtyard reveal", status: "IN_PROGRESS", projectId: obsidianCrown.id },
  })
  const ocShot002 = await prisma.shot.create({
    data: { code: "SHOT_002", description: "Dragon reveal", status: "NOT_STARTED", projectId: obsidianCrown.id },
  })
  const sdShot001 = await prisma.shot.create({
    data: { code: "SHOT_001", description: "Tunnel drift sequence", status: "NOT_STARTED", projectId: starfallDrift.id },
  })
  const sdShot002 = await prisma.shot.create({
    data: { code: "SHOT_002", description: "Racer cross-finish-line", status: "NOT_STARTED", projectId: starfallDrift.id },
  })
  const woShot001 = await prisma.shot.create({
    data: { code: "SHOT_001", description: "Warden drawing sword", status: "COMPLETE", projectId: wardensOath.id },
  })
  const woShot002 = await prisma.shot.create({
    data: { code: "SHOT_002", description: "Citadel crumbling", status: "COMPLETE", projectId: wardensOath.id },
  })
  const nrShot001 = await prisma.shot.create({
    data: { code: "SHOT_001", description: "Rainy rooftop establishing shot", status: "NOT_STARTED", projectId: neonRequiem.id },
  })
  console.log("Shots created: 10")

  // ── Tasks ──
  const t1 = await prisma.task.create({
    data: { title: "Model Commander Kael", status: "IN_PROGRESS", priority: "HIGH", assigneeId: alice.id, assetId: commanderKael.id, projectId: echoProtocol.id, dueDate: daysFromNow(7) },
  })
  const t2 = await prisma.task.create({
    data: { title: "Texture holographic UI elements", status: "REVIEW", priority: "MEDIUM", assigneeId: bob.id, assetId: holographicDrone.id, projectId: echoProtocol.id, dueDate: daysFromNow(-1) },
  })
  await prisma.task.create({
    data: { title: "Block out alien environment", status: "TODO", priority: "MEDIUM", assigneeId: null, assetId: xenomorphHive.id, projectId: echoProtocol.id, dueDate: daysFromNow(14) },
  })
  await prisma.task.create({
    data: { title: "Final render Phase Rifle", status: "COMPLETE", priority: "LOW", assigneeId: alice.id, assetId: phaseRifle.id, projectId: echoProtocol.id, dueDate: daysFromNow(-3) },
  })
  const t5 = await prisma.task.create({
    data: { title: "Composite alien planet shot", status: "REVIEW", priority: "HIGH", assigneeId: bob.id, shotId: epShot001.id, projectId: echoProtocol.id, dueDate: daysFromNow(-2) },
  })
  await prisma.task.create({
    data: { title: "Animate dropship entry sequence", status: "IN_PROGRESS", priority: "CRITICAL", assigneeId: alice.id, shotId: epShot002.id, projectId: echoProtocol.id, dueDate: daysFromNow(-1) },
  })
  await prisma.task.create({
    data: { title: "Design holographic UI overlay", status: "TODO", priority: "MEDIUM", assigneeId: null, shotId: epShot003.id, projectId: echoProtocol.id, dueDate: daysFromNow(14) },
  })
  await prisma.task.create({
    data: { title: "Rig Knight Valerius for animation", status: "IN_PROGRESS", priority: "HIGH", assigneeId: bob.id, assetId: knightValerius.id, projectId: obsidianCrown.id, dueDate: daysFromNow(7) },
  })
  await prisma.task.create({
    data: { title: "Sculpt Iron Throne details", status: "TODO", priority: "MEDIUM", assigneeId: null, assetId: ironThrone.id, projectId: obsidianCrown.id, dueDate: daysFromNow(14) },
  })
  await prisma.task.create({
    data: { title: "Build Whispering Woods environment", status: "TODO", priority: "LOW", assigneeId: null, assetId: whisperingWoods.id, projectId: obsidianCrown.id, dueDate: daysFromNow(21) },
  })
  await prisma.task.create({
    data: { title: "Composite castle courtyard shot", status: "IN_PROGRESS", priority: "HIGH", assigneeId: alice.id, shotId: ocShot001.id, projectId: obsidianCrown.id, dueDate: daysFromNow(5) },
  })
  await prisma.task.create({
    data: { title: "Animate dragon reveal", status: "TODO", priority: "MEDIUM", assigneeId: null, shotId: ocShot002.id, projectId: obsidianCrown.id, dueDate: daysFromNow(14) },
  })
  await prisma.task.create({
    data: { title: "Texture Cygnus Racer body", status: "COMPLETE", priority: "MEDIUM", assigneeId: bob.id, assetId: cygnusRacer.id, projectId: starfallDrift.id, dueDate: daysFromNow(-7) },
  })
  await prisma.task.create({
    data: { title: "Light downtown environment", status: "COMPLETE", priority: "LOW", assigneeId: alice.id, assetId: downtownTokyo.id, projectId: starfallDrift.id, dueDate: daysFromNow(-5) },
  })
  await prisma.task.create({
    data: { title: "Render tunnel drift sequence", status: "TODO", priority: "LOW", assigneeId: null, shotId: sdShot001.id, projectId: starfallDrift.id, dueDate: null },
  })
  await prisma.task.create({
    data: { title: "Color grade finish line shot", status: "TODO", priority: "LOW", assigneeId: null, shotId: sdShot002.id, projectId: starfallDrift.id, dueDate: null },
  })
  await prisma.task.create({
    data: { title: "Final render Warden character", status: "COMPLETE", priority: "MEDIUM", assigneeId: bob.id, assetId: theWarden.id, projectId: wardensOath.id, dueDate: daysFromNow(-30) },
  })
  await prisma.task.create({
    data: { title: "Render Shadow Citadel destruction", status: "COMPLETE", priority: "HIGH", assigneeId: alice.id, assetId: shadowCitadel.id, projectId: wardensOath.id, dueDate: daysFromNow(-28) },
  })
  await prisma.task.create({
    data: { title: "Comp final sword scene", status: "COMPLETE", priority: "MEDIUM", assigneeId: bob.id, shotId: woShot001.id, projectId: wardensOath.id, dueDate: daysFromNow(-21) },
  })
  await prisma.task.create({
    data: { title: "Composite citadel crumbling sequence", status: "COMPLETE", priority: "HIGH", assigneeId: alice.id, shotId: woShot002.id, projectId: wardensOath.id, dueDate: daysFromNow(-21) },
  })
  await prisma.task.create({
    data: { title: "Concept art Rogue Netrunner", status: "TODO", priority: "MEDIUM", assigneeId: null, assetId: rogueNetrunner.id, projectId: neonRequiem.id, dueDate: null },
  })
  await prisma.task.create({
    data: { title: "Block out rainy alley environment", status: "TODO", priority: "LOW", assigneeId: null, assetId: rainSlickAlley.id, projectId: neonRequiem.id, dueDate: null },
  })
  await prisma.task.create({
    data: { title: "Storyboard rooftop establishing shot", status: "TODO", priority: "LOW", assigneeId: null, shotId: nrShot001.id, projectId: neonRequiem.id, dueDate: null },
  })
  console.log("Tasks created: 23")

  // ── Comments ──
  await prisma.comment.create({
    data: { body: "Started base mesh, working on facial topology now. Should be ready for review by Friday.", taskId: t1.id, authorId: alice.id },
  })
  await prisma.comment.create({
    data: { body: "Looks promising. Focus on the jawline — the concept art has a very defined silhouette.", taskId: t1.id, authorId: producerUser.id },
  })
  await prisma.comment.create({
    data: { body: "Uploaded first pass of the glow effect. The edge bleed feels a bit hot to me — thoughts?", taskId: t2.id, authorId: bob.id },
  })
  await prisma.comment.create({
    data: { body: "Dial the intensity back ~15%. It's blowing out in the composite. Also let's shift the hue toward cyan.", taskId: t2.id, authorId: producerUser.id },
  })
  await prisma.comment.create({
    data: { body: "Heads up — this shot is past deadline. Client is asking for a WIP by EOD.", taskId: t5.id, authorId: producerUser.id },
  })
  await prisma.comment.create({
    data: { body: "On it. Render is baking now, will comp and deliver in the next 2 hours.", taskId: t5.id, authorId: bob.id },
  })
  console.log("Comments created: 6")

  console.log("\n✅ Seed complete!")
  console.log("─────────────────────────────────")
  console.log("  Neon Cut VFX — Demo Login")
  console.log("─────────────────────────────────")
  console.log("  Admin:    admin@neoncut.com / neoncut2024")
  console.log("  Producer: producer@neoncut.com / producer123")
  console.log("  Artist:   alice@neoncut.com / alice123")
  console.log("  Artist:   bob@neoncut.com / bob123")
  console.log("─────────────────────────────────")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
