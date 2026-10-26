export type GigStatus = "draft" | "open" | "assigned" | "in_progress" | "completed" | "canceled";
export type ApplicationStatus = "pending" | "accepted" | "rejected" | "withdrawn";
export type GigType = "personal" | "business";
export type AgreementStatus = "assigned" | "in_progress" | "completed";
export type ReportTarget = "gig" | "user" | "message" | "review";

export const CATEGORIES = [
  "Moving & lifting",
  "Cleaning",
  "Gardening",
  "Furniture assembly",
  "Errands",
  "Event help",
  "Handyman",
  "Other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export interface PublicUser {
  id: string;
  name: string;
  avatarUrl?: string | undefined;
  bio: string;
  city: string;
  area: string;
  skills: string[];
  rating: number | null;
  reviewCount: number;
  completedGigs: number;
  memberSince: string;
}

export interface Me extends PublicUser {
  email: string;
  phone?: string | undefined;
  isAdmin: boolean;
  profileComplete: boolean;
}

/** Public gig shape. Never contains the private street address. */
export interface Gig {
  id: string;
  title: string;
  description: string;
  category: Category;
  type: GigType;
  price: number;
  durationHours: number;
  startsAt: string;
  city: string;
  area: string;
  status: GigStatus;
  createdAt: string;
  employer: PublicUser;
  /** Only present for the gig owner. */
  applicationCount?: number | undefined;
  /** Only present when the viewer has applied. */
  myApplication?: { id: string; status: ApplicationStatus };
  /** Only present for agreement participants. */
  agreementId?: string | undefined;
  isOwner: boolean;
}

export interface GigInput {
  title: string;
  description: string;
  category: Category;
  type: GigType;
  price: number;
  durationHours: number;
  startsAt: string;
  city: string;
  area: string;
  street: string;
  complement?: string | undefined;
  publish: boolean;
}

export interface PrivateAddress {
  street: string;
  complement?: string | undefined;
  city: string;
  area: string;
}

export interface Application {
  id: string;
  gigId: string;
  status: ApplicationStatus;
  message?: string | undefined;
  createdAt: string;
  worker: PublicUser;
}

export interface MyApplication {
  id: string;
  status: ApplicationStatus;
  message?: string | undefined;
  createdAt: string;
  gig: Gig;
}

export interface Agreement {
  id: string;
  gigId: string;
  title: string;
  price: number;
  startsAt: string;
  durationHours: number;
  status: AgreementStatus;
  employer: PublicUser;
  worker: PublicUser;
  employerConfirmed: boolean;
  workerConfirmed: boolean;
  createdAt: string;
  conversationId: string;
  myRole: "employer" | "worker";
  myReviewSubmitted: boolean;
}

export interface Review {
  id: string;
  agreementId: string;
  rating: number;
  comment?: string | undefined;
  createdAt: string;
  reviewer: Pick<PublicUser, "id" | "name" | "avatarUrl">;
  gigTitle: string;
}

export interface Conversation {
  id: string;
  gigId: string;
  gigTitle: string;
  other: Pick<PublicUser, "id" | "name" | "avatarUrl">;
  lastMessage?: { body: string; createdAt: string };
  unreadCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string | undefined;
  read: boolean;
  createdAt: string;
}

export interface Report {
  id: string;
  targetType: ReportTarget;
  targetId: string;
  targetLabel: string;
  reason: string;
  details?: string | undefined;
  status: "open" | "dismissed" | "actioned";
  resolution?: string | undefined;
  createdAt: string;
  resolvedAt?: string | undefined;
  reporter: Pick<PublicUser, "id" | "name">;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface GigFilters {
  q?: string | undefined;
  category?: string | undefined;
  city?: string | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  posted?: "24h" | "7d" | "30d";
  page?: number | undefined;
}
