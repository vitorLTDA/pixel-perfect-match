import { beforeEach, describe, expect, it } from "vitest";
import { mockRequest, resetMockDb } from "./adapter";

const login = (email: string) => mockRequest("POST", "/auth/login", { email, password: "demo1234" });

describe("marketplace rules (mock backend)", () => {
  beforeEach(() => resetMockDb());

  it("public gig payloads never include the street address", async () => {
    const list = await mockRequest<{ items: object[] }>("GET", "/gigs");
    expect(JSON.stringify(list)).not.toContain("Av. da Igreja");
    const one = await mockRequest<object>("GET", "/gigs/g1");
    expect(one).not.toHaveProperty("street");
  });

  it("only one worker can be selected; the second selection is rejected", async () => {
    await login("ana@work.demo");
    await mockRequest("POST", "/gigs/g1/select-worker", { applicationId: "a1" });
    await expect(mockRequest("POST", "/gigs/g1/select-worker", { applicationId: "a2" })).rejects.toMatchObject({ status: 409 });
  });

  it("selection rejects other pending applications", async () => {
    await login("ana@work.demo");
    await mockRequest("POST", "/gigs/g1/select-worker", { applicationId: "a1" });
    const { applications } = await mockRequest<{ applications: { id: string; status: string }[] }>("GET", "/gigs/g1/applications");
    expect(applications.find((a) => a.id === "a2")?.status).toBe("rejected");
  });

  it("address is readable by the selected worker but not by a rejected applicant", async () => {
    await login("ana@work.demo");
    const ag = await mockRequest<{ id: string }>("POST", "/gigs/g1/select-worker", { applicationId: "a1" });
    await login("bruno@work.demo");
    await expect(mockRequest("GET", `/agreements/${ag.id}/address`)).resolves.toMatchObject({ street: "Av. da Igreja 42, 3º Esq." });
    await login("elena@work.demo");
    await expect(mockRequest("GET", `/agreements/${ag.id}/address`)).rejects.toMatchObject({ status: 404 });
  });

  it("employers cannot view applications for someone else's gig", async () => {
    await login("bruno@work.demo");
    await expect(mockRequest("GET", "/gigs/g1/applications")).rejects.toMatchObject({ status: 404 });
  });

  it("gig completes only after both sides confirm", async () => {
    await login("bruno@work.demo"); // worker already confirmed ag1 in seed
    await login("ana@work.demo");
    const a = await mockRequest<{ status: string }>("POST", "/agreements/ag1/confirm-completion");
    expect(a.status).toBe("completed");
  });

  it("registration cannot grant admin rights", async () => {
    const me = await mockRequest<{ isAdmin: boolean }>("POST", "/auth/register", { name: "Eve", email: "eve@x.com", password: "password1", isAdmin: true });
    expect(me.isAdmin).toBe(false);
  });
});
