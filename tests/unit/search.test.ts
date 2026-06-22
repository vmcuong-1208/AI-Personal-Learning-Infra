import { describe, expect, it } from "vitest";
import { journalEntries } from "../../src/data/mock/mockData";
import { filterEntries } from "../../src/lib/search";

describe("filterEntries", () => {
  it("returns entries matching text query", () => {
    const results = filterEntries(journalEntries, "redis", "");

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((entry) => `${entry.title} ${entry.summary} ${entry.content} ${entry.topics.join(" ")}`.toLowerCase().includes("redis"))).toBe(true);
  });

  it("filters by exact topic and keeps scored results sorted", () => {
    const results = filterEntries(journalEntries, "", "Terraform");

    expect(results).toHaveLength(1);
    expect(results[0].topics).toContain("Terraform");
    expect(results[0].score).toBeGreaterThanOrEqual(results[0].confidence);
  });
});
