Make `assert` useful in production. Create a Github issue if assertion is false.
```
<script src="https://ironyman.github.io/telemetry-assert/client/telemetry-assert.js"></script>
<script>
  let tele = new Telemetry({
    owner: "ironyman",
    repo: "telemetry-assert",
    installationId: 17799509,
    // Set teleAssertUrl to falsy to fallback to console.assert only.
    // teleAssertUrl: ""
  });
  // calls console.assert() and creates a issue in Github repo ironyman/telemetry-assert.
  tele.assert(false, "hello this is a bug please fix.");
</script>
```
Or with npm package.
```
const { Telemetry } = require('telemetry-assert');

const tele = new Telemetry({
  owner: "ironyman",
  repo: "telemetry-assert",
  installationId: 17799509,
  // Set teleAssertUrl to falsy to fallback to console.assert only.
  // teleAssertUrl: ""
})

tele.assert(false, "hello this is a bug please fix.");
```
# Installation

The Github app needs to be installed [here](https://github.com/apps/telemetry-assert/installations/new). Permission to create issues is needed.

The client is in npm registry:
```
$ npm install telemetry-assert
```

## Installation ID
`installationId` relates this Github app to an account that installs this Github app. [Install page](https://github.com/apps/telemetry-assert/installations/new) should show the installation ID at the end of the install process. It's also listed in [installed apps](https://github.com/settings/installations) page. The installation ID is the last path component in URL of each installed app.

# Server
## Test server locally
Environment variables are set from key value pairs in `/.env`.
```
npx netlify-cli dev
```

## Push server to production
```
npx netlify-cli deploy -d . --prod
```