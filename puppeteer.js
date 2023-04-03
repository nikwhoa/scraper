// Import puppeteer
import puppeteer from 'puppeteer';

(async () => {
  // Launch the browser
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
  });

  // Create a page
  const page = await browser.newPage();

  // Go to your site
  await page.goto('https://www.theverge.com/tech');

  // get links from divs with class duet--content-cards--content-card
  const links = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('div.duet--content-cards--content-card a'));
    return anchors.map(anchor => anchor.href);
  });

  console.log(links);

  // Do something with element...
  // await element.click(); // Just an example.

  // Dispose of handle
  // await element.dispose();

  // Close browser.
  await browser.close();
})();
