const puppeteer = require("puppeteer-extra");
const cheerio = require("cheerio");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
puppeteer.use(StealthPlugin());
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
      if ($("[data-e2e=modal-close-inner-button]")) {
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
      await browser.close();
      return res.send(comments);
    })
    .catch((err) => {
      return res.send("error occured");
    });
});

app.listen(8000, () => {
  console.log("server listening on 8000");
});
