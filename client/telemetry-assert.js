class Telemetry {
  constructor({ owner, repo, installationId, teleAssertUrl = "https://haec.xyz/.netlify/functions/server/assert" }) {
    this.owner = owner;
    this.repo = repo;
    this.installationId = installationId;
    this.teleAssertUrl = teleAssertUrl;
  }

  // A simple assertion test that verifies whether condition is truthy. 
  // If it is not, arguments are passed to console.assert and telemetry
  // is sent to github and a github issue is created.
  // If it is then nothing happens.
  // Returns a promise when telemetry completes for testing purposes.
  assert(condition, message) {
    if (!condition) {
      console.assert(...arguments);

      if (this.teleAssertUrl) {
        let fetch2;

        if (typeof fetch == 'undefined') {
          fetch2 = require('node-fetch');
        } else {
          fetch2 = fetch;
        }

        return fetch2(this.teleAssertUrl, {
          method: 'POST',
          cors: 'no-cors',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            installationId: this.installationId,
            owner: this.owner,
            repo: this.repo,
            stackTrace: new Error().stack.split("\n"),
            message,
          }),
        }).catch(e => {
          console.error("Telemetry assert failed to send telemetry", e);
        });
      }
    }
    return Promise.resolve();
  }
}

if (typeof module !== 'undefined') {
  module.exports = {
    Telemetry,
  };
}