const http = require('http');

const requestListener = function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });

  let installationId = Number(process.env.INSTALLATION_ID || 17799509);
  let teleAssertUrl = process.env.TELE_ASSERT_URL;

  let example = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<script src="${teleAssertUrl ? "http://localhost:8888/client/telemetry-assert.js" : "https://ironyman.github.io/telemetry-assert/client/telemetry-assert.js"}"></script>
<script>
  let tele = new Telemetry({
    owner: "ironyman",
    repo: "telemetry-assert",
    installationId: ${installationId},
    // Set teleAssertUrl to falsy to fallback to console.assert only.
    // teleAssertUrl: ""
  });

  let teleAssertUrl = "${teleAssertUrl}";
  if (teleAssertUrl) {
    tele.teleAssertUrl = teleAssertUrl;
  }

  // calls console.assert() and creates a issue in Github repo githubusername/githubrepo.
  tele.assert(false, "hello this is a bug please fix.").then(() => document.body.innerHTML = "Finished");
</script>
</head>
<body>
Hello world
</body>
</html>
    `.trim();
  res.end(example);
  console.log("Served for installation " + installationId);
}

const port = process.env.PORT || 40051;
const server = http.createServer(requestListener);
server.listen(port);
console.log("Started listening on " + port);