//-------------------------------- Require --------------------------------//
import puppeteer = require('puppeteer'); // Library that contains headless chrome
import { Page, NavigationOptions } from "puppeteer"; // Library that contains headless chrome
import * as Papa from "papaparse"; // Library for parsing CSV and JSON
import { ListingInfo } from "./classes_interfaces";
import * as csv_handler from "./csv_handler"; // contains parse and unparse functions
import * as g_handler from "./gereric_helper"; // contains generic functions
import * as pup_helper from "./puppeteer_helper"; // Generic puppeteer functions
const CREDS = require('./creds'); // credentials - user information
const argv = require('yargs') // Allowing command args and specificing commands
  .command('update', '- Update Current CSV File')
  .command('relist', '- Relist All Chosen Listings')
  .command('createNew', '- Creates a New File with Default Values (Overwrites Old File)')
  .help()
  .argv;
// ------------------------------------------------- Selectors --------------------------------//
const USERNAME_SELECTOR = '#Username';
const PASSWORD_SELECTOR = '#Password';
const BUTTON_SELECTOR = '#btnLogin';
const EXIT_ADV_SELECTOR = '#x-mark-icon';
// Related to the email and username selectors of each user
// ------------------------------------------------- Unsold Selectors --------------------------------//
const NUM_OF_PAGES_ID = 'ctl00_ctl00_ctlPagePlaceHolder_MyGBContentPlaceHolder_ctlUnsoldView_ctlPager_ctlPageIndex';
const NEXT_PAGE_SELECTOR = '#ctl00_ctl00_ctlPagePlaceHolder_MyGBContentPlaceHolder_ctlUnsoldView_ctlPager_ctlNext';
// ------------------------------------------------- Relist Selectors --------------------------------//
const RELIST_WITH_CHANGES_SELECTOR = '#listing-information > div > div.panel-body > a';
const CONTINUE_RELISTING_THIS_ITEM_SELECTOR = '#ctl00_ctl00_ctlPagePlaceHolder_ctlContentPaneBodyPlaceHolder_btnConfirmRelist';
const SUBTITLE_SELECTOR = '#ctl00_ctl00_ctlPagePlaceHolder_ctlContentPaneBodyPlaceHolder_ctlItemEditor_chkSubtitle';
const SUBTITLE_TXT_SELECTOR = '#ctl00_ctl00_ctlPagePlaceHolder_ctlContentPaneBodyPlaceHolder_ctlItemEditor_txtSubtitle';
const DURATION_SELECTOR = '#ctl00_ctl00_ctlPagePlaceHolder_ctlContentPaneBodyPlaceHolder_ctlItemEditor_ddlFixedPriceDuration';
const QUANTITY_SELECTOR = '#ctl00_ctl00_ctlPagePlaceHolder_ctlContentPaneBodyPlaceHolder_ctlItemEditor_txtQuantity';
const FIXED_PRICE_SELECTOR = '#ctl00_ctl00_ctlPagePlaceHolder_ctlContentPaneBodyPlaceHolder_ctlItemEditor_lnkFixedPrice';
const SHOWCASE_LISTING_SELECTOR = '#ctl00_ctl00_ctlPagePlaceHolder_ctlContentPaneBodyPlaceHolder_ctlItemEditor_chkShowcase';
const FEATURED_LISTING_SELECTOR = '#ctl00_ctl00_ctlPagePlaceHolder_ctlContentPaneBodyPlaceHolder_ctlItemEditor_chkFeatured';
const SPONSORED_LISTING_SELECTOR = '#ctl00_ctl00_ctlPagePlaceHolder_ctlContentPaneBodyPlaceHolder_ctlItemEditor_chkSponsored';
const HIGHLIGHT_SELECTOR = '#ctl00_ctl00_ctlPagePlaceHolder_ctlContentPaneBodyPlaceHolder_ctlItemEditor_chkHighlight';
const BOLDFACE_TITLE_SELECTOR = '#ctl00_ctl00_ctlPagePlaceHolder_ctlContentPaneBodyPlaceHolder_ctlItemEditor_chkBoldface';
const COLORED_TITLE_SELECTOR = '#ctl00_ctl00_ctlPagePlaceHolder_ctlContentPaneBodyPlaceHolder_ctlItemEditor_chkColored';
const COLORED_TITLE_COLOR_SELECTOR = '#ctl00_ctl00_ctlPagePlaceHolder_ctlContentPaneBodyPlaceHolder_ctlItemEditor_ddlFontColorList';
const VIEW_COUTER_SELECTOR = '#ctl00_ctl00_ctlPagePlaceHolder_ctlContentPaneBodyPlaceHolder_ctlItemEditor_chkCounter';
const THUMBNAIL_IMAGE_SELECTOR = '#ctl00_ctl00_ctlPagePlaceHolder_ctlContentPaneBodyPlaceHolder_ctlItemEditor_chkThumbnail';
const CONTINUE_SELECTOR = '#ctl00_ctl00_ctlPagePlaceHolder_ctlContentPaneBodyPlaceHolder_btnContinue';
const NEW_ITEM_ID_SELECTOR = '#NewID0';
//-------------------------------- Constants --------------------------------//
const LOGIN_URL = 'https://www.gunbroker.com/user/login';
const UNSOLD_URL = 'https://www.gunbroker.com/MySite/MyAuctions/Unsold.aspx';
const PAGE_LOAD_DELAY = 3000; // ms
const CSV_PATH = './csv/';
const CSV_FILE_NAME = 'relist_info.csv';
const CSV_FULL_PATH = CSV_PATH + CSV_FILE_NAME;
const QUANTITY = "50"; // Value for quantity in each relisted product page
const DURATION = 90; // Duration of the listing - Accepted values are 30,60,90
const HEADLESS_SETTING: boolean = true; // true if you want to hide the browser
const TIMEOUT = 9000; // ms
const NUM_ERR_ITERATION = 2;
//-------------------------------- Functions --------------------------------//

