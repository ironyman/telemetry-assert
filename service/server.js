'use strict';
const express = require('express');
const serverless = require('serverless-http');
const fetch = require('node-fetch');
const morgan = require('morgan');
const crypto = require("crypto");
const cors = require('cors');
var escapeHtml = require('escape-html');

const db = require('../lib/db');
const github = require('../lib/github');

const app = express();

app.use(morgan('combined'));

const router = express.Router();

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
<script src="https://ironyman.github.io/telemetry-assert/client/telemetry-assert.js"></script>
<script>
  let tele = new Telemetry({
    owner: "githubusername",
    repo: "githubrepo",
    installationId: ${req.query.installation_id},
    // Set teleAssertUrl to falsy to fallback to console.assert only.
    // teleAssertUrl: ""
  });
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
  
  let stackTrace = require('../lib/privacy').strip_paths(req.body.stackTrace);

  let existingIssue = await db.AssertionModel
    .findOne({ id })
    .populate('user')
    .exec();

  if (existingIssue) {
    console.debug("Found existing issue", existingIssue);
    let issue = await github.createOrUpdateIssue({
      owner: req.body.owner,
      repo: req.body.repo,
      installationId: req.body.installationId,
      message: req.body.message,
      stackTrace,
      issueNumber: existingIssue.issueNumber,
      count: existingIssue.count,
    });
    if (issue.status >= 200 && issue.status < 300) {
      console.debug("Updated issue");
      existingIssue.count += 1;
      await existingIssue.save();
      res.end(JSON.stringify({ message: 'ok' }));
      return;
    } else if (issue.status != 410) {
      // If status is 410 that means the issue was deleted we'll try to recreate.
      // Otherwise something went wrong.
      console.debug("Failed to update existing issue in github", issue);
      res.end(JSON.stringify({ message: "Failed to update issue" }));
      return;
    }
    console.debug("Failed to find existing issue in github, recreating");
    await existingIssue.remove();
  }

  let issue = await github.createOrUpdateIssue({
    owner: req.body.owner,
    repo: req.body.repo,
    installationId: req.body.installationId,
    message: req.body.message,
    stackTrace,
  });

  if (issue.status < 200 || issue.status >= 300 || !issue.data) {
    console.debug("Failed to create issue", issue);
    res.end(JSON.stringify({ message: "Failed to create issue" }));
    return;
  }
  
  console.debug("Created issue");

  let assertion = new db.AssertionModel({
    id,
    // file: req.body.file,
    // stackTrace,
    count: 1,
    // issueUrl: issue.data.html_url,
    issueNumber: issue.data.number,
    // message: req.body.message,
    user: user._id,
  });
  await assertion.save();

  res.end(JSON.stringify({ message: "ok" }));
});


const corsOptions = {
  origin: '*',
}

//allow OPTIONS on all resources
app.options('/*', cors(corsOptions))
app.use(cors(corsOptions));
app.use(express.json());
app.use('/.netlify/functions/server', router);  // path must route to lambda

console.log("Started with client id " + process.env.GITHUB_CLIENT_ID);

module.exports = app;
module.exports.handler = serverless(app);