const { Octokit } = require("@octokit/rest");
const { createAppAuth } = require("@octokit/auth-app");

async function createOrUpdateIssue({ owner, repo, installationId, message, stackTrace, issueNumber = -1, count = 1 }) {
  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID,
      privateKey: Buffer.from(process.env.GITHUB_PRIVATE_KEY, 'base64').toString('ascii'),
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      installationId: installationId,
    },
  });

  const issueBody = `
Message:
${message}

Stack trace:
\`\`\`
${stackTrace.join("\n")}
\`\`\`

Count: ${count}
    `.trim();
  const issueTitle = `Telemetry assert: ${message.substring(0, 20)}`;
  let issueObj = {
    owner: owner,
    repo: repo,
    title: issueTitle,
    body: issueBody,
  };

  if (issueNumber == -1) {
    let issue = await octokit.rest.issues.create(issueObj).catch(e => {
      console.error(e);
      return e;
    });
    return issue;
  } else {
    issueObj.issue_number = issueNumber;
    let issue = await octokit.rest.issues.update(issueObj).catch(e => {
      console.error(e);
      return e;
    });
    return issue;
  }
}

module.exports = {
  createOrUpdateIssue,
}