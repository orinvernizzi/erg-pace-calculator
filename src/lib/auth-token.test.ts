import { describe, expect, it } from "vitest";
import { signUserToken, verifyUserToken } from "./auth-token";

describe("auth token", () => {
  it("round-trips a session and rejects garbage", async () => {
    const user = { id: "u1", email: "a@b.co", name: "Ada", activeRole: "rower" as const };
    const token = await signUserToken(user);
    await expect(verifyUserToken(token)).resolves.toEqual(user);
    await expect(verifyUserToken("")).resolves.toBeNull();
    await expect(verifyUserToken("not-a-jwt")).resolves.toBeNull();
  });
});