main();

async function main() {
  var userDecision: string = UI() // Getting user decision as a command line argument
  // Get Listing Info
  if (userDecision == 'update') {
    await updateListingInfo();
  }
  // Relist Items
  else if (userDecision == 'relist') {
    await relistProducts();
  }
  // creating a new csv file. Overwrite old version if available.
  else if (userDecision == 'create') {
    await createNewCSVFromWeb();
  }
  // error in input
  else {
    console.log("Please enter acceptable arguments. use \"--help\" for more information");
  }
  console.log("Program Finished");
}

// Getting user decision as an command line argument
function UI() {
  if (argv._ == 'update') {
    console.log('Updating CSV File');
    return "update";
  }
  else if (argv._ == 'relist') {
    console.log('Relisting!');
    return "relist";
  }
  else if (argv._ == 'createNew') {
    console.log('Creating a New File with Default Settings (Overwrites any old one)');
    return "create";
  }
  else {
    console.log('Please use help for examples');
    return null;
  }
}
// ------------------------------------------------- Main Functions --------------------------------//
async function updateListingInfo() {
  const browser = await puppeteer.launch({
    headless: HEADLESS_SETTING // true if you want to hide the browser
  });
  var webListingInfo = []; // Holds all the information about the listings on the internet.
  var csvListingInfo = []; // Holds all the information about the listings inside the CSV file
  var unlistedListings = []; // Holds only the unlisted listings from the webListingInfo array
  var newListingArray = []; // Holds the finished array after comparing both csv and unlisted listings arrays and updating csvArray accodignly
  // ----------- Navigation -----------//
  await logIn(browser);
  const unsoldPage = await browser.newPage();
  await pup_helper.navigateTo(unsoldPage, UNSOLD_URL);
  console.log("Getting Listing Info");
  // ----------- Getting listing info -----------//
  webListingInfo = await getListingInfo(unsoldPage); // returning an array with all the listings titles, links and relist value
  // webListingInfo = convertToListingInfo(webListingInfo);
  await unsoldPage.close();
  console.log("Done: Getting Listing Info");
  // ----------- Updating the CSV -----------//
  csvListingInfo = csv_handler.csvToJson(CSV_FULL_PATH); // Creating an array from the csv file
  unlistedListings = buildUnlistedArray(webListingInfo);
  newListingArray = combineArrays(csvListingInfo, unlistedListings);
  console.log("finished creating accumulated array");
  csv_handler.exportArrToCSV(newListingArray, CSV_FULL_PATH);
  browser.close();
}

async function relistProducts() {
  const browser = await puppeteer.launch({
    headless: HEADLESS_SETTING // true if you want to hide the browser
  });
  await logIn(browser);
  // ------ Getting information from csv ------ //
  var csvListingInfo = [];
  csvListingInfo = csv_handler.csvToJson(CSV_FULL_PATH); // Creating an array from the csv file
  const listingPage = await browser.newPage();
  // ------ Relisting ------ //
  csvListingInfo = await relistAll(csvListingInfo, listingPage);
  csv_handler.exportArrToCSV(csvListingInfo, CSV_FULL_PATH);
  await listingPage.close();
  browser.close();
}

