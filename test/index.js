const { exec } = require('child_process');
const { chromium } = require('playwright');

const env = {
    PORT: 40051,
    INSTALLATION_ID: 17799509,
}

async function test_node() {
    await exec('node ../example/node.js', { env });
}

async function test_browser() {
    exec('node ../example/browser.js', { env });

    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(`http://localhost:${PORT}`);
    await page.waitForSelector("text=Finished")
    await browser.close();
}