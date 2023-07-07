import { default as puppeteer } from "https://deno.land/x/puppeteer@9.0.0/mod.ts";
import { Application, Router } from "https://deno.land/x/oak@v7.3.0/mod.ts";
import { cheerio } from "https://deno.land/x/denocheerio/mod.ts";

const BROWSERLESS_TOKEN = Deno.env.get("BROWSERLESS_TOKEN");
if (BROWSERLESS_TOKEN === undefined) {
  throw new TypeError("Missing BROWSERLESS_TOKEN environment variable.");
}

const router = new Router();

router.get("/tiktok", async (ctx) => {
  const rawUrl =
    ctx.request.url.searchParams.get("url") ||
    "https://www.tiktok.com/@twinsfromrussia/video/7250965295345503530";
  let url: URL;
  try {
    url = new URL(rawUrl ?? "");
  } catch {
    ctx.response.body = "Invalid URL";
    ctx.response.status = 400;
    return;
  }
  if (url.host == "screenshot.deno.dev") {
    ctx.response.body = "Nope!";
    ctx.response.status = 400;
    return;
  }

  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${BROWSERLESS_TOKEN}`,
  });
  try {
    const page = await browser.newPage();
    await page.goto(
      url.href ||
        "https://www.tiktok.com/@eyeinspired/video/7252706573519310122",
      { waitUntil: "domcontentloaded" }
    );
    // await page.waitForTimeout(5000)
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
    console.log(comments);
    ctx.response.body = comments;
    ctx.response.type = "text";
  } finally {
    await browser.close();
  }
});

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

app.addEventListener("error", (err) => console.error(err.message));

addEventListener("fetch", app.fetchEventHandler());
