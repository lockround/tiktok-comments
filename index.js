const puppeteer = require("puppeteer-extra");
const { DEFAULT_INTERCEPT_RESOLUTION_PRIORITY } = require("puppeteer");
const cheerio = require("cheerio");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const express = require("express");
// const PortalPlugin = require('puppeteer-extra-plugin-portal')
const cors = require("cors");

const app = express();
app.use(cors());
puppeteer.use(require("puppeteer-extra-plugin-anonymize-ua")());
puppeteer.use(StealthPlugin());
// puppeteer.use(
//   PortalPlugin({
//     webPortalConfig: {
//         // When used as middleware, you'll need to provide the baseUrl if it's anything but `http://localhost:3000`
//         baseUrl: 'http://localhost:3001',
//       },
//   })
// )
puppeteer.use(
  require("puppeteer-extra-plugin-block-resources")({
    blockedTypes: new Set(["image", "stylesheet"]),
    // Optionally enable Cooperative Mode for several request interceptors
    interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
  })
);

app.use(express.json());
app.get("/tiktok", async (req, res) => {
  const url =
    req.query.url ||
    "https://www.tiktok.com/@eyeinspired/video/7252706573519310122";
  puppeteer
    .launch({ headless: "new" })
    .then(async (browser) => {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: "domcontentloaded" });
      // https://www.tiktok.com/@eyeinspired/video/7252706573519310122

      const data = await page.evaluate(
        () => document.querySelector("*").outerHTML
      );
      let $ = cheerio.load(data);
      if ($("[data-e2e=modal-close-inner-button]").length > 0) {
        await page.click("[data-e2e=modal-close-inner-button]");
      }
      let comments = {};
      $("[data-e2e=comment-username-1]").map((i, el) => {
        let username = $(el).text();
        comments[i] = { username };
      });
      $("[data-e2e=comment-level-1]").map((i, el) => {
        let comment = $(el).text();
        comments[i] = { ...comments[i], comment };
      });
      // await page.waitForTimeout(500000)

      // console.log(comments);
      await page.screenshot({ path: "example.png" });
      await browser.close();
      return res.send(comments);
    })
    .catch((err) => {
      console.log(err);
      return res.send("error occured");
    });
});

app.listen(8000, () => {
  console.log("server listening on 8000");
});
