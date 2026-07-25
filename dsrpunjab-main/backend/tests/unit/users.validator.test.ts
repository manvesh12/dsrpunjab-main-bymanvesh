import assert from "node:assert/strict";
import test from "node:test";
import { ApiError } from "../../src/common/exceptions/api-error.js";
import { normalizeRole, normalizedBulkRole, requiredDistrict, rowValue } from "../../src/users/users.validator.js";

test("supported portal roles normalize consistently", () => {
  assert.equal(normalizeRole("coe sensrs"), "COE_SENSRS");
  assert.equal(normalizedBulkRole("Head Office"), "HEAD_OFFICE");
  assert.equal(normalizedBulkRole("DMO"), "DMO");
});

test("district remains mandatory for non-admin users", () => {
  assert.throws(
    () => requiredDistrict("", "DMO"),
    (error: unknown) => error instanceof ApiError && error.status === 400 && error.message === "District is required for every non-admin account."
  );
  assert.equal(requiredDistrict("", "STATE_ADMIN"), null);
});

test("bulk spreadsheet headers are matched case-insensitively", () => {
  assert.equal(rowValue({ "Phone/Mobile": "9876543210" }, "phone"), "9876543210");
});
