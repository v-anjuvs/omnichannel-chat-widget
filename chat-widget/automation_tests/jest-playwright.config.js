const testdata = require("./configuration/testsettings.json");
module.exports = {
  webServer: {
    command: 'npm run build-sample',
    port: 3000,
    timeout: 120 * 1000,
  },
  browsers: process.env.browsers ? JSON.parse(process.env.browsers) : testdata.browsers,
  devices: process.env.devices ? JSON.parse(process.env.devices) : testdata.devices,
  launchBrowserApp: {
    headless: testdata.launchBrowserSettings.headless,
    args: testdata.launchBrowserSettings.args,
    slowMo: testdata.launchBrowserSettings.slowMo,
  }
}