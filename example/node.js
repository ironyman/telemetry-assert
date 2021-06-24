const { Telemetry } = require('telemetry-assert');

// You would probably hard code this.
let installationId = Number(process.env.INSTALLATION_ID || 17799509);
// For local testing.
let teleAssertUrl = process.env.TELE_ASSERT_URL;

const tele = new Telemetry({
  owner: "ironyman",
  repo: "telemetry-assert",
  installationId: installationId,
  // Set teleAssertUrl to falsy to fallback to console.assert only.
  // teleAssertUrl: ""
})

if (teleAssertUrl) {
  tele.teleAssertUrl = teleAssertUrl;
}

tele.assert(false, "hello this is a bug please fix.").then(r => console.log("assert result", r));