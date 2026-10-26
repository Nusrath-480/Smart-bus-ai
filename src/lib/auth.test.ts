import { describe, expect, it } from "vitest";
import { homePathFor, primaryRole } from "./auth";

describe("role routing", () => {
  it("sends admins to the admin dashboard even if they are also students", () => {
    expect(homePathFor(primaryRole(["student", "admin"]))).toBe("/admin");
  });
  it("sends drivers to the driver dashboard", () => {
    expect(homePathFor(primaryRole(["driver", "student"]))).toBe("/driver");
  });
  it("sends students to the student dashboard", () => {
    expect(homePathFor(primaryRole(["student"]))).toBe("/student");
  });
});
