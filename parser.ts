import cheerio from 'cheerio';
import puppeteer from 'puppeteer';

export const getStonFiPools = async (): Promise<
  {
    pool: string;
    farm: string;
    apr24h: string;
  }[]
> => {
  try {
    // Launch a headless browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Navigate to the page
    await page.goto(
      'https://app.ston.fi/pools?selectedTab=ALL_POOLS&sortBy=POPULARITY_DESC&search=&farmingAvailable=true',
      { waitUntil: 'networkidle0' }
    ); // Adjust the URL to the actual SPA URL
    await page.setViewport({
      width: 800,
      height: 1000,
    });

    // Wait for the specific elements to load if necessary
    // For example, wait for the container that holds the data
    await page.waitForSelector('ul'); // Change this selector to the actual one

    // Get the HTML of the page and pass it to cheerio
    const html = await page.content();
    const $ = cheerio.load(html);

    // Parse the HTML for the desired data
    const results: {
      pool: string;
      farm: string;
      apr24h: string;
    }[] = [];
    $('ul a li').each((index, element) => {
      // Use the correct selector for the data items
      const pool = $(element).find('p .truncate').toArray();
      const farm = $(element).find('span p').toArray();

      results.push({
        pool: $(pool[0]).text(),
        farm: $(farm[0]).text().replace('Farm ', ''),
        apr24h: $(pool[1]).text(),
      });
    });

    console.log(results);

    // Close the browser
    await browser.close();

    return results;
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const getDedustPools = async (): Promise<
  {
    pool: string;
    farm: string;
    apr24h: string;
  }[]
> => {
  try {
    // Launch a headless browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Navigate to the page
    await page.goto('https://dedust.io/pools?sort=apy-DESC', {}); // Adjust the URL to the actual SPA URL
    await page.setViewport({
      width: 1920,
      height: 1080,
    });

    // Wait for the specific elements to load if necessary
    // For example, wait for the container that holds the data
    await page.waitForSelector('.app-earn__content-table'); // Change this selector to the actual one

    // Get the HTML of the page and pass it to cheerio
    const html = await page.content();
    const $ = cheerio.load(html);

    // Parse the HTML for the desired data
    const results: {
      pool: string;
      farm: string;
      apr24h: string;
    }[] = [];

    $('.app-earn__content-table a').each((index, element) => {
      // Use the correct selector for the data items
      const poolName = $(element)
        .find('.app-earn__content-table-cell-pool-name')
        .text();
      const apr = $(element).find('.app-earn__content-table-cell-text').text();

      results.push({
        pool: poolName,
        farm: '',
        apr24h: apr.replace(' / ', ''),
      });
    });

    console.log(results);

    // Close the browser
    await browser.close();

    return results;
  } catch (err) {
    console.log(err);
    return [];
  }
};
