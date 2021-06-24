'use strict';
const express = require('express');
const serverless = require('serverless-http');
const fetch = require('node-fetch');
const morgan = require('morgan');
const { Octokit } = require("@octokit/rest");
const { createAppAuth } = require("@octokit/auth-app");
const crypto = require("crypto");
const cors = require('cors');
var escapeHtml = require('escape-html');

const db = require('./db.js');

const app = express();

app.use(morgan('combined'));

const router = express.Router();

const corsOptions = {
  origin: '*',
}

//allow OPTIONS on all resources
app.options('/*', cors(corsOptions))
app.use(cors(corsOptions));

router.get('/', async (req, res) => {
  let ping = await db.PingModel.findOne({}) || new db.PingModel({ count: 0 });
  ping.count += 1;
  await ping.save();

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<h1>Hello from Express.js!</h1>' + ping.count);

  res.write(escapeHtml('<script>alert("HI");</script>'));
  res.end();
});

router.get('/github/callback', async (req, res) => {
  if (req.query.setup_action == 'install') {
    console.log("installation_id=" + req.query.installation_id);
  }

  let result = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: req.query.code,
      accept: 'json',
    }),
  }).then(d => d.json());

  if (!result || !result.access_token) {
    res.end("Invalid code");
    return;
  }
  let user = new db.UserModel({ installationId: req.query.installation_id, accessToken: result.access_token });
  let err = await user.save();

  let example = `
<script src="https://raw.githubusercontent.com/ironyman/telemetry-assert/current/client/telemetry-assert.js"></script>
<script>
  let tele = new Telemetry({
    owner: "githubusername",
    repo: "githubrepo",
    installationId: ${req.query.installation_id},
    // Set teleAssertUrl to falsy to fallback to console.assert only.
    // teleAssertUrl: ""
    );
  // calls console.assert() and creates a issue in Github repo githubusername/githubrepo.
  tele.assert(false, "hello this is a bug please fix.");
</script>
    `.trim();

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
<pre>
Your installationId is ${req.query.installation_id}
It can also be found in the url of each app in <a href="https://github.com/settings/installations">https://github.com/settings/installations</a>

For more instructions see <a href="https://github.com/ironyman/telemetry-assert/">Github page</a>.

Example usage:
${escapeHtml(example)}
</pre>
    `.trim());
});

// Expect in body installationId, stackTrace, owner, repo, message
router.post('/assert', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  let user = await db.UserModel
    .findOne({ installationId: req.body.installationId });

  if (!user) {
    res.end(JSON.stringify({ message: "Invalid installationId" }));
    return
  }
  const id = await crypto.createHash("SHA256")
    .update(Buffer.from(req.body.stackTrace.join("\n")))
    .digest()
    .toString("hex");

  let existingIssue = await db.AssertionModel
    .findOne({ id })
    .populate('user')
    .exec();

  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID,
      privateKey: Buffer.from(process.env.GITHUB_PRIVATE_KEY, 'base64').toString('ascii'),
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      installationId: req.body.installationId,
    },
  });

  if (existingIssue === null) {
    let issue = await octokit.rest.issues.create({
      owner: req.body.owner,
      repo: req.body.repo,
      title: `Telemetry assert: ${req.body.message.substring(0, 20)}`,
      body: `
Message:
${req.body.message}

Stack trace:
\`\`\`
${req.body.stackTrace.join("\n")}
\`\`\`

Count: 1
            `.trim(),
    }).catch(e => {
      console.error(e);
      return null;
    });
    if (!issue) {
      console.log("Failed to create github issue");
      res.end(JSON.stringify({ message: "Failed to create github issue" }));
      return;
    }
    let assertion = new db.AssertionModel({
      id,
      // file: req.body.file,
      // stackTrace: req.body.stackTrace,
      count: 1,
      // issueUrl: issue.data.html_url,
      issueNumber: issue.data.number,
      // message: req.body.message,
      user: user._id,
    });
    await assertion.save();
  } else {
    existingIssue.count += 1;
    await existingIssue.save();
    let updated = await octokit.rest.issues.update({
      owner: req.body.owner,
      repo: req.body.repo,
      issue_number: existingIssue.issueNumber,
      title: `Telemetry assert: ${req.body.message.substring(0, 20)}`,
      body: `
Message:
${req.body.message}

Stack trace:
\`\`\`
${req.body.stackTrace.join("\n")}
\`\`\`

Count: ${existingIssue.count}
        `.trim()
    }).catch(e => {
      console.error(e);
      return null;
    });
    if (!updated) {
      console.log("Failed to update github issue");
      res.end(JSON.stringify({ message: "Failed to update github issue" }));
      return;
    }
    console.log(updated);
    console.log("Updated github issue");
  }
  res.end(JSON.stringify({ message: "ok" }));
});

app.use(express.json());
app.use('/.netlify/functions/server', router);  // path must route to lambda

console.log("Started with client id " + process.env.GITHUB_CLIENT_ID);

module.exports = app;
module.exports.handler = serverless(app);