var HEADERS = [
  "subscribed_at",
  "email",
  "source",
  "consent_text",
  "status",
  "last_seen_at",
  "submission_count",
  "removed_at"
];
var CONSENT_TOKEN = "release-updates-v1";
var CONSENT_TEXT = "Email me occasional PRXD.JAY release updates. Unsubscribe anytime.";
var SHEET_NAME = "Subscribers";

function doGet() {
  return ContentService.createTextOutput("Not found.")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(event) {
  var result = "error";
  var lock = LockService.getScriptLock();

  try {
    var params = event && event.parameter ? event.parameter : {};
    if (params.website) return redirectResult_("saved");

    var email = normalizeEmail_(params.email);
    var startedAt = Number(params.form_started_at || 0);
    var age = Date.now() - startedAt;
    if (!email || params.consent_token !== CONSENT_TOKEN || age < -300000 || age > 7200000) {
      return redirectResult_("invalid");
    }

    var properties = PropertiesService.getScriptProperties();
    var spreadsheetId = properties.getProperty("SPREADSHEET_ID");
    var siteOrigin = properties.getProperty("SITE_ORIGIN");
    if (!spreadsheetId || siteOrigin !== "https://prxdjay.com") throw new Error("Missing script properties");

    lock.waitLock(20000);
    var sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error("Subscribers sheet not found");
    ensureHeaders_(sheet);

    var now = new Date();
    var existing = findEmail_(sheet, email);
    if (existing) {
      var status = String(sheet.getRange(existing, 5).getValue() || "active").toLowerCase();
      var count = Number(sheet.getRange(existing, 7).getValue() || 1);
      sheet.getRange(existing, 6).setValue(now);
      sheet.getRange(existing, 7).setValue(count + 1);
      if (status === "removed") {
        sheet.getRange(existing, 1).setValue(now);
        sheet.getRange(existing, 3).setValue("prxdjay.com");
        sheet.getRange(existing, 4).setValue(CONSENT_TEXT);
        sheet.getRange(existing, 5).setValue("active");
        sheet.getRange(existing, 8).clearContent();
        result = "resubscribed";
      } else {
        result = "duplicate";
      }
    } else {
      sheet.appendRow([now, email, "prxdjay.com", CONSENT_TEXT, "active", now, 1, ""]);
      result = "saved";
    }
    SpreadsheetApp.flush();
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    result = "error";
  } finally {
    try { lock.releaseLock(); } catch (ignored) {}
  }

  return redirectResult_(result);
}

function normalizeEmail_(value) {
  var email = String(value || "").trim().toLowerCase();
  if (email.length > 254) return "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function ensureHeaders_(sheet) {
  var current = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  for (var i = 0; i < HEADERS.length; i += 1) {
    if (current[i] !== HEADERS[i]) throw new Error("Unexpected subscriber sheet headers");
  }
}

function findEmail_(sheet, email) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  var match = sheet.getRange(2, 2, lastRow - 1, 1)
    .createTextFinder(email)
    .matchCase(false)
    .matchEntireCell(true)
    .findNext();
  return match ? match.getRow() : 0;
}

function redirectResult_(status) {
  var allowed = { saved: true, duplicate: true, resubscribed: true, invalid: true, error: true };
  var safe = allowed[status] ? status : "error";
  var destination = "https://prxdjay.com/signup-result.html?status=" + encodeURIComponent(safe);
  var escaped = destination.replace(/&/g, "&amp;").replace(/\"/g, "&quot;");
  return HtmlService.createHtmlOutput(
    "<!doctype html><meta charset=\"utf-8\"><meta http-equiv=\"refresh\" content=\"0;url=" + escaped + "\">" +
    "<title>Email signup</title><p>Returning to PRXD.JAY.</p>"
  ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
