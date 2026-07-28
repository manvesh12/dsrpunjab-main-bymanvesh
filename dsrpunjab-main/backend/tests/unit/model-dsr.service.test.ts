import assert from "node:assert/strict";
import test from "node:test";
import { Role, SectionContentType } from "@prisma/client";
import { ApiError } from "../../src/common/exceptions/api-error.js";
import type { AuthUser } from "../../src/lib/auth.js";
import { ModelDsrService } from "../../src/model-dsr/model-dsr.service.js";
import type { ModelDsrRepositoryContract } from "../../src/model-dsr/model-dsr.repository.js";
import { defaultModelDsrSections, normalizeSections, splitSections } from "../../src/model-dsr/section-normalizer.js";

const officer: AuthUser = {
  id: 9n, username: "officer", email: "officer@example.test", fullName: "Officer", role: Role.OFFICER,
  district: "Jalandhar", blockName: null, sectionName: null, accessScope: null
};

test("default Model DSR structure keeps ten chapters and five annexures", () => {
  const sections = defaultModelDsrSections();
  const split = splitSections(sections.map((section, index) => ({ id: String(index), ...section, configuration: section.configuration as any })));
  assert.equal(split.chapters.length, 10);
  assert.equal(split.annexures.length, 5);
});

test("unknown section content types fall back to TEXT", () => {
  assert.equal(normalizeSections([{ sectionName: "Custom", contentType: "UNKNOWN" }])[0].contentType, SectionContentType.TEXT);
});

test("non-admin users cannot create Model DSR templates", async () => {
  const service = new ModelDsrService({} as ModelDsrRepositoryContract);
  await assert.rejects(
    () => service.create({ title: "Template" }, officer),
    (error: unknown) => error instanceof ApiError && error.status === 403 && error.message === "Access denied. Only Admins can manage Model DSRs."
  );
});

test("Model DSR import enforces target project district access", async () => {
  const repository = {
    sectionCount: async () => 1,
    findTemplate: async () => ({ id: "model", title: "Model", sections: [] }),
    findProject: async () => ({ id: 2n, district: "Ludhiana", projectState: null })
  } as ModelDsrRepositoryContract;
  const service = new ModelDsrService(repository);
  await assert.rejects(
    () => service.import("model", { projectId: "2" }, officer),
    (error: unknown) => error instanceof ApiError && error.status === 403
  );
});

test("Model DSR import preserves chapter text and uploaded file content", async () => {
  let savedState: Record<string, any> | undefined;
  const repository = {
    sectionCount: async () => 2,
    findTemplate: async () => ({
      id: "model",
      title: "Complete Model",
      sections: [
        {
          id: "chapter-1",
          sectionName: "Chapter 1 - Introduction",
          sequence: 1,
          contentType: SectionContentType.TEXT,
          configuration: {
            kind: "chapter",
            content: "Full introduction content",
            fileName: "introduction.pdf",
            fileUrl: "/uploads/introduction.pdf"
          }
        },
        {
          id: "annexure-1",
          sectionName: "Annexure A - Leases",
          sequence: 2,
          contentType: SectionContentType.TABLE,
          configuration: { kind: "annexure", rows: [{ lease: "L-1" }] }
        }
      ]
    }),
    findProject: async () => ({ id: 2n, district: "Jalandhar", projectState: null, projectName: "Test Project" }),
    importIntoProject: async (_projectId: bigint, projectState: string) => {
      savedState = JSON.parse(projectState);
    }
  } as ModelDsrRepositoryContract;
  const service = new ModelDsrService(repository);

  const result = await service.import("model", { projectId: "2" }, officer);

  assert.equal(result.chaptersImported, 1);
  assert.equal(result.annexuresImported, 1);
  assert.equal(savedState?.chapters[0].name, "Chapter 1 - Introduction");
  assert.equal(savedState?.chapters[0].summary, "Full introduction content");
  assert.deepEqual(savedState?.chapters[0].file, {
    name: "introduction.pdf",
    url: "/uploads/introduction.pdf"
  });
  assert.deepEqual(savedState?.modelDsrAnnexures[0].title, "Annexure A - Leases");
});
