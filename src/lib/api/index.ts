import { request } from "./client";
import type {
  Agreement, Application, Conversation, Gig, GigFilters, GigInput, Me, Message, MyApplication,
  Notification, Paginated, PrivateAddress, PublicUser, Report, Review, ReportTarget,
} from "@/types";

export const authApi = {
  me: () => request<Me>("GET", "/auth/me"),
  login: (b: { email: string; password: string }) => request<Me>("POST", "/auth/login", { body: b }),
  register: (b: { name: string; email: string; password: string }) => request<Me>("POST", "/auth/register", { body: b }),
  logout: () => request<{ ok: true }>("POST", "/auth/logout"),
  forgotPassword: (email: string) => request<{ ok: true }>("POST", "/auth/forgot-password", { body: { email } }),
};

export const usersApi = {
  get: (id: string) => request<{ user: PublicUser; reviews: Review[] }>("GET", `/users/${id}`),
  updateMe: (b: Partial<Pick<Me, "name" | "bio" | "city" | "area" | "skills" | "phone">>) => request<Me>("PATCH", "/users/me", { body: b }),
};

export const gigsApi = {
  list: (f: GigFilters) => request<Paginated<Gig>>("GET", "/gigs", { query: { ...f } }),
  mine: () => request<Gig[]>("GET", "/gigs/mine"),
  get: (id: string) => request<Gig>("GET", `/gigs/${id}`),
  getForEdit: (id: string) => request<Gig & { street: string; complement?: string }>("GET", `/gigs/${id}/private`),
  create: (b: GigInput) => request<Gig>("POST", "/gigs", { body: b }),
  update: (id: string, b: GigInput) => request<Gig>("PATCH", `/gigs/${id}`, { body: b }),
  cancel: (id: string) => request<Gig>("POST", `/gigs/${id}/cancel`),
};

export const applicationsApi = {
  apply: (gigId: string, message?: string) => request<Gig>("POST", `/gigs/${gigId}/applications`, { body: { message } }),
  forGig: (gigId: string) => request<{ gig: Gig; applications: Application[] }>("GET", `/gigs/${gigId}/applications`),
  mine: () => request<MyApplication[]>("GET", "/applications/me"),
  withdraw: (id: string) => request<{ ok: true }>("POST", `/applications/${id}/withdraw`),
  selectWorker: (gigId: string, applicationId: string) => request<Agreement>("POST", `/gigs/${gigId}/select-worker`, { body: { applicationId } }),
};

export const agreementsApi = {
  get: (id: string) => request<Agreement>("GET", `/agreements/${id}`),
  address: (id: string) => request<PrivateAddress>("GET", `/agreements/${id}/address`),
  start: (id: string) => request<Agreement>("POST", `/agreements/${id}/start`),
  confirm: (id: string) => request<Agreement>("POST", `/agreements/${id}/confirm-completion`),
  reviews: (id: string) => request<Review[]>("GET", `/agreements/${id}/reviews`),
  review: (id: string, b: { rating: number; comment?: string | undefined }) => request<{ ok: true }>("POST", `/agreements/${id}/reviews`, { body: b }),
};

export const messagesApi = {
  conversations: () => request<Conversation[]>("GET", "/conversations"),
  messages: (cid: string) => request<Message[]>("GET", `/conversations/${cid}/messages`),
  send: (cid: string, body: string) => request<Message>("POST", `/conversations/${cid}/messages`, { body: { body } }),
};

export const notificationsApi = {
  list: () => request<Notification[]>("GET", "/notifications"),
  read: (id: string) => request<{ ok: true }>("POST", `/notifications/${id}/read`),
  readAll: () => request<{ ok: true }>("POST", "/notifications/read-all"),
};

export const reportsApi = {
  create: (b: { targetType: ReportTarget; targetId: string; reason: string; details?: string | undefined }) => request<{ ok: true }>("POST", "/reports", { body: b }),
  adminList: () => request<Report[]>("GET", "/admin/reports"),
  resolve: (id: string, action: "dismiss" | "hide_gig" | "suspend_user") => request<{ ok: true }>("POST", `/admin/reports/${id}/resolve`, { body: { action } }),
};
