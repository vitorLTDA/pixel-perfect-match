// Mock-only seed data. Never imported by real-API code paths.
import type { Category, GigStatus, GigType, ApplicationStatus, AgreementStatus, ReportTarget } from "@/types";

export interface DbUser {
  id: string;
  name: string;
  email: string;
  password: string;
  bio: string;
  city: string;
  area: string;
  skills: string[];
  phone?: string;
  isAdmin: boolean;
  suspended: boolean;
  createdAt: string;
}
export interface DbGig {
  id: string;
  employerId: string;
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
  complement?: string;
  status: GigStatus;
  hidden: boolean;
  createdAt: string;
}
export interface DbApplication {
  id: string;
  gigId: string;
  workerId: string;
  message?: string;
  status: ApplicationStatus;
  createdAt: string;
}
export interface DbAgreement {
  id: string;
  gigId: string;
  employerId: string;
  workerId: string;
  title: string;
  price: number;
  startsAt: string;
  durationHours: number;
  status: AgreementStatus;
  employerConfirmed: boolean;
  workerConfirmed: boolean;
  createdAt: string;
}
export interface DbReview {
  id: string;
  agreementId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}
export interface DbConversation {
  id: string;
  gigId: string;
  agreementId: string;
  participantIds: string[];
}
export interface DbMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  readBy: string[];
}
export interface DbNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: string;
}
export interface DbReport {
  id: string;
  reporterId: string;
  targetType: ReportTarget;
  targetId: string;
  reason: string;
  details?: string;
  status: "open" | "dismissed" | "actioned";
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}
export interface Db {
  users: DbUser[];
  gigs: DbGig[];
  applications: DbApplication[];
  agreements: DbAgreement[];
  reviews: DbReview[];
  conversations: DbConversation[];
  messages: DbMessage[];
  notifications: DbNotification[];
  reports: DbReport[];
}

const now = Date.now();
const h = 3600_000;
const ago = (hours: number) => new Date(now - hours * h).toISOString();
const ahead = (hours: number) => new Date(now + hours * h).toISOString();

export const DEMO_PASSWORD = "demo1234";

