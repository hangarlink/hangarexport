// delay between page loads
var $scrapeDelay = 1500;
var $scrapeRandom = 3000;

// scrape settings
var $scrapeHandle = null;
var $scrapeType = null;
var $scrapeSkipBuybacks = false;

// scraped pledge data
var $scrapePledges = [];
var $scrapePledgesPage = 1;
var $scrapePledgesPagesize = 10;

// scraped buyback data
var $scrapeBuybacks = [];
var $scrapeBuybacksPage = 1;
var $scrapeBuybacksPagesize = 100;

renderButton();
renderOverlay();

chrome.storage.local.get(
  [
    "scrapeHandle",
    "scrapeType",
    "scrapeSkipBuybacks",
    "scrapePledges",
    "scrapePledgesPage",
    "scrapePledgesPagesize",
    "scrapeBuybacks",
    "scrapeBuybacksPage",
    "scrapeBuybacksPagesize",
    "scrapeBuybacks",
  ],
  function (items) {
    $scrapeHandle = items.scrapeHandle;
    $scrapeType = items.scrapeType;
    $scrapeSkipBuybacks = items.scrapeSkipBuybacks;
    $scrapePledges = items.scrapePledges || [];
    $scrapePledgesPage = items.scrapePledgesPage;
    $scrapePledgesPagesize = items.scrapePledgesPagesize || 10;
    $scrapeBuybacks = items.scrapeBuybacks || [];
    $scrapeBuybacksPage = items.scrapeBuybacksPage;
    $scrapeBuybacksPagesize = items.scrapeBuybacksPagesize || 100;
    if (!!$scrapeType) {
      showOverlay();
      updateProgress();
      continueScrape();
    } else {
      showButton();
      updateProgress();
      hideOverlay;
    }
  }
);

function getPosition() {
  var type = "";
  if (
    /https:\/\/robertsspaceindustries.com\/account\/pledges/.test(
      window.location.href
    )
  ) {
    type = "PLEDGES";
  } else if (
    /https:\/\/robertsspaceindustries.com\/account\/buy-back-pledges/.test(
      window.location.href
    )
  ) {
    type = "BUYBACKS";
  }

  var page = 1;
  var pagesize = type == "PLEDGES" ? 10 : 100;
  var qsa = window.location.href.split("?");
  if (qsa.length > 1) {
    var qs = qsa[qsa.length - 1];
    var parts = qs.split("&");
    parts.map((part) => {
      kvs = part.split("=");
      if (kvs.length > 1) {
        var k = kvs[0];
        var v = kvs[1];
        if (k.toLowerCase() == "page" && !isNaN(parseInt(v))) {
          page = parseInt(v);
        }
        if (k.toLowerCase() == "pagesize" && !isNaN(parseInt(v))) {
          pagesize = parseInt(v);
        }
      }
    });
  }

  return { type: type, page: page, pagesize: pagesize };
}

function startScrape() {
  $scrapeHandle = undefined;
  $scrapeType = "PLEDGES";
  $scrapeSkipBuybacks = false;
  $scrapePledges = [];
  $scrapePledgesPage = 1;
  $scrapePledgesPagesize = 10;
  $scrapeBuybacks = [];
  $scrapeBuybacksPage = 1;
  $scrapeBuybacksPagesize = 100;

  chrome.storage.local.set(
    {
      scrapeHandle: $scrapeHandle,
      scrapeType: $scrapeType,
      scrapeSkipBuybacks: $scrapeSkipBuybacks,
      scrapePledges: $scrapePledges,
      scrapePledgesPage: $scrapePledgesPage,
      scrapePledgesPagesize: $scrapePledgesPagesize,
      scrapeBuybacks: $scrapeBuybacks,
      scrapeBuybacksPage: $scrapeBuybacksPage,
      scrapeBuybacksPagesize: $scrapeBuybacksPagesize,
    },
    function () {
      continueScrape();
    }
  );
}

