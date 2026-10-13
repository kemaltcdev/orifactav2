import { getDb } from "@/db";
import { inquiries } from "@/db/schema";
import { inquirySchema } from "@/lib/inquiry";
import { and, eq, gt } from "drizzle-orm";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "This request could not be verified. Please refresh the page." }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ error: "Please submit the project form." }, { status: 415 });
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > 16000) {
    return Response.json({ error: "Your message is too long." }, { status: 413 });
  }
  let payload: unknown;
  try { payload = JSON.parse(raw); }
  catch { return Response.json({ error: "Your enquiry could not be read." }, { status: 400 }); }
  const parsed = inquirySchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Please check the form." }, { status: 400 });
  }
  try {
    const db = getDb();
    const data = parsed.data;
    const now = Date.now();
    const recent = await db.select({ id: inquiries.id }).from(inquiries)
      .where(and(eq(inquiries.email, data.email.toLowerCase()), gt(inquiries.createdAt, now - 60_000))).limit(1);
    if (recent.length) {
      return Response.json({ error: "We already received a recent enquiry from this email. Please wait a minute before sending another." }, { status: 429 });
    }
    const id = crypto.randomUUID();
    await db.insert(inquiries).values({ id, name: data.name, email: data.email.toLowerCase(), company: data.company, service: data.service, budget: data.budget, message: data.message, createdAt: now });
    return Response.json({ ok: true, reference: id.slice(0, 8).toUpperCase() }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "We couldn't save your enquiry. Your message is still here — please try again." }, { status: 503 });
  }
}