// Overwrite the current csv with a new one from the web. All info is defaulted
async function createNewCSVFromWeb() {
  const browser = await puppeteer.launch({
    headless: HEADLESS_SETTING // true if you want to hide the browser
  });
  var webListingInfo = []; // Holds all the information about the listings on the internet.
  var newListingArray = []; // Holds the finished array after comparing both csv and unlisted listings arrays
  // ----- Login and Navigation ------ //
  await logIn(browser);
  const unsoldPage = await browser.newPage();
  await pup_helper.navigateTo(unsoldPage, UNSOLD_URL);
  // ----- Getting info and exporting ------ //
  console.log("Getting Listing Info");
  webListingInfo = await getListingInfo(unsoldPage); // returning an array with all the listings titles, links and relist value
  newListingArray = convertToListingInfo(webListingInfo);
  await unsoldPage.close();
  csv_handler.exportArrToCSV(newListingArray, CSV_FULL_PATH);
  browser.close();
}

async function getListingInfo(page: Page) {
  var listingInfo = []; // Holding all the listings information
  const numOfPages = await getNumOfPages(page);
  // Iterating the pages
  for (let i = 1; i <= numOfPages; i++) {
    console.log("Getting info from page:", i);
    let data = await getPageData(page);
    listingInfo = listingInfo.concat(data);
    // Stop navigating when we are on the last page.
    if (i != numOfPages) {
      await pup_helper.clickNavigate(page, NEXT_PAGE_SELECTOR);
    }
  }
  return listingInfo;
}

// Returning an array of object with the relevent information we need from each listing
async function getPageData(page: Page) {
  return (await page.evaluate(() => {
    const isListed = (node: HTMLElement) => (node.nextSibling as HTMLElement).querySelectorAll('.ItemTitleLink').length === 1;
    const getLink = (node: HTMLElement) => (node.querySelectorAll('.ItemTitleLink')[1] as HTMLAnchorElement).href;
    const getTitle = (node: HTMLElement) => (node.querySelectorAll('.ItemTitleLink')[1] as HTMLAnchorElement).text;
    const relevantNodes = [...(document.querySelectorAll('.GridMGB > tbody > tr') as any)].filter((_, i) => i % 2 === 1);
    return relevantNodes.map(node => ({ title: getTitle(node), link: getLink(node), isListed: isListed(node) }));
  }));
}

// Returning the number of unsold pages
async function getNumOfPages(page: Page) {
  return Number(await page.evaluate((NUM_OF_PAGES_ID) => {
    // Example of the string value: 1 of 3
    return (document.getElementById(NUM_OF_PAGES_ID).getAttribute('value').split(" ")[2]);
  }, NUM_OF_PAGES_ID));
}

async function relistAll(listingArray, listingPage: Page) {
  for (let i = 0; i < listingArray.length; i++) {
    // Checking capitalized and non capitalized because it can import the csv in either ways
    if (listingArray[i].wantRelist === true && listingArray[i].isRelisted === false) {
      try {
        await g_handler.iterateIfErr(NUM_ERR_ITERATION, relist, listingArray[i], listingPage);
      }
      catch (err) {
        console.log("error relisting: ", listingArray[i].title, ", Link: ", listingArray[i].link, ", error: ", err);
        continue;
      }
      listingArray[i].isNew = false;
      listingArray[i].isRelisted = true;
      console.log("relisted: ", listingArray[i].title, ", link:", listingArray[i].link);
    }
  }
  return listingArray;
}

// Relist one product page
async function relist(listingElement: ListingInfo, listingPage: Page) {
  try {
    await pup_helper.navigateTo(listingPage, (listingElement.link).toString());
    await pup_helper.clickNavigate(listingPage, RELIST_WITH_CHANGES_SELECTOR);
    await pup_helper.clickNavigate(listingPage, CONTINUE_RELISTING_THIS_ITEM_SELECTOR);
    // entering listing options:
    await handleRelistPage(listingPage, listingElement);
    // relisting:
    await pup_helper.clickNavigate(listingPage, CONTINUE_SELECTOR);
    // Test - check if we navigated to the right page
    const relistURL = listingPage.url();
    if (!relistURL.includes('https://www.gunbroker.com/Auction/Relisted.aspx')) {
      throw "Page wasn't relisted. There was an issue in the option page";
    }
  }
  catch (err) {
    throw err; // relistAll will handle the error
  }
}

