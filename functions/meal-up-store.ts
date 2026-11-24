/**
 * MealUpStore — a singleton Durable Object that holds every meal-up session
 * (a group's upcoming dinner event) in per-instance SQLite storage.
 *
 * Reached through the platform `env.DO` binding with the
 * `X-Rork-DO-Class` / `X-Rork-DO-Id` headers, like GroupStore.
 *
 * Routes (paths mirror the public API so index.ts can forward as is):
 *   GET  /meal-ups              — every meal up (client filters by date/distance)
 *   GET  /meal-ups/:id          — one meal up with its attendees
 *   POST /meal-ups              — create (body: organizer, title, when, venue with lat/lng, prices, group)
 *   POST /meal-ups/:id/join     — body: { userId }
 *   DELETE /meal-ups/:id        — body: { userId } (organizer only)
 */

import { DurableObject } from "cloudflare:workers";

import { CORS_HEADERS } from "./group-store";

type Env = {
  STRIPE_SECRET_KEY: string;
};

export class MealUpStore extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS meal_ups (
        id TEXT PRIMARY KEY,
        organizer_id TEXT NOT NULL,
        organizer_name TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        date INTEGER NOT NULL,
        time_label TEXT NOT NULL DEFAULT '',
        venue_name TEXT NOT NULL,
        venue_address TEXT NOT NULL DEFAULT '',
        venue_country TEXT,
        venue_cuisine TEXT NOT NULL DEFAULT '',
        venue_lat REAL,
        venue_lng REAL,
        max_attendees INTEGER NOT NULL DEFAULT 0,
        male_price REAL,
        female_price REAL,
        image_url TEXT NOT NULL DEFAULT '',
        group_id TEXT,
        group_name TEXT,
        group_is_paid INTEGER NOT NULL DEFAULT 0,
        group_member_discount TEXT,
        created_at INTEGER NOT NULL
      )
    `);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS meal_up_attendees (
        meal_up_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        joined_at INTEGER NOT NULL,
        PRIMARY KEY (meal_up_id, user_id)
      )
    `);
    this.ctx.storage.sql.exec(
      "CREATE INDEX IF NOT EXISTS idx_attendees_meal ON meal_up_attendees (meal_up_id)",
    );
  }

  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    try {
      if (request.method === "GET" && path === "/meal-ups") {
        return this.listMealUps();
      }

      if (request.method === "POST" && path === "/meal-ups") {
        return this.createMealUp(request);
      }

      if (request.method === "POST" && /^\/meal-ups\/[^/]+\/join$/.test(path)) {
        const id = decodeURIComponent(path.split("/")[2]);
        return this.joinMealUp(id, request);
      }

      if (request.method === "DELETE" && /^\/meal-ups\/[^/]+$/.test(path)) {
        const id = decodeURIComponent(path.split("/")[2]);
        return this.deleteMealUp(id, request);
      }

      if (request.method === "GET" && /^\/meal-ups\/[^/]+$/.test(path)) {
        const id = decodeURIComponent(path.split("/")[2]);
        return this.getMealUp(id);
      }

      return notFound();
    } catch (e) {
      console.error("MealUpStore error:", e);
      return Response.json(
        { error: e instanceof Error ? e.message : "Internal error" },
        { status: 500, headers: CORS_HEADERS },
      );
    }
  }

  private listMealUps(): Response {
    const rows = this.ctx.storage.sql
      .exec<Record<string, unknown>>(
        `SELECT m.*,
           (SELECT COUNT(*) FROM meal_up_attendees a WHERE a.meal_up_id = m.id) AS attendee_count,
           (SELECT GROUP_CONCAT(a.user_id) FROM meal_up_attendees a WHERE a.meal_up_id = m.id) AS attendee_ids
         FROM meal_ups m ORDER BY m.date ASC`,
      )
      .toArray();
    return Response.json(
      { mealUps: rows.map(mealUpFromRow) },
      { headers: CORS_HEADERS },
    );
  }

  private getMealUp(id: string): Response {
    const row = this.getMealUpRow(id);
    if (!row) return notFound();
    return Response.json({ mealUp: mealUpFromRow(row) }, { headers: CORS_HEADERS });
  }

  private getMealUpRow(id: string): Record<string, unknown> | undefined {
    return this.ctx.storage.sql
      .exec<Record<string, unknown>>(
        `SELECT m.*,
           (SELECT COUNT(*) FROM meal_up_attendees a WHERE a.meal_up_id = m.id) AS attendee_count,
           (SELECT GROUP_CONCAT(a.user_id) FROM meal_up_attendees a WHERE a.meal_up_id = m.id) AS attendee_ids
         FROM meal_ups m WHERE m.id = ?`,
        id,
      )
      .toArray()[0];
  }

  private async createMealUp(request: Request): Promise<Response> {
    const body = (await request.json()) as {
      organizer?: { id: string; name: string };
      title?: string;
      description?: string;
      date?: number; // epoch ms
      timeLabel?: string;
      venue?: {
        name: string;
        address?: string;
        country?: string;
        cuisine?: string;
        lat?: number;
        lng?: number;
      };
      maxAttendees?: number;
      malePrice?: number;
      femalePrice?: number;
      imageUrl?: string;
      group?: { id: string; name: string; isPaid?: boolean; memberDiscount?: string };
    };

    if (!body.organizer?.id || !body.organizer?.name || !body.title || !body.date ||
        !body.venue?.name) {
      return Response.json(
        { error: "organizer, title, date and venue.name are required" },
        { status: 400, headers: CORS_HEADERS },
      );
    }
    if (body.title.length > 120 || (body.description ?? "").length > 2000) {
      return Response.json(
        { error: "A field exceeds its length limit" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const id = crypto.randomUUID();
    this.ctx.storage.sql.exec(
      `INSERT INTO meal_ups (id, organizer_id, organizer_name, title, description, date, time_label,
         venue_name, venue_address, venue_country, venue_cuisine, venue_lat, venue_lng,
         max_attendees, male_price, female_price, image_url, group_id, group_name,
         group_is_paid, group_member_discount, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      body.organizer.id,
      body.organizer.name,
      body.title,
      body.description ?? "",
      body.date,
      body.timeLabel ?? "",
      body.venue.name,
      body.venue.address ?? "",
      body.venue.country ?? null,
      body.venue.cuisine ?? "",
      typeof body.venue.lat === "number" ? body.venue.lat : null,
      typeof body.venue.lng === "number" ? body.venue.lng : null,
      typeof body.maxAttendees === "number" && body.maxAttendees > 0 ? body.maxAttendees : 0,
      typeof body.malePrice === "number" && body.malePrice >= 0 ? body.malePrice : null,
      typeof body.femalePrice === "number" && body.femalePrice >= 0 ? body.femalePrice : null,
      typeof body.imageUrl === "string" ? body.imageUrl : "",
      body.group?.id ?? null,
      body.group?.name ?? null,
      body.group?.isPaid ? 1 : 0,
      body.group?.memberDiscount ?? null,
      Date.now(),
    );
    // The organizer is going.
    this.ctx.storage.sql.exec(
      "INSERT INTO meal_up_attendees (meal_up_id, user_id, joined_at) VALUES (?, ?, ?)",
      id,
      body.organizer.id,
      Date.now(),
    );

    return this.getMealUp(id);
  }

  private async joinMealUp(id: string, request: Request): Promise<Response> {
    const body = (await request.json()) as { userId?: string };
    const userId = (body.userId ?? "").trim();
    if (!userId) {
      return Response.json({ error: "userId is required" }, { status: 400, headers: CORS_HEADERS });
    }
    const row = this.getMealUpRow(id);
    if (!row) return notFound();
    const max = Number(row.max_attendees ?? 0);
    const count = Number(row.attendee_count ?? 0);
    if (max > 0 && count >= max) {
      return Response.json(
        { error: "This meal up is full" },
        { status: 409, headers: CORS_HEADERS },
      );
    }
    this.ctx.storage.sql.exec(
      "INSERT OR IGNORE INTO meal_up_attendees (meal_up_id, user_id, joined_at) VALUES (?, ?, ?)",
      id,
      userId,
      Date.now(),
    );
    return this.getMealUp(id);
  }

  private async deleteMealUp(id: string, request: Request): Promise<Response> {
    const body = (await request.json()) as { userId?: string };
    const row = this.ctx.storage.sql
      .exec<Record<string, unknown>>("SELECT organizer_id FROM meal_ups WHERE id = ?", id)
      .toArray()[0];
    if (!row) return notFound();
    if (row.organizer_id !== body.userId) {
      return Response.json(
        { error: "Only the organizer can delete this meal up" },
        { status: 403, headers: CORS_HEADERS },
      );
    }
    this.ctx.storage.sql.exec("DELETE FROM meal_up_attendees WHERE meal_up_id = ?", id);
    this.ctx.storage.sql.exec("DELETE FROM meal_ups WHERE id = ?", id);
    return Response.json({ ok: true }, { headers: CORS_HEADERS });
  }
}

function notFound(): Response {
  return Response.json({ error: "not found" }, { status: 404, headers: CORS_HEADERS });
}

function mealUpFromRow(row: Record<string, unknown>) {
  const attendeeIds = row.attendee_ids
    ? String(row.attendee_ids).split(",").filter(Boolean)
    : [];
  const malePrice = row.male_price == null ? undefined : Number(row.male_price);
  const femalePrice = row.female_price == null ? undefined : Number(row.female_price);
  return {
    id: row.id as string,
    organizerId: row.organizer_id as string,
    organizerName: row.organizer_name as string,
    title: row.title as string,
    description: row.description as string,
    date: new Date(Number(row.date)).toISOString(),
    timeLabel: row.time_label as string,
    venue: {
      name: row.venue_name as string,
      address: (row.venue_address as string) || "",
      country: (row.venue_country as string) || undefined,
      cuisine: (row.venue_cuisine as string) || "",
      lat: row.venue_lat == null ? undefined : Number(row.venue_lat),
      lng: row.venue_lng == null ? undefined : Number(row.venue_lng),
    },
    maxAttendees: Number(row.max_attendees ?? 0),
    currentAttendees: attendeeIds,
    malePrice,
    femalePrice,
    imageUrl: (row.image_url as string) || "",
    group: row.group_id
      ? {
          id: row.group_id as string,
          name: (row.group_name as string) || "",
          isPaid: Number(row.group_is_paid) === 1,
          memberDiscount: (row.group_member_discount as string) || undefined,
        }
      : undefined,
    createdAt: new Date(Number(row.created_at)).toISOString(),
  };
}
