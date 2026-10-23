/**
 * Mock API adapter. Mirrors the /api/v1 REST contract in memory so the UI can be
 * previewed without a backend. All authorization rules the real backend must
 * enforce are re-implemented here so the UI is exercised against the same rules.
 * Data lives only in this browser tab's memory and resets on reload.
 */
import { seed, type Db, type DbGig, type DbUser } from "./fixtures";
import { ApiError } from "@/lib/api/errors";
import type { Agreement, Application, Gig, Me, PublicUser, Review } from "@/types";

let db: Db = seed();
/** Simulates the server-side session cookie. Never written to storage. */
let sessionUserId: string | null = null;
let seq = 100;
const id = (p: string) => `${p}${++seq}`;
const nowIso = () => new Date().toISOString();

export function resetMockDb() {
  db = seed();
  sessionUserId = null;
}

// ---------- helpers ----------
function me(): DbUser | null {
  return sessionUserId ? (db.users.find((u) => u.id === sessionUserId) ?? null) : null;
}
function requireUser(): DbUser {
  const u = me();
  if (!u) throw new ApiError(401, "UNAUTHENTICATED", "Please sign in to continue.");
  if (u.suspended) throw new ApiError(403, "SUSPENDED", "Your account is suspended.");
  return u;
}
function requireAdmin(): DbUser {
  const u = requireUser();
  if (!u.isAdmin) throw new ApiError(403, "FORBIDDEN", "Administrator access required.");
  return u;
}
const notFound = (what: string) => new ApiError(404, "NOT_FOUND", `${what} not found.`);

function publicUser(u: DbUser): PublicUser {
  const reviews = db.reviews.filter((r) => r.revieweeId === u.id);
  const completed = db.agreements.filter(
    (a) => a.status === "completed" && (a.workerId === u.id || a.employerId === u.id),
  ).length;
  return {
    id: u.id,
    name: u.name,
    bio: u.bio,
    city: u.city,
    area: u.area,
    skills: u.skills,
    rating: reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null,
    reviewCount: reviews.length,
    completedGigs: completed,
    memberSince: u.createdAt,
  };
}
function meDto(u: DbUser): Me {
  return {
    ...publicUser(u),
    email: u.email,
    phone: u.phone,
    isAdmin: u.isAdmin,
    profileComplete: Boolean(u.bio && u.city && u.area),
  };
}
const userById = (uid: string) => db.users.find((u) => u.id === uid)!;

/** Builds the public gig payload. The street/complement fields are never copied. */
function gigDto(g: DbGig, viewer: DbUser | null): Gig {
  const isOwner = viewer?.id === g.employerId;
  const myApp = viewer
    ? db.applications.find((a) => a.gigId === g.id && a.workerId === viewer.id)
    : undefined;
  const agreement = db.agreements.find((a) => a.gigId === g.id);
  const isParticipant = agreement && viewer && (agreement.employerId === viewer.id || agreement.workerId === viewer.id);
  return {
    id: g.id,
    title: g.title,
    description: g.description,
    category: g.category,
    type: g.type,
    price: g.price,
    durationHours: g.durationHours,
    startsAt: g.startsAt,
    city: g.city,
    area: g.area,
    status: g.status,
    createdAt: g.createdAt,
    employer: publicUser(userById(g.employerId)),
    isOwner,
    ...(isOwner ? { applicationCount: db.applications.filter((a) => a.gigId === g.id && a.status !== "withdrawn").length } : {}),
    ...(myApp ? { myApplication: { id: myApp.id, status: myApp.status } } : {}),
    ...(isParticipant ? { agreementId: agreement!.id } : {}),
  };
}

function agreementDto(agId: string, viewer: DbUser): Agreement {
  const a = db.agreements.find((x) => x.id === agId);
  if (!a) throw notFound("Agreement");
  if (a.employerId !== viewer.id && a.workerId !== viewer.id) throw notFound("Agreement");
  const conv = db.conversations.find((c) => c.agreementId === a.id)!;
  return {
    id: a.id,
    gigId: a.gigId,
    title: a.title,
    price: a.price,
    startsAt: a.startsAt,
    durationHours: a.durationHours,
    status: a.status,
    employer: publicUser(userById(a.employerId)),
    worker: publicUser(userById(a.workerId)),
    employerConfirmed: a.employerConfirmed,
    workerConfirmed: a.workerConfirmed,
    createdAt: a.createdAt,
    conversationId: conv.id,
    myRole: a.employerId === viewer.id ? "employer" : "worker",
    myReviewSubmitted: db.reviews.some((r) => r.agreementId === a.id && r.reviewerId === viewer.id),
  };
}

