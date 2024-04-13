const listClass =
  "x8gbvx8 x78zum5 x1q0g3np x1a02dak x1nhvcw1 x1rdy4ex xcud41i x4vbgl9 x139jcc6";
const nameClass =
  "x193iq5w xeuugli x13faqbe x1vvkbs x1xmvt09 x1lliihq x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x xudqn12 x3x7a5m x6prxxf xvq8zen xo1l8bm xzsf02u";
const additionalNameClass = "x1lliihq x6ikm8r x10wlt62 x1n2onr6";
const priceClass =
  "x193iq5w xeuugli x13faqbe x1vvkbs x1xmvt09 x1lliihq x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x xudqn12 x676frb x1lkfr7t x1lbecb7 x1s688f xzsf02u";
const cityAndMileAgeClass =
  "x1lliihq x6ikm8r x10wlt62 x1n2onr6 xlyipyv xuxw1ft x1j85h84";
const linkClass =
  "x1i10hfl xjbqb8w x1ejq31n xd10rxx x1sy0etr x17r0tee x972fbf xcfux6l x1qhh985 xm0m39n x9f619 x1ypdohk xt0psk2 xe8uvvx xdj266r x11i5rnm xat24cr x1mh8g0r xexx8yu x4uap5 x18d9i69 xkhd6sd x16tdsg8 x1hl2dhg xggy1nq x1a2a7pz x1heor9g x1lku1pv";

var DEBUG = false;
var FINDING = false;
var ITERATOR = 1;
var CARS = [];
var QUERY = [];

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "startProcess") {
    startProcess(request.query);
  } else if (request.action === "stopProcess") {
    stopProcess();
  } else if (request.action === "getStatus") {
    log(`FINDING:${FINDING}, QUERY: ${QUERY.join(",")}`);
    sendResponse({ FINDING: FINDING, query: QUERY.join(","), iterator: ITERATOR });
  } else {
    log("Unrecognize command");
  }
});

function startProcess(query) {
  log("🟢 Starting search: " + query);
  QUERY = query.split(",");
  FINDING = true;
  ITERATOR = 1;
  CARS = [];
  findList();
}

function stopProcess() {
  FINDING = false;
  log("🔴 Stoped");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findList() {
  log("⌛ Init scrapping...");
  do {
    var list = document.querySelector(getClass(listClass));
    await processList(list);
  } while (
    FINDING === true &&
    list &&
    list.children &&
    list.children.length > 0
  );
  FINDING = false;
  downloadCsv();
  log("🏁 Finish");
}

async function processList(list) {
  if (list) {
    await sleep(1000);
    log("Found new items:", list.children.length);
    await sleep(5000);

    for (ch of list.children) {
      await sleep(500);
      var car = {};
      var child = list.children[0];
      if (FINDING === false) break;
      const nameElement = child.querySelector(
        getClass(nameClass) + " " + getClass(additionalNameClass)
      );
      const priceElement = child.querySelector(getClass(priceClass));
      const cityElement = child.querySelector(getClass(cityAndMileAgeClass));
      const linkElement = child.querySelector(getClass(linkClass));
      if (nameElement) {
        const name = nameElement.textContent.trim();
        car.name = name;
      }
      if (priceElement) {
        const price = priceElement.textContent.trim();
        car.price = getPrice(price);
        car.currency = getCurrency(price);
      }
      if (cityElement) {
        car.city = cityElement.textContent.trim();
        cityElement.remove();
        const mileageElement = child.querySelector(
          getClass(cityAndMileAgeClass)
        );
        if (mileageElement && mileageElement.textContent.length > 0) {
          car.mileage = mileageElement.textContent.trim();
        }
      }
      if (linkElement) {
        const link = linkElement.getAttribute("href");
        car.link = "https://www.facebook.com" + link;
      }
      if (child) {
        if (car.name === undefined || isCarInvalid(car)) {
          child.remove();
          continue;
        } else {
          car.year = extractYearFromString(car.name);
          if (car.year) car.name = car.name.substring(5);
          await sleep(1000);
          child.remove();
        }
      }
      log("Id:", ITERATOR++);
      log(car);
      await sleep(1500);
      CARS.push(car);
    }
  } else {
    log("Not found list with items");
  }
}

function extractYearFromString(str) {
  let yearRegex = /^(19[9-9][0-9]|20[0-1][0-9]|202[0-4])\s/;
  let match = str.match(yearRegex);

  if (match) {
    return match[0].trim();
  } else {
    return null;
  }
}

function getPrice(str) {
  const cleanedStr = str
    .trim()
    .replace(/\s/g, "")
    .replace(/[^\d.-]/g, "");
  const numericValue = parseFloat(cleanedStr);
  return numericValue;
}

function getCurrency(str) {
  const currency = str.trim().replace(/[\d.,\s]+/g, "");
  return currency;
}

function isCarInvalid(car) {
  var invalid = true;
  for (q of QUERY) {
    if (car.name.toLowerCase().includes(q.toLowerCase().trim())) {
      return false;
    }
  }
  return invalid;
}

function getClass(strClass) {
  return "." + strClass.replaceAll(" ", ".");
}

function downloadCsv() {
  const csvContent = convertToCSV(CARS);
  const currentDate = getCurrentDateTime();
  saveToCSV(
    csvContent,
    `${QUERY.join("_").replaceAll(" ", "-")}_${currentDate}.csv`
  );
}

function convertToCSV(carList) {
  let csv = "YEAR;NAME;PRICE;CURRENCY;MILEAGE;CITY;LINK\n";
  carList.forEach((car) => {
    csv += `${car.year};${car.name};${car.price};${car.currency};${car.mileage};${car.city};${car.link}\n`;
  });
  return csv;
}

function getCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
}

function saveToCSV(content, filename) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function log(...object) {
  if (DEBUG) {
    console.log(object);
  }
}