function cancelScrape() {
  $scrapeHandle = null;
  $scrapeType = null;
  $scrapeSkipBuybacks = false;
  $scrapePledges = [];
  $scrapePledgesPage = 1;
  $scrapePledgesPagesize = 10;
  $scrapeBuybacks = [];
  $scrapeBuybacksPage = 1;
  $scrapeBuybacksPagesize = 100;

  chrome.storage.local.set(
    {
      scrapeHandle: $scrapeHandle,
      scrapeType: $scrapeType,
      scrapeSkipBuybacks: $scrapeSkipBuybacks,
      scrapePledges: $scrapePledges,
      scrapePledgesPage: $scrapePledgesPage,
      scrapePledgesPagesize: $scrapePledgesPagesize,
      scrapeBuybacks: $scrapeBuybacks,
      scrapeBuybacksPage: $scrapeBuybacksPage,
      scrapeBuybacksPagesize: $scrapeBuybacksPagesize,
      scrapeBuybacks: $scrapeBuybacks,
    },
    function () {
      showButton();
      hideOverlay();
      updateProgress();
    }
  );
}

function continueScrape() {
  if ($scrapeType == "PLEDGES") {
    continueScrapePledges();
  } else if ($scrapeType == "BUYBACKS") {
    continueScrapeBuybacks();
  } else {
    console.log("unsupported type");
  }
}

function continueScrapePledges() {
  var position = getPosition();
  if (
    position.type != "PLEDGES" ||
    position.page != $scrapePledgesPage ||
    position.pagesize != $scrapePledgesPagesize
  ) {
    setTimeout(() => {
      window.location = "https://robertsspaceindustries.com/account/pledges";
    }, 2000);
  } else {
    var data = document.documentElement.outerHTML;
    var parsed = { handle: "", isLastPage: false, pledges: [], buybacks: [] };
    result = parsePledgePage(
      data,
      parsed,
      $scrapePledgesPage,
      $scrapePledgesPagesize
    );

    if (!!$scrapeHandle && $scrapeHandle != parsed.handle) {
      alert("hanger mismatch");
      cancelScrape();
      updateProgress();
    }

    parsed.pledges.map((pledge) => {
      $scrapePledges.push(pledge);
    });

    $scrapeHandle = parsed.handle;

    if (!parsed.isLastPage) {
      $scrapePledgesPage += 1;
      // save and load the next page.
      chrome.storage.local.set(
        {
          scrapeHandle: $scrapeHandle,
          scrapePledges: $scrapePledges,
          scrapePledgesPage: $scrapePledgesPage,
        },
        function () {
          setTimeout(() => {
            window.location =
              "https://robertsspaceindustries.com/account/pledges?page=" +
              $scrapePledgesPage +
              "&pagesize=" +
              $scrapePledgesPagesize;
          }, $scrapeDelay + getRandomInt(0, $scrapeRandom));
        }
      );
    } else {
      // its the last page
      if ($scrapeSkipBuybacks) {
        continueExport();
      } else {
        chrome.storage.local.set(
          {
            scrapeHandle: $scrapeHandle,
            scrapePledges: $scrapePledges,
            scrapeType: "BUYBACKS",
          },
          function () {
            setTimeout(() => {
              window.location =
                "https://robertsspaceindustries.com/account/buy-back-pledges?page=" +
                $scrapeBuybacksPage +
                "&pagesize=" +
                $scrapeBuybacksPagesize;
            }, $scrapeDelay);
          }
        );
      }
    }
  }
}

