const { exec } = require('child_process');
const { chromium } = require('playwright');

const env = {
  PORT: 40051,
  INSTALLATION_ID: 17799509,
  TELE_ASSERT_URL: "http://localhost:8888/.netlify/functions/server/assert",
}

async function test_node() {
  let result = await exec('node ../example/node.js', { env });
  result.stdout.on('data', function (data) {
    console.log(data);
  });
  // result.stdout.pipe(process.stdout);
}

async function test_browser() {
  let server = exec('node ../example/browser.js', { env });

  await new Promise(r => setTimeout(r, 1000));

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(`http://localhost:${env.PORT}`);
  await page.waitForSelector("text=Finished")
  await browser.close();

  server.kill('SIGINT');
  process.exit(0);
}

process.chdir(__dirname);
test_node();
test_browser();