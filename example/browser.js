const http = require('http');

const requestListener = function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });

    let installationId = Number(process.env.INSTALLATION_ID || req.query.installationId || 17793509);

  let example = `
<!DOCTYPE html>
<html lang="en">
<head>
<script src="https://raw.githubusercontent.com/ironyman/telemetry-assert/current/client/telemetry-assert.js"></script>
<script>
  let tele = new Telemetry({
    owner: "ironyman",
    repo: "telemetry-assert",
    installationId: ${installationId},
    // Set teleAssertUrl to falsy to fallback to console.assert only.
    // teleAssertUrl: ""
    );
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
  console.log("Served for installation " + req.query.installationId);
}

const port = process.env.PORT || 40051;
const server = http.createServer(requestListener);
server.listen(port);
console.log("Started listening on " + port);