function continueScrapeBuybacks() {
  var position = getPosition();
  if (
    position.type != "BUYBACKS" ||
    position.page != $scrapeBuybacksPage ||
    position.pagesize != $scrapeBuybacksPagesize
  ) {
    alert("error: buybacks url mismatch");
    cancelScrape();
  } else {
    var data = document.documentElement.outerHTML;
    var parsed = { handle: "", isLastPage: false, pledges: [], buybacks: [] };
    result = parseBuybackPage(
      data,
      parsed,
      $scrapeBuybacksPage,
      $scrapeBuybacksPagesize
    );


    if (!!$scrapeHandle && $scrapeHandle != parsed.handle) {
      alert("handle mismatch");
      cancelScrape();
    }

    parsed.buybacks.map((buyback) => {
      $scrapeBuybacks.push(buyback);
    });

    $scrapeHandle = parsed.handle;

    if (!parsed.isLastPage) {
      $scrapeBuybacksPage += 1;
      // save and load the next page.
      chrome.storage.local.set(
        {
          scrapeHandle: $scrapeHandle,
          scrapeBuybacks: $scrapeBuybacks,
          scrapeBuybacksPage: $scrapeBuybacksPage,
        },
        function () {
          setTimeout(() => {
            window.location =
              "https://robertsspaceindustries.com/account/buy-back-pledges?page=" +
              $scrapeBuybacksPage +
              "&pagesize=" +
              $scrapeBuybacksPagesize;
          }, $scrapeDelay + getRandomInt(0, $scrapeRandom));
        }
      );
    } else {
      continueExport();
    }
  }
}

function continueExport() {
  var exportData = {
    type: "hangarexport",
    version: 2,
    handle: $scrapeHandle,
    pledges: $scrapePledges,
    pledgesPagesize: $scrapePledgesPagesize,
    pledgesLastPage: $scrapePledgesPage,
    buybacks: $scrapeSkipBuybacks ? undefined : $scrapeBuybacks,
    buybacksPagesize: $scrapeSkipBuybacks ? undefined : $scrapeBuybacksPagesize,
    buybacksLastPage: $scrapeSkipBuybacks ? undefined : $scrapeBuybacksPage,
  };
  var jsonDataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(exportData, null, 2));
  const jsonLink = document.createElement("a");
  jsonLink.setAttribute("href", jsonDataStr);
  jsonLink.setAttribute("download", "hangarexport.json");
  jsonLink.setAttribute("type", "text/json");
  jsonLink.click();
  jsonLink.setAttribute("href", "");

  var csvDataStr = "data:text/csv;charset=utf-8," +
  encodeURIComponent(convertToCsv(exportData));
  const csvLink = document.createElement("a");
  csvLink.setAttribute("href", csvDataStr);
  csvLink.setAttribute("download", "hangarexport.csv");
  csvLink.setAttribute("type", "text/csv");
  csvLink.click();
  csvLink.setAttribute("href", "");
  cancelScrape();
  updateProgress();
}

function convertToCsv(exportData) {
  var lines = [];
  lines.push([
    `"${exportData.handle} Type"`,
    '"PledgeId"',
    '"Name"',
    '"Value"',
    '"ConfigurationValue"',
    '"Date"',
    '"Page"',
    '"Pagesize"',
    '"Contains"',
    '"AlsoContains"',
    '"Items"',
    '"PageUrl"',
    '"BuybackUrl"',
  ].join(","));

  (exportData.pledges || []).map((pledge) => { 
    lines.push([
      '"PLEDGE"',
      pledge.pledgeId, 
      '"' + pledge.pledgeName + '"',
      '"' + pledge.pledgeValue + '"',
      '"' + pledge.pledgeConfigurationValue + '"',
      '"' + pledge.date + '"',
      pledge.page,
      exportData.pledgesPagesize,
      '"' + pledge.contains + '"',
      '"' + pledge.alsoContains.map((ac) => { return `[TITLE ${ac.title || ''}]` }).join(",") + '"', 
      '"' + pledge.items.map((it) => { return convertItem(it)}).join(",") + '"', 
      `"https://robertsspaceindustries.com/account/pledges?page=${(pledge.page || 0).toString()}&pagesize=${(exportData.pledgesPagesize || 10).toString()}"`,
      '',
    ].join(','))});

    (exportData.buybacks || []).map((buyback) => { 
      var pid = buyback.pledgeId
      if (!buyback.pledgeId || buyback.pledgeId.trim() == '') {
        parts = (buyback.buybackHref || "").split('/')
        pid = parts[parts.length-1];
      }
  
      var buybackUrl = "";
      if (!!buyback.buybackHref && buyback.buybackHref != "") {
       buybackUrl = `"https://robertsspaceindustries.com${buyback.buybackHref}"`
      }
      
      lines.push([
        '"BUYBACK"',
        pid, 
        '"' + buyback.pledgeName + '"',
        '',
        '',
        '"' + buyback.date + '"',
        buyback.page,
        exportData.buybacksPagesize,
        '"' + buyback.contains + '"',
        '',
        '',
        `"https://robertsspaceindustries.com/account/buy-back-pledges?page=${(buyback.page || 0).toString()}&pagesize=${(exportData.buybacksPagesize || 100).toString()}"`,
        buybackUrl,
      ].join(','))});

    return lines.join("\n");
}