export function seed(): Db {
  const users: DbUser[] = [
    { id: "u1", name: "Ana Ribeiro", email: "ana@work.demo", password: DEMO_PASSWORD, bio: "Architect, mother of two, always rearranging the living room.", city: "Lisbon", area: "Alvalade", skills: ["Organizing"], phone: "+351 912 000 111", isAdmin: false, suspended: false, createdAt: ago(24 * 200) },
    { id: "u2", name: "Bruno Costa", email: "bruno@work.demo", password: DEMO_PASSWORD, bio: "Student and weekend helper. Strong back, own toolkit, reliable.", city: "Lisbon", area: "Arroios", skills: ["Moving", "Furniture assembly", "Gardening"], isAdmin: false, suspended: false, createdAt: ago(24 * 120) },
    { id: "u3", name: "Carla Mendes", email: "carla@work.demo", password: DEMO_PASSWORD, bio: "Professional cleaner with 6 years of experience.", city: "Lisbon", area: "Benfica", skills: ["Cleaning", "Laundry"], isAdmin: false, suspended: false, createdAt: ago(24 * 300) },
    { id: "u4", name: "Diogo Alves", email: "diogo@work.demo", password: DEMO_PASSWORD, bio: "I run a small café and sometimes need extra hands.", city: "Porto", area: "Cedofeita", skills: ["Barista"], isAdmin: false, suspended: false, createdAt: ago(24 * 90) },
    { id: "u5", name: "Elena Sousa", email: "elena@work.demo", password: DEMO_PASSWORD, bio: "Handy with plants and paint brushes.", city: "Lisbon", area: "Campo de Ourique", skills: ["Gardening", "Painting"], isAdmin: false, suspended: false, createdAt: ago(24 * 60) },
    { id: "u9", name: "Moderator", email: "admin@work.demo", password: DEMO_PASSWORD, bio: "Work trust & safety team.", city: "Lisbon", area: "Centro", skills: [], isAdmin: true, suspended: false, createdAt: ago(24 * 400) },
  ];

  const g = (o: Partial<DbGig> & Pick<DbGig, "id" | "employerId" | "title" | "category" | "price">): DbGig => ({
    description: "",
    type: "personal",
    durationHours: 2,
    startsAt: ahead(48),
    city: "Lisbon",
    area: "Alvalade",
    street: "Rua Example 1",
    status: "open",
    hidden: false,
    createdAt: ago(5),
    ...o,
  });

  const gigs: DbGig[] = [
    g({ id: "g1", employerId: "u1", title: "Help carry a sofa up to the 3rd floor", category: "Moving & lifting", price: 45, durationHours: 1, startsAt: ahead(30), area: "Alvalade", street: "Av. da Igreja 42, 3º Esq.", complement: "Buzzer 3E. No elevator.", description: "A three-seat sofa is arriving from the shop downstairs. I need one strong person to help me carry it up three flights of stairs and position it in the living room. Gloves provided.", createdAt: ago(3) }),
    g({ id: "g2", employerId: "u1", title: "Assemble two IKEA wardrobes", category: "Furniture assembly", price: 80, durationHours: 3, startsAt: ahead(72), area: "Alvalade", street: "Av. da Igreja 42, 3º Esq.", description: "Two PAX wardrobes still in boxes. Tools available, but bring a drill if you have one. Instructions are in the boxes.", createdAt: ago(20) }),
    g({ id: "g3", employerId: "u4", title: "Extra hands for Saturday brunch rush", category: "Event help", type: "business", price: 60, durationHours: 3, startsAt: ahead(96), city: "Porto", area: "Cedofeita", street: "Rua de Cedofeita 210", description: "Our café gets packed on Saturdays. Help clearing tables, washing cups and restocking. Friendly team, free coffee.", createdAt: ago(8) }),
    g({ id: "g4", employerId: "u3", title: "Trim hedges and rake leaves in small garden", category: "Gardening", price: 50, durationHours: 2, startsAt: ahead(50), area: "Benfica", street: "Rua Cláudio Nunes 18", description: "Small back garden with a hedge row (~8m) that needs trimming and autumn leaves to rake and bag.", createdAt: ago(30) }),
    g({ id: "g5", employerId: "u5", title: "Deep clean a one-bedroom flat after moving out", category: "Cleaning", price: 70, durationHours: 3, startsAt: ahead(26), area: "Campo de Ourique", street: "Rua Ferreira Borges 77, 1º", description: "Empty flat, needs kitchen, bathroom and floors cleaned before handing keys back. Products supplied.", createdAt: ago(2) }),
    g({ id: "g6", employerId: "u4", title: "Pick up a delivery of flour sacks", category: "Errands", type: "business", price: 30, durationHours: 1, startsAt: ahead(20), city: "Porto", area: "Bonfim", street: "Rua do Heroísmo 12", description: "Collect 10 sacks of flour (25kg each) from a supplier two streets away using our trolley.", createdAt: ago(60) }),
    g({ id: "g7", employerId: "u2", title: "Mount a TV and two shelves", category: "Handyman", price: 40, durationHours: 1.5, startsAt: ahead(120), area: "Arroios", street: "Rua Morais Soares 5, 2º Dto", description: "Wall mount for a 55\" TV plus two floating shelves. Wall is brick. I have the brackets.", createdAt: ago(100) }),
    g({ id: "g8", employerId: "u1", title: "Move boxes into storage unit", category: "Moving & lifting", price: 55, durationHours: 2, startsAt: ago(30), area: "Alvalade", street: "Av. da Igreja 42, 3º Esq.", status: "in_progress", description: "About 20 boxes from my flat to a storage unit 5 minutes away by van (van provided).", createdAt: ago(120) }),
    g({ id: "g9", employerId: "u5", title: "Repaint a small balcony railing", category: "Handyman", price: 65, durationHours: 3, startsAt: ago(200), area: "Campo de Ourique", street: "Rua Ferreira Borges 77, 1º", status: "completed", description: "Sand and repaint a 3m iron railing. Paint supplied.", createdAt: ago(300) }),
    g({ id: "g10", employerId: "u3", title: "Help organize a garage sale", category: "Event help", price: 35, durationHours: 2.5, startsAt: ahead(160), area: "Benfica", street: "Rua Cláudio Nunes 18", description: "Set up tables, price items and help shoppers on a Sunday morning.", createdAt: ago(12) }),
    g({ id: "g11", employerId: "u4", title: "Clean café windows (inside & out)", category: "Cleaning", type: "business", price: 45, durationHours: 2, startsAt: ahead(60), city: "Porto", area: "Cedofeita", street: "Rua de Cedofeita 210", description: "Large front windows, ladder available.", createdAt: ago(40) }),
  ];

  const applications: DbApplication[] = [
    { id: "a1", gigId: "g1", workerId: "u2", message: "I live 10 minutes away and have moved plenty of sofas. Happy to help!", status: "pending", createdAt: ago(2) },
    { id: "a2", gigId: "g1", workerId: "u5", message: "Available that day, can bring a friend's lifting straps.", status: "pending", createdAt: ago(1.5) },
    { id: "a3", gigId: "g1", workerId: "u3", status: "pending", createdAt: ago(1) },
    { id: "a4", gigId: "g5", workerId: "u3", message: "Move-out cleans are my specialty.", status: "pending", createdAt: ago(1) },
    { id: "a5", gigId: "g8", workerId: "u2", status: "accepted", createdAt: ago(110) },
    { id: "a6", gigId: "g8", workerId: "u5", status: "rejected", createdAt: ago(108) },
    { id: "a7", gigId: "g9", workerId: "u2", status: "accepted", createdAt: ago(290) },
    { id: "a8", gigId: "g4", workerId: "u2", message: "I have my own hedge trimmer.", status: "pending", createdAt: ago(10) },
  ];

  const agreements: DbAgreement[] = [
    { id: "ag1", gigId: "g8", employerId: "u1", workerId: "u2", title: "Move boxes into storage unit", price: 55, startsAt: ago(30), durationHours: 2, status: "in_progress", employerConfirmed: false, workerConfirmed: true, createdAt: ago(100) },
    { id: "ag2", gigId: "g9", employerId: "u5", workerId: "u2", title: "Repaint a small balcony railing", price: 65, startsAt: ago(200), durationHours: 3, status: "completed", employerConfirmed: true, workerConfirmed: true, createdAt: ago(280) },
  ];

  const reviews: DbReview[] = [
    { id: "r1", agreementId: "ag2", reviewerId: "u5", revieweeId: "u2", rating: 5, comment: "Bruno was on time, careful and the railing looks brand new.", createdAt: ago(190) },
    { id: "r2", agreementId: "ag2", reviewerId: "u2", revieweeId: "u5", rating: 5, comment: "Clear instructions and everything was ready. Great employer.", createdAt: ago(188) },
  ];

  const conversations: DbConversation[] = [
    { id: "c1", gigId: "g8", agreementId: "ag1", participantIds: ["u1", "u2"] },
    { id: "c2", gigId: "g9", agreementId: "ag2", participantIds: ["u5", "u2"] },
  ];

  const messages: DbMessage[] = [
    { id: "m1", conversationId: "c1", senderId: "u1", body: "Hi Bruno! The van will be parked right in front of the building.", createdAt: ago(40), readBy: ["u1", "u2"] },
    { id: "m2", conversationId: "c1", senderId: "u2", body: "Perfect, I'll be there 5 minutes early.", createdAt: ago(39), readBy: ["u1", "u2"] },
    { id: "m3", conversationId: "c1", senderId: "u2", body: "All boxes are in the unit. I marked my part as done.", createdAt: ago(1), readBy: ["u2"] },
    { id: "m4", conversationId: "c2", senderId: "u5", body: "Thanks again for the great job!", createdAt: ago(189), readBy: ["u5", "u2"] },
  ];

  const notifications: DbNotification[] = [
    { id: "n1", userId: "u1", type: "application", title: "New application", body: "Carla Mendes applied to “Help carry a sofa up to the 3rd floor”.", link: "/my-gigs/g1/applications", read: false, createdAt: ago(1) },
    { id: "n2", userId: "u1", type: "completion", title: "Completion pending", body: "Bruno marked “Move boxes into storage unit” as done. Please confirm.", link: "/agreements/ag1", read: false, createdAt: ago(1) },
    { id: "n3", userId: "u2", type: "accepted", title: "You were selected", body: "Ana Ribeiro selected you for “Move boxes into storage unit”.", link: "/agreements/ag1", read: true, createdAt: ago(100) },
    { id: "n4", userId: "u2", type: "review", title: "New review", body: "Elena Sousa left you a 5-star review.", link: "/users/u2", read: false, createdAt: ago(190) },
  ];

  const reports: DbReport[] = [
    { id: "rp1", reporterId: "u3", targetType: "gig", targetId: "g6", reason: "Misleading description", details: "Sacks are heavier than described.", status: "open", createdAt: ago(5) },
  ];

  return { users, gigs, applications, agreements, reviews, conversations, messages, notifications, reports };
}
