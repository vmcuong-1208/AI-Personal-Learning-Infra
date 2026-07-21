import { describe, expect, it } from "vitest";
import { journalEntries } from "../../src/data/mock/mockData";
import { filterEntries } from "../../src/lib/search";
import { buildSearchPath } from "../../src/features/search/searchApi";

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

describe("buildSearchPath", () => {
  it("uses the AWS /search query contract", () => {
    const path = buildSearchPath({
      q: "IAM role error",
      topic: "security",
      tags: ["AWS", "IAM"],
      from: "2026-07-01",
      to: "2026-07-21"
    });

    expect(path).toBe("/search?q=IAM+role+error&topic=security&tags=AWS%2CIAM&from=2026-07-01&to=2026-07-21");
  });

  it("omits empty filters", () => {
    expect(buildSearchPath({ q: "  ", tags: [] })).toBe("/search");
  });
});