function convertItem(it) {
  result = '';
  if (!!it.kind && it.kind != '') {
    result = `${result}[KIND ${it.kind}]`;
  }
  if (!!it.title && it.title != '') {
    result = `${result}[TITLE ${it.title}]`;
  }
  if (!!it.liner && it.liner != '') {
    result = `${result}[LINER ${it.liner}]`;
  }
  if (!!it.itemCustomName && it.itemCustomName != '') {
    result = `${result}[CUSTOMNAME ${it.itemCustomName}]`;
  }
  return result;
}

function showButton() {
  var exportButton = document.getElementById("export");
  if (!!exportButton) {
    exportButton.style.display = "block";
  }
}

function hideButton() {
  var exportButton = document.getElementById("export");
  if (!!exportButton) {
    exportButton.style.display = "none";
  }
}

function showOverlay() {
  var overlay = document.getElementById("overlay");
  if (!!overlay) {
    overlay.style.display = "flex";
  }
}

function hideOverlay() {
  var overlay = document.getElementById("overlay");
  if (!!overlay) {
    overlay.style.display = "none";
  }
}

function renderButton() {
  var span1 = document.createElement("span");
  span1.innerText = "Export Data";
  span1.style.cssText = "color: #FFFFFF;font-size: 1.0rem;padding 0px;margin 0px;";

  var link = document.createElement("a");
  link.id = "export";
  link.style.cssText =
    "display: none;width: 150px;margin: 10px;padding: 10px;border: 1px #3079ED solid;background: #4C8FFB;";
  link.appendChild(span1);
  link.addEventListener(
    "click",
    function () {
      startScrape();
      showOverlay();
    },
    false
  );

  var target = document.getElementsByClassName("sidenav")[0];
  if (!!target) {
    target.appendChild(link);
  }
}

function updateProgress() {
  var progress = document.getElementById("update-progress");
  if (!!progress) {
    if ($scrapeType == "PLEDGES") {
      progress.innerText =  `Processing Pledges Page ${$scrapePledgesPage} ...` ;
    } else if ($scrapeType == "BUYBACKS") {
      progress.innerText =  `Processing Buybacks Page ${$scrapeBuybacksPage} ...` ;
    } else {
      progress.innerText = 'Processing ...'
    }
  }
}