// Checks all the options and 
async function handleRelistPage(listingPage: Page, listingElement: ListingInfo) {
  await listingPage.click(FIXED_PRICE_SELECTOR); // To ensure we are not on Auction type of listing
  await listingPage.click(QUANTITY_SELECTOR);
  await listingPage.keyboard.type(QUANTITY);
  await listingPage.evaluate((SHOWCASE_LISTING_SELECTOR, FEATURED_LISTING_SELECTOR, SPONSORED_LISTING_SELECTOR,
    HIGHLIGHT_SELECTOR, BOLDFACE_TITLE_SELECTOR, COLORED_TITLE_SELECTOR, COLORED_TITLE_COLOR_SELECTOR,
    VIEW_COUTER_SELECTOR, THUMBNAIL_IMAGE_SELECTOR, DURATION_SELECTOR, DURATION,
    SUBTITLE_SELECTOR, SUBTITLE_TXT_SELECTOR, listingElement) => {
    // getting all checkbox elements:
    document.querySelector(DURATION_SELECTOR).value = DURATION;
    document.querySelector(SUBTITLE_SELECTOR).checked = (listingElement.allow_Subtitle);
    document.querySelector(SHOWCASE_LISTING_SELECTOR).checked = (listingElement.showCaseListing);
    document.querySelector(FEATURED_LISTING_SELECTOR).checked = (listingElement.featuredListing);
    document.querySelector(SPONSORED_LISTING_SELECTOR).checked = (listingElement.sponsoredListing);
    document.querySelector(HIGHLIGHT_SELECTOR).checked = (listingElement.hightLight);
    document.querySelector(BOLDFACE_TITLE_SELECTOR).checked = (listingElement.boldfaceTitle);
    document.querySelector(COLORED_TITLE_SELECTOR).checked = (listingElement.coloredTitle);
    document.querySelector(COLORED_TITLE_COLOR_SELECTOR).value = listingElement.coloredTitleColor;
    document.querySelector(VIEW_COUTER_SELECTOR).checked = (listingElement.viewCounter);
    // document.querySelector(THUMBNAIL_IMAGE_SELECTOR).checked = (listingElement.thumbnailImage); // Removed - 2018

    if (listingElement.allow_Subtitle) {
      document.querySelector(SUBTITLE_TXT_SELECTOR).value = listingElement.subtitle;
    }
    // Parameters that are passed to the DOM
  }, SHOWCASE_LISTING_SELECTOR, FEATURED_LISTING_SELECTOR, SPONSORED_LISTING_SELECTOR,
    HIGHLIGHT_SELECTOR, BOLDFACE_TITLE_SELECTOR, COLORED_TITLE_SELECTOR,
    COLORED_TITLE_COLOR_SELECTOR, VIEW_COUTER_SELECTOR, THUMBNAIL_IMAGE_SELECTOR, DURATION_SELECTOR,
    DURATION, SUBTITLE_SELECTOR, SUBTITLE_TXT_SELECTOR, listingElement);
}

// ------------------------------------------------- CSV Related --------------------------------//
// Update info if elements are found in csvArray. If not, they are pushed into csvArray
function combineArrays(csvArray: ListingInfo[], unlistedArray: ListingInfo[]) {
  for (let i = 0; i < unlistedArray.length; i++) {
    // Find element returns the element if found.
    let found = g_handler.findElementIndex(csvArray, unlistedArray[i].title)
    if (found != false) {
      csvArray[found].isNew = true;
      csvArray[found].isRelisted = false;
      csvArray[found].link = unlistedArray[i].link; // Updating the link since it's always changing after relist
    }
    else {
      csvArray.push(unlistedArray[i]);
    }
  }
  return csvArray;
}

// Created an array with the unlisted listings ONLY.
function buildUnlistedArray(webArray) {
  var unlistedArray: ListingInfo[] = [];
  for (let i = 0; i < webArray.length; i++) {
    if (webArray[i].isListed == false) {
      unlistedArray.push(new ListingInfo(webArray[i].link, false, webArray[i].title))
    }
  }
  return unlistedArray;
}

// Array should be with title, link and isListed values only
function convertToListingInfo(array) {
  for (let i = 0; i < array.length; i++) {
    array[i] = new ListingInfo(array[i].link, array[i].isListed, array[i].title);
  }
  return array;
}

// ------------------------------------------------- Navigation --------------------------------//

// Login to Gunbroker
async function logIn(browser) {
  const loginPage: Page = await browser.newPage();
  await g_handler.iterateIfErr(NUM_ERR_ITERATION, pup_helper.navigateTo, loginPage, LOGIN_URL);
  await loginPage.reload();
  // Entering credentials (logging in):
  await loginPage.click(USERNAME_SELECTOR);
  await loginPage.keyboard.type(CREDS.username);
  await loginPage.click(PASSWORD_SELECTOR);
  await loginPage.keyboard.type(CREDS.password);
  await loginPage.click(BUTTON_SELECTOR);
  await loginPage.waitFor(PAGE_LOAD_DELAY);
  await loginPage.close();
  console.log("Logged In");
}