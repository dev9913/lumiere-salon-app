import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Passwords that must never make it into a real environment, even if someone
// pastes an old example value into .env by habit.
const BLOCKED_PASSWORDS = new Set([
  "changeme123!",
  "password",
  "password123",
  "admin",
  "admin123",
  "12345678",
]);

function assertAdminCredentialsAreSafe(email: string | undefined, password: string | undefined) {
  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be set before seeding. " +
        "There is no default admin account — set both in your environment " +
        "(.env locally, or your platform's secret manager in any deployed " +
        "environment) and re-run `npm run db:seed`."
    );
  }

  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  }

  if (BLOCKED_PASSWORDS.has(password.toLowerCase())) {
    throw new Error(
      `"${password}" is a known example/placeholder password and is blocked. Choose a real one.`
    );
  }
}

async function main() {
  console.log("Seeding Lumière Salon…");

  // ---------------------------------------------------------------------
  // Admin account — no fallback values. Seeding fails loudly rather than
  // ever creating a predictable admin login.
  // ---------------------------------------------------------------------
  assertAdminCredentialsAreSafe(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);
  const adminEmail = process.env.ADMIN_EMAIL!.toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD!;
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { name: "Salon Admin", email: adminEmail, passwordHash: adminPasswordHash, role: "ADMIN" },
  });
  console.log(`Admin account ready: ${adminEmail}`); // never logs the password

  // ---------------------------------------------------------------------
  // Demo customer — dev/staging convenience ONLY. Opt-in via SEED_DEMO_DATA
  // and hard-blocked when NODE_ENV=production, so it can never end up in a
  // real deployment even if the flag gets left on by accident.
  // ---------------------------------------------------------------------
  const wantsDemoData = process.env.SEED_DEMO_DATA === "true";
  const isProduction = process.env.NODE_ENV === "production";

  if (wantsDemoData && isProduction) {
    console.warn("SEED_DEMO_DATA=true is ignored because NODE_ENV=production. Skipping demo customer.");
  } else if (wantsDemoData) {
    const demoPassword = "Password123!"; // fine for local/staging only — never used when isProduction is true
    const demoCustomerHash = await bcrypt.hash(demoPassword, 10);
    await prisma.user.upsert({
      where: { email: "demo@customer.com" },
      update: {},
      create: {
        name: "Demo Customer",
        email: "demo@customer.com",
        phone: "555-010-0100",
        passwordHash: demoCustomerHash,
        role: "CUSTOMER",
      },
    });
    console.log(`Demo customer ready: demo@customer.com / ${demoPassword} (SEED_DEMO_DATA=true, non-production only)`);
  } else {
    console.log("Skipping demo customer (set SEED_DEMO_DATA=true in a non-production environment to include it).");
  }

  // ---------------------------------------------------------------------
  // Salon info
  // ---------------------------------------------------------------------
  const existingInfo = await prisma.salonInfo.findFirst();
  if (!existingInfo) {
    await prisma.salonInfo.create({
      data: {
        name: "Lumière Salon",
        tagline: "Considered hair, skin, and bridal care",
        addressLine: "221 Willow Street",
        city: "Portland, OR 97205",
        phone: "(555) 019-2244",
        email: "hello@lumiere-salon.com",
        hoursNote: "Tue–Sat 9am–7pm · Sun–Mon closed",
      },
    });
  }

  // ---------------------------------------------------------------------
  // Categories
  // ---------------------------------------------------------------------
  const categoryDefs = [
    { name: "Haircuts & Styling", icon: "✂️", description: "Precision cuts, blowouts, and finishing styles.", sortOrder: 0 },
    { name: "Hair Color", icon: "🎨", description: "Full color, balayage, highlights, and corrective work.", sortOrder: 1 },
    { name: "Facial & Skin Care", icon: "🧖", description: "Custom facials and skin treatments for every type.", sortOrder: 2 },
    { name: "Manicure & Pedicure", icon: "💅", description: "Classic and gel nail services for hands and feet.", sortOrder: 3 },
    { name: "Makeup", icon: "💄", description: "Everyday, special-occasion, and editorial makeup.", sortOrder: 4 },
    { name: "Spa / Massage", icon: "🌿", description: "Massage and body treatments to help you unwind.", sortOrder: 5 },
    { name: "Bridal Packages", icon: "💍", description: "Bundled hair, makeup, and skin prep for your big day.", sortOrder: 6 },
  ];

  const categories: Record<string, string> = {};
  for (const def of categoryDefs) {
    const cat = await prisma.category.upsert({
      where: { slug: slugify(def.name) },
      update: { description: def.description, icon: def.icon, sortOrder: def.sortOrder },
      create: { ...def, slug: slugify(def.name) },
    });
    categories[def.name] = cat.id;
  }

  // ---------------------------------------------------------------------
  // Services
  // ---------------------------------------------------------------------
  const serviceDefs = [
    // Haircuts & Styling
    { category: "Haircuts & Styling", name: "Women's Haircut", duration: 60, price: 6500, description: "Consultation, shampoo, precision cut, and style.", image: "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=800&q=80" },
    { category: "Haircuts & Styling", name: "Men's Haircut", duration: 40, price: 4000, description: "Classic or modern cut with a clean finish.", image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80" },
    { category: "Haircuts & Styling", name: "Children's Haircut", duration: 30, price: 3000, description: "A patient, friendly cut for clients 12 and under.", image: "https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=800&q=80" },
    { category: "Haircuts & Styling", name: "Blowout & Style", duration: 45, price: 4500, description: "Wash and professional blow-dry styling.", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80" },

    // Hair Color
    { category: "Hair Color", name: "All-Over Color", duration: 90, price: 9500, description: "Single-process color from root to tip.", image: "https://images.unsplash.com/photo-1522336284037-91f7da073525?w=800&q=80" },
    { category: "Hair Color", name: "Balayage", duration: 150, price: 18000, description: "Hand-painted, low-maintenance dimensional color.", image: "https://images.unsplash.com/photo-1595475884562-073c30d45670?w=800&q=80" },
    { category: "Hair Color", name: "Partial Highlights", duration: 120, price: 13000, description: "Foil highlights focused around the face and crown.", image: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=800&q=80" },
    { category: "Hair Color", name: "Root Touch-Up", duration: 60, price: 7000, description: "Refresh regrowth to match your existing color.", image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80" },

    // Facial & Skin Care
    { category: "Facial & Skin Care", name: "Classic Facial", duration: 50, price: 8500, description: "Cleanse, exfoliate, and hydrate for all skin types.", image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80" },
    { category: "Facial & Skin Care", name: "Deep Cleansing Facial", duration: 60, price: 9500, description: "Extractions and a purifying mask for congested skin.", image: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&q=80" },
    { category: "Facial & Skin Care", name: "Anti-Aging Facial", duration: 75, price: 12000, description: "Peptide-rich treatment to firm and brighten.", image: "https://images.unsplash.com/photo-1552693673-1bf958298935?w=800&q=80" },

    // Manicure & Pedicure
    { category: "Manicure & Pedicure", name: "Classic Manicure", duration: 30, price: 3000, description: "Shape, cuticle care, and polish.", image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80" },
    { category: "Manicure & Pedicure", name: "Gel Manicure", duration: 45, price: 4500, description: "Long-wear gel polish with a glossy finish.", image: "https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=800&q=80" },
    { category: "Manicure & Pedicure", name: "Classic Pedicure", duration: 45, price: 4500, description: "Soak, exfoliation, shape, and polish.", image: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=800&q=80" },
    { category: "Manicure & Pedicure", name: "Deluxe Spa Pedicure", duration: 60, price: 6500, description: "Extended soak, callus treatment, and massage.", image: "https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?w=800&q=80" },

    // Makeup
    { category: "Makeup", name: "Everyday Makeup", duration: 40, price: 5500, description: "A polished, natural look for daily wear.", image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&q=80" },
    { category: "Makeup", name: "Special Occasion Makeup", duration: 60, price: 8500, description: "Long-wear glam for parties and events.", image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80" },

    // Spa / Massage
    { category: "Spa / Massage", name: "Swedish Massage (60 min)", duration: 60, price: 9000, description: "Full-body relaxation massage.", image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80" },
    { category: "Spa / Massage", name: "Deep Tissue Massage (60 min)", duration: 60, price: 10500, description: "Targeted pressure to release chronic tension.", image: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800&q=80" },
    { category: "Spa / Massage", name: "Hot Stone Massage (75 min)", duration: 75, price: 13000, description: "Heated stones combined with massage therapy.", image: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800&q=80" },

    // Bridal Packages
    { category: "Bridal Packages", name: "Bridal Hair & Makeup Trial", duration: 120, price: 22000, description: "A full run-through of your wedding-day look.", image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80" },
    { category: "Bridal Packages", name: "Wedding Day Package", duration: 180, price: 45000, description: "Hair, makeup, and touch-ups for the bride, on-site or in-studio.", image: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80" },
    { category: "Bridal Packages", name: "Bridal Party Styling (per person)", duration: 60, price: 12000, description: "Hair or makeup for bridesmaids, priced per person.", image: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&q=80" },
  ];

  const services: Record<string, string> = {};
  for (const s of serviceDefs) {
    const svc = await prisma.service.upsert({
      where: { slug: slugify(s.name) },
      update: {
        description: s.description,
        durationMins: s.duration,
        priceCents: s.price,
        imageUrl: s.image,
        categoryId: categories[s.category],
      },
      create: {
        name: s.name,
        slug: slugify(s.name),
        description: s.description,
        durationMins: s.duration,
        priceCents: s.price,
        imageUrl: s.image,
        categoryId: categories[s.category],
      },
    });
    services[s.name] = svc.id;
  }

  // ---------------------------------------------------------------------
  // Staff
  // ---------------------------------------------------------------------
  const staffDefs = [
    {
      name: "Ava Bennett",
      title: "Senior Colorist",
      bio: "Ava specializes in dimensional color — balayage, corrective color, and everything in between. 12 years behind the chair.",
      photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=80",
      services: ["All-Over Color", "Balayage", "Partial Highlights", "Root Touch-Up", "Women's Haircut", "Blowout & Style"],
    },
    {
      name: "Marcus Lee",
      title: "Master Barber",
      bio: "Marcus trained in classic barbering and modern fades alike. Fast, precise, and great with first-timers.",
      photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80",
      services: ["Men's Haircut", "Children's Haircut", "Blowout & Style"],
    },
    {
      name: "Priya Sharma",
      title: "Esthetician",
      bio: "Priya builds custom facials around your skin's actual needs, not a one-size-fits-all menu.",
      photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&q=80",
      services: ["Classic Facial", "Deep Cleansing Facial", "Anti-Aging Facial"],
    },
    {
      name: "Nadia Osei",
      title: "Nail Technician",
      bio: "Nadia's clean shaping and steady hand make her the studio's go-to for gel work and nail art.",
      photo: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80",
      services: ["Classic Manicure", "Gel Manicure", "Classic Pedicure", "Deluxe Spa Pedicure"],
    },
    {
      name: "Isabella Cruz",
      title: "Makeup Artist",
      bio: "Isabella has worked bridal parties and editorial shoots alike — she reads your face shape and event fast.",
      photo: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&q=80",
      services: ["Everyday Makeup", "Special Occasion Makeup", "Bridal Hair & Makeup Trial", "Wedding Day Package", "Bridal Party Styling (per person)"],
    },
    {
      name: "Daniel Osei",
      title: "Massage Therapist",
      bio: "Licensed massage therapist focused on tension relief for people who sit at a desk all day.",
      photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80",
      services: ["Swedish Massage (60 min)", "Deep Tissue Massage (60 min)", "Hot Stone Massage (75 min)"],
    },
    {
      name: "Sofia Marin",
      title: "Bridal Stylist",
      bio: "Sofia leads Lumière's bridal program — she'll build your whole party's day-of timeline.",
      photo: "https://images.unsplash.com/photo-1534751516642-a1af1ef26a4b?w=600&q=80",
      services: ["Bridal Hair & Makeup Trial", "Wedding Day Package", "Bridal Party Styling (per person)", "Women's Haircut"],
    },
  ];

  const staffIds: Record<string, string> = {};
  for (const s of staffDefs) {
    const staff = await prisma.staff.upsert({
      where: { slug: slugify(s.name) },
      update: { title: s.title, bio: s.bio, photoUrl: s.photo },
      create: { name: s.name, slug: slugify(s.name), title: s.title, bio: s.bio, photoUrl: s.photo },
    });
    staffIds[s.name] = staff.id;

    await prisma.staffService.deleteMany({ where: { staffId: staff.id } });
    for (const serviceName of s.services) {
      const serviceId = services[serviceName];
      if (!serviceId) continue;
      await prisma.staffService.create({ data: { staffId: staff.id, serviceId } });
    }
  }

  // ---------------------------------------------------------------------
  // Weekly schedules — everyone works Tue–Sat, 9am–5pm, with a couple of
  // staggered shifts thrown in so the availability grid isn't monotonous.
  // ---------------------------------------------------------------------
  const standardShift = { startMin: 9 * 60, endMin: 17 * 60 }; // 9:00–17:00
  const lateShift = { startMin: 11 * 60, endMin: 19 * 60 }; // 11:00–19:00
  const workDays = [2, 3, 4, 5, 6]; // Tue–Sat

  for (const [index, name] of Object.keys(staffIds).entries()) {
    const staffId = staffIds[name];
    await prisma.weeklySchedule.deleteMany({ where: { staffId } });
    const shift = index % 3 === 0 ? lateShift : standardShift;
    await prisma.weeklySchedule.createMany({
      data: workDays.map((dayOfWeek) => ({ staffId, dayOfWeek, ...shift })),
    });
  }

  // Give one stylist a day off next week to demonstrate time-off exceptions.
  const firstStaffId = Object.values(staffIds)[0];
  const nextTuesday = new Date();
  nextTuesday.setDate(nextTuesday.getDate() + ((2 + 7 - nextTuesday.getDay()) % 7 || 7));
  await prisma.timeOff.create({
    data: { staffId: firstStaffId, date: new Date(nextTuesday.toDateString()), reason: "Personal day" },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
