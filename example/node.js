const { Telemetry } = require('telemetry-assert');

// You would probably hard code this.
let installationId = Number(process.env.INSTALLATION_ID || 17793509);

const tele = new Telemetry({
  owner: "ironyman",
  repo: "telemetry-assert",
  installationId: installationId,
  // Set teleAssertUrl to falsy to fallback to console.assert only.
  // teleAssertUrl: ""
})

tele.assert(false, "hello this is a bug please fix.");