import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const code = readFileSync(new URL("google-apps-script/Code.gs", root), "utf8");

function backend(initialRows = []) {
  const rows = [[
    "subscribed_at",
    "email",
    "source",
    "consent_text",
    "status",
    "last_seen_at",
    "submission_count",
    "removed_at",
  ], ...initialRows.map((row) => [...row])];

  function range(row, column, rowCount = 1, columnCount = 1) {
    return {
      getValues() {
        return Array.from({ length: rowCount }, (_, r) =>
          Array.from({ length: columnCount }, (_, c) => rows[row - 1 + r]?.[column - 1 + c] ?? ""));
      },
      getValue() { return rows[row - 1]?.[column - 1] ?? ""; },
      setValue(value) {
        rows[row - 1] ||= [];
        rows[row - 1][column - 1] = value;
        return this;
      },
      clearContent() {
        rows[row - 1] ||= [];
        rows[row - 1][column - 1] = "";
        return this;
      },
      createTextFinder(needle) {
        let matchCase = true;
        return {
          matchCase(value) { matchCase = value; return this; },
          matchEntireCell() { return this; },
          findNext() {
            for (let i = row - 1; i < row - 1 + rowCount; i += 1) {
              const value = String(rows[i]?.[column - 1] ?? "");
              if ((matchCase ? value : value.toLowerCase()) === (matchCase ? needle : needle.toLowerCase())) {
                return { getRow: () => i + 1 };
              }
            }
            return null;
          },
        };
      },
    };
  }

  const sheet = {
    appendRow(row) { rows.push([...row]); },
    getLastRow() { return rows.length; },
    getRange: range,
  };
  const lock = { waitLock() {}, releaseLock() {} };
  const sandbox = {
    console: { error() {} },
    Date,
    encodeURIComponent,
    SpreadsheetApp: {
      openById(id) {
        assert.equal(id, "private-sheet-id");
        return { getSheetByName: (name) => name === "Subscribers" ? sheet : null };
      },
      flush() {},
    },
    PropertiesService: {
      getScriptProperties() {
        return { getProperty: (name) => ({ SPREADSHEET_ID: "private-sheet-id", SITE_ORIGIN: "https://prxdjay.com" })[name] };
      },
    },
    LockService: { getScriptLock: () => lock },
    ContentService: {
      MimeType: { TEXT: "text" },
      createTextOutput(value) { return { value, setMimeType() { return this; } }; },
    },
    HtmlService: {
      XFrameOptionsMode: { ALLOWALL: "allowall" },
      createHtmlOutput(value) { return { value, setXFrameOptionsMode() { return this; } }; },
    },
  };
  vm.runInNewContext(code, sandbox, { filename: "Code.gs" });
  return { rows, doPost: sandbox.doPost };
}

function event(email, overrides = {}) {
  return {
    parameter: {
      email,
      consent_token: "release-updates-v1",
      source: "prxdjay.com",
      form_started_at: String(Date.now() - 1000),
      website: "",
      ...overrides,
    },
  };
}

function result(output) {
  return output.value.match(/signup-result\.html\?status=([^\"&]+)/)?.[1];
}

test("stores one normalized active subscriber with the exact consent text", () => {
  const app = backend();
  assert.equal(result(app.doPost(event(" Fan@Example.com "))), "saved");
  assert.equal(app.rows.length, 2);
  assert.equal(app.rows[1][1], "fan@example.com");
  assert.equal(app.rows[1][2], "prxdjay.com");
  assert.equal(app.rows[1][3], "Email me occasional PRXD.JAY release updates. Unsubscribe anytime.");
  assert.equal(app.rows[1][4], "active");
  assert.equal(app.rows[1][6], 1);
});

test("deduplicates an active subscriber and increments the submission count", () => {
  const existing = [new Date(0), "fan@example.com", "prxdjay.com", "consent", "active", new Date(0), 1, ""];
  const app = backend([existing]);
  assert.equal(result(app.doPost(event("FAN@example.com"))), "duplicate");
  assert.equal(app.rows.length, 2);
  assert.equal(app.rows[1][6], 2);
});

test("a removed address can explicitly opt in again", () => {
  const existing = [new Date(0), "fan@example.com", "prxdjay.com", "consent", "removed", new Date(0), 1, new Date(1)];
  const app = backend([existing]);
  assert.equal(result(app.doPost(event("fan@example.com"))), "resubscribed");
  assert.equal(app.rows[1][4], "active");
  assert.equal(app.rows[1][7], "");
});

test("rejects invalid, stale, or consentless submissions without writing", () => {
  for (const submitted of [
    event("not-an-email"),
    event("fan@example.com", { consent_token: "" }),
    event("fan@example.com", { form_started_at: String(Date.now() - 8000000) }),
  ]) {
    const app = backend();
    assert.equal(result(app.doPost(submitted)), "invalid");
    assert.equal(app.rows.length, 1);
  }
});

test("honeypot submissions receive a generic success without storing data", () => {
  const app = backend();
  assert.equal(result(app.doPost(event("bot@example.com", { website: "spam" }))), "saved");
  assert.equal(app.rows.length, 1);
});