function reviewDto(r: Db["reviews"][number]): Review {
  const reviewer = userById(r.reviewerId);
  const ag = db.agreements.find((a) => a.id === r.agreementId)!;
  return {
    id: r.id,
    agreementId: r.agreementId,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
    reviewer: { id: reviewer.id, name: reviewer.name },
    gigTitle: ag.title,
  };
}

function notify(userId: string, type: string, title: string, body: string, link?: string) {
  db.notifications.unshift({ id: id("n"), userId, type, title, body, link, read: false, createdAt: nowIso() });
}

function isVisible(g: DbGig, viewer: DbUser | null) {
  if (g.employerId === viewer?.id) return true;
  return !g.hidden && g.status !== "draft";
}

// ---------- validation helpers ----------
function str(v: unknown, field: string, min = 1, max = 5000): string {
  if (typeof v !== "string" || v.trim().length < min || v.length > max)
    throw new ApiError(422, "VALIDATION", `Invalid ${field}.`);
  return v.trim();
}
function num(v: unknown, field: string, min: number, max: number): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) throw new ApiError(422, "VALIDATION", `Invalid ${field}.`);
  return n;
}

// ---------- routes ----------
type Body = Record<string, unknown>;
type Handler = (p: Record<string, string>, q: URLSearchParams, b: Body) => unknown;
const routes: Array<[string, RegExp, Handler]> = [];
const on = (method: string, path: string, h: Handler) => {
  const re = new RegExp("^" + path.replace(/:(\w+)/g, "(?<$1>[^/]+)") + "$");
  routes.push([method, re, h]);
};

// Auth
on("POST", "/auth/register", (_p, _q, b) => {
  const email = str(b.email, "email").toLowerCase();
  if (db.users.some((u) => u.email === email)) throw new ApiError(409, "EMAIL_TAKEN", "An account with this email already exists.");
  const u: DbUser = {
    id: id("u"),
    name: str(b.name, "name", 2, 80),
    email,
    password: str(b.password, "password", 8, 128),
    bio: "",
    city: "",
    area: "",
    skills: [],
    isAdmin: false, // never taken from the payload
    suspended: false,
    createdAt: nowIso(),
  };
  db.users.push(u);
  sessionUserId = u.id;
  return meDto(u);
});
on("POST", "/auth/login", (_p, _q, b) => {
  const u = db.users.find((x) => x.email === String(b.email ?? "").toLowerCase());
  if (!u || u.password !== b.password) throw new ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  if (u.suspended) throw new ApiError(403, "SUSPENDED", "This account is suspended.");
  sessionUserId = u.id;
  return meDto(u);
});
on("POST", "/auth/logout", () => {
  sessionUserId = null;
  return { ok: true };
});
on("GET", "/auth/me", () => meDto(requireUser()));
on("POST", "/auth/forgot-password", () => ({ ok: true }));

// Users
on("GET", "/users/:userId", (p) => {
  const u = db.users.find((x) => x.id === p.userId);
  if (!u) throw notFound("User");
  const reviews = db.reviews.filter((r) => r.revieweeId === u.id).map(reviewDto);
  return { user: publicUser(u), reviews };
});
on("PATCH", "/users/me", (_p, _q, b) => {
  const u = requireUser();
  if (b.name !== undefined) u.name = str(b.name, "name", 2, 80);
  if (b.bio !== undefined) u.bio = String(b.bio).slice(0, 500);
  if (b.city !== undefined) u.city = String(b.city).slice(0, 80);
  if (b.area !== undefined) u.area = String(b.area).slice(0, 80);
  if (Array.isArray(b.skills)) u.skills = b.skills.map(String).slice(0, 15);
  if (b.phone !== undefined) u.phone = String(b.phone).slice(0, 30) || undefined;
  // isAdmin / email / suspended are intentionally ignored.
  return meDto(u);
});