function renderOverlay() {
  var cancelText = document.createElement("span");
  cancelText.innerText = "CANCEL";
  cancelText.style.cssText =
    "color: #FFFFFF;font-size: 1.0rem;";

  var cancelLink = document.createElement("a");
  cancelLink.id = "cancel";
  cancelLink.style.cssText =
    "display: block;width: 300px;padding: 10px;margin: 10px;border: 1px #3079ED solid;background: #4C8FFB;";

  cancelLink.appendChild(cancelText);
  cancelLink.addEventListener(
    "click",
    function () {
      cancelScrape();
    },
    false
  );

  var progressDiv = document.createElement("div");
  progressDiv.id = "update-progress";
  progressDiv.appendChild(document.createTextNode("Loading ..."));
  progressDiv.style.cssText =
    "display: block;width: 300px;margin: 10px;padding: 10px;color: #FFFFFF;font-size: 30;align-items: center;justify-content: center;text-align: center;";

  var innerDiv = document.createElement("div");
  innerDiv.appendChild(progressDiv);
  innerDiv.appendChild(cancelLink);

  var div = document.createElement("div");
  div.id = "overlay";
  div.style.cssText =
    "display: none;position: fixed;width: 100%;height: 100%;top: 0;left: 0;bottom: 0;right: 0;background-color: rgba(0,0,0,0.7);z-index: 100;cursor: pointer;align-items: center;justify-content: center;text-align: center;";

  div.appendChild(innerDiv);
  document.body.appendChild(div);
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function parsePledgePage(data, parsed, page) {
  // remove all newlines and replace any ul /ul li and li related to customizations of origin series ships so we can locate items by <ul> <li></li>* </ul>
  var singleline = data.replace(/\r?\n|\r/g, " ").replace(/\s+/g, " ").replace(/<ul>\s?(<li class.+?<\/li>)\s?<\/ul>/g, "<nonitemul>$1</nonitemul>").replace(/<li class(.+?)<\/li>/g, "<nonitemli class$1</nonitemli>");

  var handleRes = singleline.match(
    /\<span class=\"c-account-sidebar__profile-info-handle"\>(.*?)\<\/span\>/i
  );
  if (!!handleRes) {
    parsed.handle = handleRes[1];
  } else {
    return "handle not found";
  }

  // detect the last page
  // <a class="raquo btn" href="/account/pledges?page=4&pagesize=10"><span class="trans-02s trans-opacity"></span></a>
  var raquoRes = singleline.match(/<a class="raquo btn"/i);
  if (!raquoRes) {
    parsed.isLastPage = true;
  }

  if (/Your hangar is empty/.test(singleline)) {
    parsed.isLastPage = true;
    return "empty";
  }

  var itemsBlockRes = singleline.match(/<ul class="list-items">(.+)<\/ul>/);
  var itemsBlock = "";
  if (!!itemsBlockRes) {
    itemsBlock = itemsBlockRes[1];
  } else {
    return "items block not found";
  }

  // strip out the customisation options from the 300 series as they
  // contain <li> and </li>
  //<li class="custo-choice">Monarch</li>
  
  


//  itemsBlock = itemsBlock.replace(/<li class(.+?)<\/li>/g, "<nonitemli class$1</nonitemli>");




  var re = /<li>(.+?)<\/li>/g;
  var matches;
  while ((matches = re.exec(itemsBlock)) != null) {
    var string = matches[1].trim();
    if (
      string != "<del>{$item.name}</del>" &&
      string != "<ins>{$item.name}</ins>"
    ) {
      pledge = parseItem(matches[1], page);
      if (!!pledge) {
        parsed.pledges.push(pledge);
      } else {
        return "error parsing pledge";
      }
    }
  }
}

function parsePledgeItem(singleLine) {
  var itemCustomNameRes = singleLine.match(
    /<div class="custom-name-text">(.*?)<\/div>/i
  );
  var itemCustomName = "";
  if (!!itemCustomNameRes) {
    itemCustomName = itemCustomNameRes[1].trim();
  }

  var itemTitleRes = singleLine.match(/<div class="title">(.*?)<\/div>/i);
  var itemTitle = "";
  if (!!itemTitleRes) {
    itemTitle = itemTitleRes[1].trim();
  } else {
    console.log(singleLine);
    console.log({ error: "itemTitle not found" });
    return null;
  }

  var itemKindRes = singleLine.match(/<div class="kind">(.*?)<\/div>/i);
  var itemKind = "";
  if (!!itemKindRes) {
    itemKind = itemKindRes[1].trim();
  }

  var itemLinerRes = singleLine.match(/<div class="liner">(.*?)<\/div>/i);
  var itemLiner = "";
  if (!!itemLinerRes) {
    itemLiner = itemLinerRes[1]
      .trim()
      .replace(/<span>/i, "")
      .replace(/<\/span>/i, "");
  }

  return {
    title: itemTitle,
    kind: itemKind,
    liner: itemLiner,
    itemCustomName: itemCustomName,
  };
}

function parseItem(singleLine, page) {
  var pledgeIdRes = singleLine.match(/"js-pledge-id" value="([0-9]+?)">/i);
  var pledgeId = "";
  if (!!pledgeIdRes) {
    pledgeId = pledgeIdRes[1].trim();
  } else {
    console.log(singleLine);
    console.log({ error: "pledgeId not found" });
    return null;
  }

  var pledgeNameRes = singleLine.match(/"js-pledge-name" value="(.+?)">/i);
  var pledgeName = "";
  if (!!pledgeNameRes) {
    pledgeName = pledgeNameRes[1].trim();
  } else {
    console.log(singleLine);
    console.log({ error: "pledgeName not found" });
    return null;
  }

  //strip out reward codes
  pledgeName = pledgeName.split(":")[0]

  var pledgeValueRes = singleLine.match(/"js-pledge-value" value="(.+?)">/i);
  var pledgeValue = "";
  if (!!pledgeValueRes) {
    pledgeValue = pledgeValueRes[1].trim();
  } else {
    console.log(singleLine);
    console.log({ error: "pledgeValue not found" });
    return null;
  }

  var pledgeConfigurationValueRes = singleLine.match(
    /"js-pledge-configuration-value" value="(.+?)">/i
  );
  var pledgeConfigurationValue = "";
  if (!!pledgeConfigurationValueRes) {
    pledgeConfigurationValue = pledgeConfigurationValueRes[1].trim();
  } else {
    console.log(singleLine);
    console.log({ error: "pledgeConfigurationValue not found" });
    return null;
  }

  var dateRes = singleLine.match(
    /<div class="date-col"> *<label>Created:<\/label>(.+?)<\/div>/i
  );
  var date = "";
  if (!!dateRes) {
    date = dateRes[1].trim();
  } else {
    console.log(singleLine);
    console.log({ error: "date not found" });
    return null;
  }

  var containsRes = singleLine.match(
    /div class="items-col"> *<label>Contains:<\/label>(.+?)<\/div>/i
  );
  var contains = "";
  if (!!containsRes) {
    contains = containsRes[1].trim();
  } else {
    console.log(singleLine);
    console.log({ error: "contains not found" });
    return null;
  }

  var pledgeItems = [];

  var re = /<div class="item ">(.+?)<\/div> ?<\/div> ?<\/div>/g;
  var matches;
  while ((matches = re.exec(singleLine)) != null) {
    pledgeItem = parsePledgeItem(matches[0]);
    if (!!pledgeItem) {
      pledgeItems.push(pledgeItem);
    }
  }

  var re = /<div class="item has-custom-name">(.+?)<\/div> ?<\/div> ?<\/div>/g;
  var matches;
  while ((matches = re.exec(singleLine)) != null) {
    pledgeItem = parsePledgeItem(matches[0]);
    if (!!pledgeItem) {
      pledgeItems.push(pledgeItem);
    }
  }

  var pledgeAlsoContains = [];
  var alsoContainsRes = singleLine.match(/Also Contains(.*?)class="cboth"/i);
  if (!!alsoContainsRes) {
    var alsoContains = alsoContainsRes[1].trim();
    var re = /<div class="title">(.+?)<\/div>/g;
    var matches;
    while ((matches = re.exec(alsoContains)) != null) {
      pledgeAlsoContains.push({ title: matches[1].trim() });
    }
  }

  var pledgeGiftable = false;
  var pledgeGiftableRes = singleLine.match(/js-gift/i);
  if (!!pledgeGiftableRes) {
    pledgeGiftable = true;
  }

  return {
    pledgeId: pledgeId,
    pledgeName: pledgeName,
    pledgeValue: pledgeValue,
    pledgeConfigurationValue: pledgeConfigurationValue,
    date: date,
    contains: contains,
    items: pledgeItems,
    alsoContains: pledgeAlsoContains,
    giftable: pledgeGiftable,
    page: page,
  };
}

function parseBuybackPage(data, parsed, page) {
  var singleline = data.replace(/\r?\n|\r/g, " ").replace(/\s+/g, " ");
  var handleRes = singleline.match(
    /\<span class=\"c-account-sidebar__profile-info-handle"\>(.*?)\<\/span\>/i
  );
  if (!!handleRes) {
    parsed.handle = handleRes[1];
  } else {
    console.log({ error: "handle not found" });
    return "handle not found";
  }

  // last page detection via next arrow link
  // <a class="raquo btn" href="/account/pledges?page=4&pagesize=10"><span class="trans-02s trans-opacity"></span></a>
  var raquoRes = singleline.match(/<a class="raquo btn"/i);
  if (!raquoRes) {
    parsed.isLastPage = true;
  }

  if (/No pledges available/.test(singleline)) {
    parsed.isLastPage = true;
    return "empty";
  }

  var re = /<article class="pledge" ?>(.+?)<\/article>/g;
  var matches;
  while ((matches = re.exec(singleline)) != null) {
    buyback = parseArticle(matches[1], page);
    if (!!buyback) {
      parsed.buybacks.push(buyback);
    } else {
      return "error parsing buyback";
    }
  }
}

function parseArticle(singleLine, page) {
  var nameRes = singleLine.match(/<h1>(.+?)<\/h1>/i);
  var name = "";
  if (!!nameRes) {
    name = nameRes[1]
      .trim()
      .replace(/<span class="upgraded"> - upgraded<\/span>/, "");
  } else {
    console.log(singleLine);
    console.log({ error: "name not found" });
    return null;
  }

  var lastRes = singleLine.match(
    /<dl> <dt>Last Modified<\/dt> <dd>(.+?)<\/dd><dd> <\/dd><dt>Contained<\/dt> <dd>(.+?)<\/dd><dd> <\/dd><\/dl>/i
  );
  var lastModified = "";
  var contained = "";
  if (!!lastRes) {
    lastModified = (lastRes[1] || "").trim();
    contained = (lastRes[2] || "").trim();
  } else {
    console.log(singleLine);
    console.log({ error: "lastModified block not found" });
    return null;
  }

  var upgradeRes = singleLine.match(
    /<a href="" class="holosmallbtn js-open-ship-upgrades" data-pledgeid=\"?(\d+?)\"? data-fromshipid="(\d+?)" data-toshipid="(\d+?)" data-toskuId="(\d+?)">/i
  );
  var pledgeId = "";
  var fromShipId = "";
  var toShipId = "";
  var toSkuId = "";
  var href = "";
  if (!!upgradeRes) {
    pledgeId = upgradeRes[1].trim();
    fromShipId = upgradeRes[2].trim();
    toShipId = upgradeRes[3].trim();
    toSkuId = upgradeRes[4].trim();
  } else {
    var hrefRes = singleLine.match(/<a class="holosmallbtn" href="(.+?)">/i);
    if (!!hrefRes) {
      href = hrefRes[1].trim();
    } else {
      console.log(singleLine);
      console.log({ error: "cant find upgrade or href data" });
      return null;
    }
  }

  return {
    pledgeName: name,
    date: lastModified,
    contains: contained,
    pledgeId: pledgeId,
    fromShipId: fromShipId,
    toShipId: toShipId,
    toSkuId: toSkuId,
    buybackHref: href,
    page: page,
  };
}
