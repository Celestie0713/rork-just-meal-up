/**
 * GroupStore — a singleton Durable Object that holds every group, its
 * members and its posts in per-instance SQLite storage.
 *
 * The legacy `functions/` backend cannot declare DO bindings in a wrangler
 * config: it reaches this class through the platform `env.DO` binding with
 * the `X-Rork-DO-Class` / `X-Rork-DO-Id` headers (see index.ts). The
 * instance name is always "global" — one directory for the whole app.
 *
 * Routes (paths mirror the public API so index.ts can forward as is):
 *   GET  /groups                — list every group (newest first)
 *   GET  /groups/:id            — one group with its posts
 *   POST /groups                — create a group (body: group fields + user)
 *   POST /groups/:id/join       — body: { userId }
 *   POST /groups/:id/leave      — body: { userId }
 *   DELETE /groups/:id          — body: { userId } (host only)
 */

import { DurableObject } from "cloudflare:workers";

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
} as const;

type Env = {
  STRIPE_SECRET_KEY: string;
};

interface CreateGroupBody {
  name: string;
  description: string;
  location: string;
  imageUrl?: string;
  isPaid?: boolean;
  monthlyFee?: number;
  memberDiscount?: string;
  user: { id: string; name: string; avatar?: string };
}

export class GroupStore extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        image_url TEXT NOT NULL DEFAULT '',
        is_paid INTEGER NOT NULL DEFAULT 0,
        monthly_fee REAL,
        member_discount TEXT,
        description TEXT NOT NULL DEFAULT '',
        upcoming_meal_ups TEXT NOT NULL DEFAULT '[]',
        host_user_id TEXT NOT NULL,
        host_name TEXT NOT NULL,
        host_avatar TEXT NOT NULL DEFAULT '',
        created_at INTEGER NOT NULL
      )
    `);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS group_members (
        group_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        joined_at INTEGER NOT NULL,
        PRIMARY KEY (group_id, user_id)
      )
    `);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS group_posts (
        id TEXT PRIMARY KEY,
        group_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        user_image TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL,
        image_url TEXT,
        created_at INTEGER NOT NULL,
        likes INTEGER NOT NULL DEFAULT 0
      )
    `);
    this.ctx.storage.sql.exec(
      "CREATE INDEX IF NOT EXISTS idx_posts_group ON group_posts (group_id, created_at)",
    );
  }

  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    try {
      if (request.method === "GET" && path === "/groups") {
        return this.listGroups();
      }
      if (request.method === "GET" && path.startsWith("/groups/")) {
        const groupId = decodeURIComponent(path.slice("/groups/".length));
        const [id, action] = splitLastSegment(groupId);
        if (action === null) return this.getGroup(id);
        if (action === "join" && request.method === "GET") {
          // GET is not valid for join — fall through to 404 below.
          return notFound();
        }
        return notFound();
      }

      if (request.method === "POST" && path === "/groups") {
        return this.createGroup(request);
      }
      if (request.method === "POST" && /^\/groups\/[^/]+\/join$/.test(path)) {
        const groupId = decodeURIComponent(path.split("/")[2]);
        return this.joinGroup(groupId, request);
      }
      if (request.method === "POST" && /^\/groups\/[^/]+\/leave$/.test(path)) {
        const groupId = decodeURIComponent(path.split("/")[2]);
        return this.leaveGroup(groupId, request);
      }
      if (request.method === "POST" && /^\/groups\/[^/]+\/posts$/.test(path)) {
        const groupId = decodeURIComponent(path.split("/")[2]);
        return this.createPost(groupId, request);
      }
      if (request.method === "DELETE" && /^\/groups\/[^/]+$/.test(path)) {
        const groupId = decodeURIComponent(path.split("/")[2]);
        return this.deleteGroup(groupId, request);
      }

      return notFound();
    } catch (e) {
      console.error("GroupStore error:", e);
      return Response.json(
        { error: e instanceof Error ? e.message : "Internal error" },
        { status: 500, headers: CORS_HEADERS },
      );
    }
  }

  private listGroups(): Response {
    const groups = this.ctx.storage.sql
      .exec<Record<string, unknown>>(
        `SELECT g.*, (SELECT COUNT(*) FROM group_members m WHERE m.group_id = g.id) AS member_count
         FROM groups g ORDER BY g.created_at DESC`,
      )
      .toArray()
      .map((row) => groupFromRow(row));
    return Response.json({ groups }, { headers: CORS_HEADERS });
  }

  private getGroup(groupId: string): Response {
    const row = this.ctx.storage.sql
      .exec<Record<string, unknown>>(
        `SELECT g.*, (SELECT COUNT(*) FROM group_members m WHERE m.group_id = g.id) AS member_count
         FROM groups g WHERE g.id = ?`,
        groupId,
      )
      .toArray()[0];
    if (!row) return notFound();

    const posts = this.ctx.storage.sql
      .exec<Record<string, unknown>>(
        "SELECT * FROM group_posts WHERE group_id = ? ORDER BY created_at DESC",
        groupId,
      )
      .toArray()
      .map(postFromRow);
    return Response.json(
      { group: { ...groupFromRow(row), posts } },
      { headers: CORS_HEADERS },
    );
  }

  private async createGroup(request: Request): Promise<Response> {
    const body = (await request.json()) as CreateGroupBody;
    const name = (body.name ?? "").trim();
    const description = (body.description ?? "").trim();
    const location = (body.location ?? "").trim();
    const host = body.user;
    if (!name || !description || !location || !host?.id || !host?.name) {
      return Response.json(
        { error: "name, description, location and user (id, name) are required" },
        { status: 400, headers: CORS_HEADERS },
      );
    }
    if (name.length > 80 || description.length > 2000 || location.length > 120) {
      return Response.json(
        { error: "A field exceeds its length limit" },
        { status: 400, headers: CORS_HEADERS },
      );
    }
    const isPaid = body.isPaid === true;
    const monthlyFee = isPaid && typeof body.monthlyFee === "number" && body.monthlyFee > 0
      ? body.monthlyFee
      : undefined;

    const id = crypto.randomUUID();
    const now = Date.now();
    this.ctx.storage.sql.exec(
      `INSERT INTO groups (id, name, location, image_url, is_paid, monthly_fee, member_discount,
        description, upcoming_meal_ups, host_user_id, host_name, host_avatar, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      name,
      location,
      typeof body.imageUrl === "string" ? body.imageUrl : "",
      isPaid ? 1 : 0,
      monthlyFee ?? null,
      isPaid ? (body.memberDiscount ?? null) : null,
      description,
      "[]",
      host.id,
      host.name,
      typeof host.avatar === "string" ? host.avatar : "",
      now,
    );
    // The host is the group's first member.
    this.ctx.storage.sql.exec(
      "INSERT INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, ?)",
      id,
      host.id,
      now,
    );

    return this.getGroup(id);
  }

  private async joinGroup(groupId: string, request: Request): Promise<Response> {
    const body = (await request.json()) as { userId?: string };
    const userId = (body.userId ?? "").trim();
    if (!userId) {
      return Response.json({ error: "userId is required" }, { status: 400, headers: CORS_HEADERS });
    }
    const exists = this.groupExists(groupId);
    if (!exists) return notFound();
    this.ctx.storage.sql.exec(
      "INSERT OR IGNORE INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, ?)",
      groupId,
      userId,
      Date.now(),
    );
    return this.getGroup(groupId);
  }

  private async leaveGroup(groupId: string, request: Request): Promise<Response> {
    const body = (await request.json()) as { userId?: string };
    const userId = (body.userId ?? "").trim();
    if (!userId) {
      return Response.json({ error: "userId is required" }, { status: 400, headers: CORS_HEADERS });
    }
    this.ctx.storage.sql.exec(
      "DELETE FROM group_members WHERE group_id = ? AND user_id = ?",
      groupId,
      userId,
    );
    return this.getGroup(groupId);
  }

  private async createPost(groupId: string, request: Request): Promise<Response> {
    const body = (await request.json()) as {
      userId?: string;
      userName?: string;
      userImage?: string;
      content?: string;
      imageUrl?: string;
    };
    const content = (body.content ?? "").trim();
    if (!body.userId || !body.userName || !content) {
      return Response.json(
        { error: "userId, userName and content are required" },
        { status: 400, headers: CORS_HEADERS },
      );
    }
    if (!this.groupExists(groupId)) return notFound();
    this.ctx.storage.sql.exec(
      `INSERT INTO group_posts (id, group_id, user_id, user_name, user_image, content, image_url, created_at, likes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      crypto.randomUUID(),
      groupId,
      body.userId,
      body.userName,
      typeof body.userImage === "string" ? body.userImage : "",
      content.slice(0, 2000),
      typeof body.imageUrl === "string" ? body.imageUrl : null,
      Date.now(),
    );
    return this.getGroup(groupId);
  }

  private async deleteGroup(groupId: string, request: Request): Promise<Response> {
    const body = (await request.json()) as { userId?: string };
    const row = this.ctx.storage.sql
      .exec<Record<string, unknown>>("SELECT host_user_id FROM groups WHERE id = ?", groupId)
      .toArray()[0];
    if (!row) return notFound();
    if (row.host_user_id !== body.userId) {
      return Response.json(
        { error: "Only the host can delete this group" },
        { status: 403, headers: CORS_HEADERS },
      );
    }
    this.ctx.storage.sql.exec("DELETE FROM group_posts WHERE group_id = ?", groupId);
    this.ctx.storage.sql.exec("DELETE FROM group_members WHERE group_id = ?", groupId);
    this.ctx.storage.sql.exec("DELETE FROM groups WHERE id = ?", groupId);
    return Response.json({ ok: true }, { headers: CORS_HEADERS });
  }

  private groupExists(groupId: string): boolean {
    return (
      this.ctx.storage.sql
        .exec<{ n: number }>("SELECT COUNT(*) AS n FROM groups WHERE id = ?", groupId)
        .toArray()[0]?.n > 0
    );
  }
}

function notFound(): Response {
  return Response.json({ error: "not found" }, { status: 404, headers: CORS_HEADERS });
}

/** Splits "join" off "/groups/<id>/join" style tails passed through the DO route. */
function splitLastSegment(segment: string): [string, string | null] {
  const parts = segment.split("/");
  if (parts.length === 1) return [parts[0], null];
  return [parts[0], parts[1]];
}

function groupFromRow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    name: row.name as string,
    memberCount: Number(row.member_count ?? 0),
    imageUrl: (row.image_url as string) || "",
    isPaid: Number(row.is_paid) === 1,
    monthlyFee: row.monthly_fee == null ? undefined : Number(row.monthly_fee),
    memberDiscount: (row.member_discount as string) || undefined,
    location: row.location as string,
    description: row.description as string,
    posts: [] as unknown[],
    upcomingMealUps: JSON.parse((row.upcoming_meal_ups as string) || "[]") as string[],
    hostedBy: {
      userId: row.host_user_id as string,
      name: row.host_name as string,
      avatar: (row.host_avatar as string) || "",
    },
  };
}

function postFromRow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    userName: row.user_name as string,
    userImage: (row.user_image as string) || "",
    content: row.content as string,
    imageUrl: (row.image_url as string) || undefined,
    timestamp: new Date(Number(row.created_at)).toISOString(),
    likes: Number(row.likes ?? 0),
  };
}