// Gigs
on("GET", "/gigs", (_p, q) => {
  const viewer = me();
  const text = (q.get("q") ?? "").toLowerCase();
  const cat = q.get("category");
  const city = (q.get("city") ?? "").toLowerCase();
  const minP = q.get("minPrice") ? Number(q.get("minPrice")) : null;
  const maxP = q.get("maxPrice") ? Number(q.get("maxPrice")) : null;
  const posted = q.get("posted");
  const cutoff = posted === "24h" ? 24 : posted === "7d" ? 168 : posted === "30d" ? 720 : null;
  const page = Math.max(1, Number(q.get("page") ?? 1));
  const pageSize = 6;
  let list = db.gigs.filter((g) => !g.hidden && g.status === "open");
  if (text) list = list.filter((g) => (g.title + " " + g.description).toLowerCase().includes(text));
  if (cat) list = list.filter((g) => g.category === cat);
  if (city) list = list.filter((g) => (g.city + " " + g.area).toLowerCase().includes(city));
  if (minP !== null) list = list.filter((g) => g.price >= minP);
  if (maxP !== null) list = list.filter((g) => g.price <= maxP);
  if (cutoff) list = list.filter((g) => Date.now() - new Date(g.createdAt).getTime() <= cutoff * 3600_000);
  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return {
    items: list.slice((page - 1) * pageSize, page * pageSize).map((g) => gigDto(g, viewer)),
    page,
    pageSize,
    total: list.length,
  };
});
on("GET", "/gigs/mine", () => {
  const u = requireUser();
  return db.gigs
    .filter((g) => g.employerId === u.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((g) => gigDto(g, u));
});
on("GET", "/gigs/:gigId", (p) => {
  const viewer = me();
  const g = db.gigs.find((x) => x.id === p.gigId);
  if (!g || !isVisible(g, viewer)) throw notFound("Gig");
  return gigDto(g, viewer);
});
on("GET", "/gigs/:gigId/private", (p) => {
  // Owner-only editing payload (includes the address they entered).
  const u = requireUser();
  const g = db.gigs.find((x) => x.id === p.gigId);
  if (!g || g.employerId !== u.id) throw notFound("Gig");
  return { ...gigDto(g, u), street: g.street, complement: g.complement };
});
function readGigInput(b: Body) {
  return {
    title: str(b.title, "title", 5, 100),
    description: str(b.description, "description", 20, 2000),
    category: str(b.category, "category") as DbGig["category"],
    type: (b.type === "business" ? "business" : "personal") as DbGig["type"],
    price: num(b.price, "price", 5, 2000),
    durationHours: num(b.durationHours, "duration", 0.5, 12),
    startsAt: str(b.startsAt, "start time"),
    city: str(b.city, "city", 2, 80),
    area: str(b.area, "area", 2, 80),
    street: str(b.street, "street address", 3, 200),
    complement: typeof b.complement === "string" ? b.complement.slice(0, 300) : undefined,
  };
}
on("POST", "/gigs", (_p, _q, b) => {
  const u = requireUser();
  const g: DbGig = { id: id("g"), employerId: u.id, ...readGigInput(b), status: b.publish ? "open" : "draft", hidden: false, createdAt: nowIso() };
  db.gigs.push(g);
  return gigDto(g, u);
});
on("PATCH", "/gigs/:gigId", (p, _q, b) => {
  const u = requireUser();
  const g = db.gigs.find((x) => x.id === p.gigId);
  if (!g || g.employerId !== u.id) throw notFound("Gig");
  if (g.status !== "draft" && g.status !== "open")
    throw new ApiError(409, "INVALID_STATE", "This gig can no longer be edited because a worker has been selected.");
  Object.assign(g, readGigInput(b));
  if (b.publish && g.status === "draft") g.status = "open";
  return gigDto(g, u);
});
on("POST", "/gigs/:gigId/cancel", (p) => {
  const u = requireUser();
  const g = db.gigs.find((x) => x.id === p.gigId);
  if (!g || g.employerId !== u.id) throw notFound("Gig");
  if (g.status !== "draft" && g.status !== "open")
    throw new ApiError(409, "INVALID_STATE", "Gigs with an active agreement can't be canceled here. Message the worker or report a problem.");
  g.status = "canceled";
  db.applications
    .filter((a) => a.gigId === g.id && a.status === "pending")
    .forEach((a) => {
      a.status = "rejected";
      notify(a.workerId, "canceled", "Gig canceled", `“${g.title}” was canceled by the employer.`, `/gigs/${g.id}`);
    });
  return gigDto(g, u);
});

// Applications
on("POST", "/gigs/:gigId/applications", (p, _q, b) => {
  const u = requireUser();
  const g = db.gigs.find((x) => x.id === p.gigId);
  if (!g || !isVisible(g, u)) throw notFound("Gig");
  if (g.employerId === u.id) throw new ApiError(403, "FORBIDDEN", "You can't apply to your own gig.");
  if (g.status !== "open") throw new ApiError(409, "GIG_CLOSED", "This gig is no longer accepting applications.");
  const existing = db.applications.find((a) => a.gigId === g.id && a.workerId === u.id);
  if (existing && existing.status !== "withdrawn") throw new ApiError(409, "ALREADY_APPLIED", "You've already applied to this gig.");
  const message = typeof b.message === "string" ? b.message.slice(0, 500) : undefined;
  if (existing) {
    existing.status = "pending";
    existing.message = message;
    existing.createdAt = nowIso();
  } else {
    db.applications.push({ id: id("a"), gigId: g.id, workerId: u.id, message, status: "pending", createdAt: nowIso() });
  }
  notify(g.employerId, "application", "New application", `${u.name} applied to “${g.title}”.`, `/my-gigs/${g.id}/applications`);
  return gigDto(g, u);
});
on("GET", "/gigs/:gigId/applications", (p) => {
  const u = requireUser();
  const g = db.gigs.find((x) => x.id === p.gigId);
  if (!g || g.employerId !== u.id) throw notFound("Gig");
  return {
    gig: gigDto(g, u),
    applications: db.applications
      .filter((a) => a.gigId === g.id && a.status !== "withdrawn")
      .map<Application>((a) => ({ id: a.id, gigId: a.gigId, status: a.status, message: a.message, createdAt: a.createdAt, worker: publicUser(userById(a.workerId)) })),
  };
});
on("GET", "/applications/me", () => {
  const u = requireUser();
  return db.applications
    .filter((a) => a.workerId === u.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((a) => ({ id: a.id, status: a.status, message: a.message, createdAt: a.createdAt, gig: gigDto(db.gigs.find((g) => g.id === a.gigId)!, u) }));
});
on("POST", "/applications/:applicationId/withdraw", (p) => {
  const u = requireUser();
  const a = db.applications.find((x) => x.id === p.applicationId);
  if (!a || a.workerId !== u.id) throw notFound("Application");
  if (a.status !== "pending") throw new ApiError(409, "INVALID_STATE", "Only pending applications can be withdrawn.");
  a.status = "withdrawn";
  return { ok: true };
});
/** Atomic in the mock because JS runs this synchronously; the real backend must use a DB transaction. */
on("POST", "/gigs/:gigId/select-worker", (p, _q, b) => {
  const u = requireUser();
  const g = db.gigs.find((x) => x.id === p.gigId);
  if (!g || g.employerId !== u.id) throw notFound("Gig");
  if (g.status !== "open" || db.agreements.some((ag) => ag.gigId === g.id))
    throw new ApiError(409, "ALREADY_SELECTED", "A worker has already been selected for this gig.");
  const app = db.applications.find((a) => a.id === b.applicationId && a.gigId === g.id);
  if (!app || app.status !== "pending") throw new ApiError(409, "NOT_ELIGIBLE", "This applicant is no longer eligible.");
  if (app.workerId === u.id) throw new ApiError(403, "FORBIDDEN", "You can't select yourself.");
  const ag = {
    id: id("ag"), gigId: g.id, employerId: u.id, workerId: app.workerId, title: g.title, price: g.price,
    startsAt: g.startsAt, durationHours: g.durationHours, status: "assigned" as const,
    employerConfirmed: false, workerConfirmed: false, createdAt: nowIso(),
  };
  db.agreements.push(ag);
  db.conversations.push({ id: id("c"), gigId: g.id, agreementId: ag.id, participantIds: [u.id, app.workerId] });
  app.status = "accepted";
  db.applications
    .filter((a) => a.gigId === g.id && a.id !== app.id && a.status === "pending")
    .forEach((a) => {
      a.status = "rejected";
      notify(a.workerId, "rejected", "Application closed", `Another worker was selected for “${g.title}”.`, `/my-applications`);
    });
  g.status = "assigned";
  notify(app.workerId, "accepted", "You were selected", `${u.name} selected you for “${g.title}”.`, `/agreements/${ag.id}`);
  return agreementDto(ag.id, u);
});

// Agreements
on("GET", "/agreements/:agreementId", (p) => agreementDto(p.agreementId, requireUser()));
on("GET", "/agreements/:agreementId/address", (p) => {
  const u = requireUser();
  const a = db.agreements.find((x) => x.id === p.agreementId);
  // Authorization is based on the caller's identity, not possession of the ID.
  if (!a || (a.employerId !== u.id && a.workerId !== u.id)) throw notFound("Agreement");
  const g = db.gigs.find((x) => x.id === a.gigId)!;
  return { street: g.street, complement: g.complement, city: g.city, area: g.area };
});
on("POST", "/agreements/:agreementId/start", (p) => {
  const u = requireUser();
  const dto = agreementDto(p.agreementId, u);
  const a = db.agreements.find((x) => x.id === dto.id)!;
  if (a.status === "in_progress") return dto; // idempotent
  if (a.status !== "assigned") throw new ApiError(409, "INVALID_STATE", "This agreement can't be started.");
  a.status = "in_progress";
  db.gigs.find((g) => g.id === a.gigId)!.status = "in_progress";
  return agreementDto(a.id, u);
});
on("POST", "/agreements/:agreementId/confirm-completion", (p) => {
  const u = requireUser();
  const dto = agreementDto(p.agreementId, u);
  const a = db.agreements.find((x) => x.id === dto.id)!;
  if (a.status === "completed") return dto; // idempotent
  if (a.status !== "in_progress") throw new ApiError(409, "INVALID_STATE", "Start the gig before confirming completion.");
  const other = dto.myRole === "employer" ? a.workerId : a.employerId;
  if (dto.myRole === "employer") a.employerConfirmed = true;
  else a.workerConfirmed = true;
  if (a.employerConfirmed && a.workerConfirmed) {
    a.status = "completed";
    db.gigs.find((g) => g.id === a.gigId)!.status = "completed";
    notify(other, "completion", "Gig completed", `“${a.title}” is complete. Leave a review!`, `/agreements/${a.id}`);
  } else {
    notify(other, "completion", "Completion pending", `${u.name} confirmed “${a.title}” is done. Please confirm.`, `/agreements/${a.id}`);
  }
  return agreementDto(a.id, u);
});
on("GET", "/agreements/:agreementId/reviews", (p) => {
  const u = requireUser();
  agreementDto(p.agreementId, u);
  return db.reviews.filter((r) => r.agreementId === p.agreementId).map(reviewDto);
});
on("POST", "/agreements/:agreementId/reviews", (p, _q, b) => {
  const u = requireUser();
  const dto = agreementDto(p.agreementId, u);
  if (dto.status !== "completed") throw new ApiError(409, "NOT_COMPLETED", "Reviews open after the gig is completed.");
  if (dto.myReviewSubmitted) throw new ApiError(409, "ALREADY_REVIEWED", "You've already reviewed this gig.");
  const rating = Math.round(num(b.rating, "rating", 1, 5));
  const reviewee = dto.myRole === "employer" ? dto.worker.id : dto.employer.id;
  db.reviews.push({ id: id("r"), agreementId: dto.id, reviewerId: u.id, revieweeId: reviewee, rating, comment: typeof b.comment === "string" ? b.comment.slice(0, 1000) : undefined, createdAt: nowIso() });
  notify(reviewee, "review", "New review", `${u.name} left you a ${rating}-star review.`, `/users/${reviewee}`);
  return { ok: true };
});

// Conversations
on("GET", "/conversations", () => {
  const u = requireUser();
  return db.conversations
    .filter((c) => c.participantIds.includes(u.id))
    .map((c) => {
      const msgs = db.messages.filter((m) => m.conversationId === c.id);
      const last = msgs[msgs.length - 1];
      const other = userById(c.participantIds.find((x) => x !== u.id)!);
      return {
        id: c.id,
        gigId: c.gigId,
        gigTitle: db.gigs.find((g) => g.id === c.gigId)!.title,
        other: { id: other.id, name: other.name },
        lastMessage: last ? { body: last.body, createdAt: last.createdAt } : undefined,
        unreadCount: msgs.filter((m) => !m.readBy.includes(u.id)).length,
      };
    })
    .sort((a, b) => (b.lastMessage?.createdAt ?? "").localeCompare(a.lastMessage?.createdAt ?? ""));
});
function conv(cid: string, u: DbUser) {
  const c = db.conversations.find((x) => x.id === cid);
  if (!c || !c.participantIds.includes(u.id)) throw notFound("Conversation");
  return c;
}
on("GET", "/conversations/:conversationId/messages", (p) => {
  const u = requireUser();
  const c = conv(p.conversationId, u);
  const msgs = db.messages.filter((m) => m.conversationId === c.id);
  msgs.forEach((m) => !m.readBy.includes(u.id) && m.readBy.push(u.id));
  return msgs.map(({ readBy: _r, ...m }) => m);
});
on("POST", "/conversations/:conversationId/messages", (p, _q, b) => {
  const u = requireUser();
  const c = conv(p.conversationId, u);
  const m = { id: id("m"), conversationId: c.id, senderId: u.id, body: str(b.body, "message", 1, 2000), createdAt: nowIso(), readBy: [u.id] };
  db.messages.push(m);
  const other = c.participantIds.find((x) => x !== u.id)!;
  notify(other, "message", "New message", `${u.name}: ${m.body.slice(0, 60)}`, `/messages/${c.id}`);
  const { readBy: _r, ...out } = m;
  return out;
});

// Notifications
on("GET", "/notifications", () => {
  const u = requireUser();
  return db.notifications.filter((n) => n.userId === u.id).map(({ userId: _u, ...n }) => n);
});
on("POST", "/notifications/:notificationId/read", (p) => {
  const u = requireUser();
  const n = db.notifications.find((x) => x.id === p.notificationId && x.userId === u.id);
  if (!n) throw notFound("Notification");
  n.read = true;
  return { ok: true };
});
on("POST", "/notifications/read-all", () => {
  const u = requireUser();
  db.notifications.filter((n) => n.userId === u.id).forEach((n) => (n.read = true));
  return { ok: true };
});

// Reports & moderation
on("POST", "/reports", (_p, _q, b) => {
  const u = requireUser();
  const targetType = str(b.targetType, "target") as Db["reports"][number]["targetType"];
  if (!["gig", "user", "message", "review"].includes(targetType)) throw new ApiError(422, "VALIDATION", "Invalid target.");
  db.reports.unshift({ id: id("rp"), reporterId: u.id, targetType, targetId: str(b.targetId, "target"), reason: str(b.reason, "reason"), details: typeof b.details === "string" ? b.details.slice(0, 1000) : undefined, status: "open", createdAt: nowIso() });
  return { ok: true };
});
function targetLabel(type: string, tid: string) {
  if (type === "gig") return db.gigs.find((g) => g.id === tid)?.title ?? tid;
  if (type === "user") return db.users.find((x) => x.id === tid)?.name ?? tid;
  if (type === "review") return db.reviews.find((r) => r.id === tid)?.comment ?? tid;
  if (type === "message") return db.messages.find((m) => m.id === tid)?.body ?? tid;
  return tid;
}
on("GET", "/admin/reports", () => {
  requireAdmin();
  return db.reports.map((r) => ({
    id: r.id, targetType: r.targetType, targetId: r.targetId, targetLabel: targetLabel(r.targetType, r.targetId),
    reason: r.reason, details: r.details, status: r.status, resolution: r.resolution, createdAt: r.createdAt, resolvedAt: r.resolvedAt,
    reporter: { id: r.reporterId, name: userById(r.reporterId).name },
  }));
});
on("POST", "/admin/reports/:reportId/resolve", (p, _q, b) => {
  requireAdmin();
  const r = db.reports.find((x) => x.id === p.reportId);
  if (!r) throw notFound("Report");
  if (r.status !== "open") throw new ApiError(409, "INVALID_STATE", "Report already resolved.");
  const action = String(b.action);
  if (action === "dismiss") {
    r.status = "dismissed";
    r.resolution = "Dismissed";
  } else if (action === "hide_gig" && r.targetType === "gig") {
    const g = db.gigs.find((x) => x.id === r.targetId);
    if (g) g.hidden = true;
    r.status = "actioned";
    r.resolution = "Gig hidden";
  } else if (action === "suspend_user") {
    const uid = r.targetType === "user" ? r.targetId : r.targetType === "gig" ? db.gigs.find((g) => g.id === r.targetId)?.employerId : undefined;
    const target = db.users.find((x) => x.id === uid);
    if (!target || target.isAdmin) throw new ApiError(409, "INVALID_ACTION", "This user can't be suspended.");
    target.suspended = true;
    r.status = "actioned";
    r.resolution = `Suspended ${target.name}`;
  } else throw new ApiError(422, "VALIDATION", "Action not allowed for this report.");
  r.resolvedAt = nowIso();
  return { ok: true };
});

// ---------- entry ----------
export async function mockRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  await new Promise((r) => setTimeout(r, 180 + Math.random() * 220));
  const url = new URL(path, "http://mock.local");
  for (const [m, re, h] of routes) {
    if (m !== method) continue;
    const match = re.exec(url.pathname);
    if (match) {
      const result = h(match.groups ?? {}, url.searchParams, (body ?? {}) as Body);
      return structuredClone(result) as T;
    }
  }
  throw new ApiError(404, "NOT_FOUND", "Endpoint not found.");
}
