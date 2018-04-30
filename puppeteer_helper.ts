//-------------------------------- Require --------------------------------//
import { Page } from "puppeteer"; // Library that contains headless chrome
//-------------------------------- Const --------------------------------//
const PAGE_LOAD_DELAY = 3500;
const TIMEOUT = 9000; // More than the average page load time
//-------------------------------- Functions --------------------------------//

export async function clickNavigate(page: Page, clickOn: string) {
    const [response] = await Promise.all([
      page.waitForNavigation({timeout: TIMEOUT, waitUntil: "load"}),
      page.click(clickOn, {
        button: "left", // choose mouse button - left, right or middle. Default is left
        clickCount: 1,
        delay: 0 // Time to wait between mousedown and mouseup in milliseconds. Defaults to 0.
      })]);
    
    if(!response.ok()){
      throw "Page wasn't successfully listed - Status code wasn't between 200-299";    
    };
  }

  // Navigate to URL
export async function navigateTo(page: Page, url: string, waitFor = PAGE_LOAD_DELAY) {
    await page.goto(url);
  }