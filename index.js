const puppeteer = require('puppeteer-extra')
const cheerio = require('cheerio');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const express = require('express');

const SCRAP_LIMIT = 500;
puppeteer.use(StealthPlugin())

const app = express();
app.use(express.json())

async function get_browser() {
  const browser = await puppeteer.launch({
    headless: true,
  });

  return browser;
}

async function get_page(browser) {
  var page = await browser.newPage();
  page.on('dialog', async (dialog) => {
    console.log('Alter Box closed');
    await dialog.dismiss();
  });
//   await page.setDefaultTimeout(300 * 1000);
//   await page.setDefaultNavigationTimeout(300 * 1000);
  await page.setViewport({ width: 1280, height: 800 }); //await page.setViewport({ width: 1440, height: 870 });

  return page;
}

async function start_main(page, url) {
  await page.goto(
    url,
    { waitUntil: 'networkidle0' }
  );

//   await page.waitForTimeout(30000);

  console.log('Starting');
  await page.waitForSelector('.eo72wou0');

//   await page.waitForTimeout(10000);

  let els = await page.$$(`.eo72wou0`);

  while (true) {
    try {
      await page.evaluate((el) => {
        el.scrollIntoView();
      }, els[els.length - 1]);
    } catch (error) {
      console.log(error);
    }

    await page.waitForTimeout(15000);

    let new_els = await page.$$(`.eo72wou0`);
    if (new_els.length > els.length || new_els > SCRAP_LIMIT) {
      els = new_els;
      console.log('Total', els.length);
    } else {
      break;
    }
  }
}

async function parse_list(html) {
  // list

  let $ = cheerio.load(html);

  let results = $(`.eo72wou0`);
  let comments = []

  for (let res of results) {
    try {
      let comment = $(res).find('.e1g2efjf6').text();
      console.log(comment);
      comments.push(comment);
    } catch (error) {
      console.log(error);
    }
  }

  console.log(results.length);
  return comments;
}

async function start(url) {
  let b = await get_browser();

  let page = await get_page(b);

  await start_main(page,url);

  let comments = await parse_list(await page.content());
  await b.close();
  return comments;
}

app.get('/tiktok', async (req,res) => {
    const comments = await start(req.query.url || 'https://www.tiktok.com/@ahmii214/video/7236436802993802501');
    return res.send(comments);
})

app.listen(8000, () => {
    console.log('Server on 8000')
})