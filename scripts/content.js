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

    var parsed = { handle: "", isLastPage: false, pledges: [], buybacks: [] };
    result = parsePledgePage(
      parsed,
      $scrapePledgesPage,
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

    var parsed = { handle: "", isLastPage: false, pledges: [], buybacks: [] };
    result = parseBuybackPage(
      parsed,
      $scrapeBuybacksPage,
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

function parsePledgePage(parsed, page) {
  var handle = document.getElementsByClassName('c-account-sidebar__profile-info-handle')[0].innerText;
  if (!!handle && handle !== "") {
    parsed.handle = handle;
  } else {
    return "handle not found";
  }

  var raquoRes = document.getElementsByClassName('raquo')[0];
  if (!raquoRes) {
    parsed.isLastPage = true;
  } 

  var data = document.documentElement.outerHTML;
  var singleline = data.replace(/\r?\n|\r/g, " ").replace(/\s+/g, " ");

  if (/Your hangar is empty/.test(singleline)) {
    parsed.isLastPage = true;
    return "empty";
  }

  var itemsUlBlock = document.getElementsByClassName('list-items')[0];
  if (!itemsUlBlock) {
    return "items block not found";
  }

  var items = itemsUlBlock.children;
  for (var i = 0; i < items.length; i++) {
    p = parseItem(items[i], page);
    if (!!p) {
      parsed.pledges.push(p);
    } else {
      console.log({errorParsingPlege: items[i]});
    }
  } 
}

function parsePledgeItem(item) {
  var itemCustomName = "";
  {
    var itemCustomNameNode = item.getElementsByClassName('custom-name-text');
    if (itemCustomNameNode.length == 1) {
      itemCustomName = itemCustomNameNode[0].innerText.trim();
    }
  }
  
  var itemTitle = "";
  {
    var itemTitleNode = item.getElementsByClassName('title');
    if (itemTitleNode.length == 1) {
      itemTitle = itemTitleNode[0].innerText.trim();
    }
  }
    
  var itemKind = "";
  {
    var itemKindNode = item.getElementsByClassName('kind');
    if (itemKindNode.length == 1) {
      itemKind = itemKindNode[0].innerText.trim();
    }
  }

  var itemLiner = "";
  {
    var itemLinerNode = item.getElementsByClassName('liner');
    if (itemLinerNode.length == 1) {
      itemLiner = itemLinerNode[0].innerText.trim();
    }
  }

  return {
    title: itemTitle,
    kind: itemKind,
    liner: itemLiner,
    itemCustomName: itemCustomName,
  };
}

function parseAlsoContainsItem(alsoContainsNode) {
  var alsoContains = [];
  {
    var alsoContainsItemsNode = alsoContainsNode.getElementsByClassName('item');
    for (var j = 0; j < alsoContainsItemsNode.length; j++) {true
      var titleNodes = alsoContainsItemsNode[j].getElementsByClassName('title');
      if (titleNodes.length == 1) {
        alsoContains.push({"title": titleNodes[0].innerText.trim()});
       }
     }
  }
  return alsoContains;
}

function parseItem(item, page) {
  var pledgeId = "";
  {
    var jsPledgeIdNode = item.getElementsByClassName('js-pledge-id');
    if (jsPledgeIdNode.length == 1) {
      pledgeId = jsPledgeIdNode[0].value.trim();
    } else {
      console.log({ error: "pledgeId not found" });
      return null;
    }
  }
  
  var pledgeName = "";
  {
    var jsPledgeNameNode = item.getElementsByClassName('js-pledge-name');
    if (jsPledgeNameNode.length == 1) {
      pledgeName = jsPledgeNameNode[0].value.trim();
    } else {
      console.log({ error: "pledgeName not found" });
      return null;
    }
  }
  //strip out coupon codes
  pledgeName = pledgeName.split(":")[0];

  var pledgeValue = "";
  {
    var jsPledgeValueNode = item.getElementsByClassName('js-pledge-value');
    if (jsPledgeValueNode.length == 1) {
      pledgeValue = jsPledgeValueNode[0].value.trim();
    }
  }

  var pledgeConfigurationValue = "";
  {
    var jsPledgeConfigurationValueNode = item.getElementsByClassName('js-pledge-configuration-value');
    if (jsPledgeConfigurationValueNode.length == 1) {
      pledgeConfigurationValue = jsPledgeConfigurationValueNode[0].value.trim();
    }
  }

  var date = "";
  {
    var dateNode = item.getElementsByClassName('date-col');
    if (dateNode.length == 1) {
      date = dateNode[0].innerText.trim().replace(/\r?\n|\r/g, "").replace(/Created\:/g, "");
    } else {
      console.log({ error: "dateNode not found" });
      return null;
    }
  }

  var contains = "";
  {
    var containsNode = item.getElementsByClassName('items-col');
    if (containsNode.length == 1) {
      contains = containsNode[0].innerText.trim().replace(/\r?\n|\r/g, "").replace(/Contains\:/g, "");;
    }
  }

  var pledgeItems = [];
  {
    var pledgeItemsNode = item.getElementsByClassName('item');
    for (var y = 0; y < pledgeItemsNode.length; y++) {
      pledgeItem = parsePledgeItem(pledgeItemsNode[y]);
      if (!!pledgeItem) {
        pledgeItems.push(pledgeItem);
      } else {
        console.log({error: "error parsing pledge item"});
        return null;
      }
    }
  }

  var pledgeAlsoContains = [];
   {
     var alsoContainsNode = item.getElementsByClassName('without-images');
     if (alsoContainsNode.length == 1) {
      pledgeAlsoContains = parseAlsoContainsItem(alsoContainsNode[0]);
    }
   }

  var pledgeGiftable = false;
  var pledgeGiftableNode = item.getElementsByClassName('js-gift')[0];
  if (!!pledgeGiftableNode) {
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


function parseBuybackPage(parsed, page) {
  var data = document.documentElement.outerHTML;
  var singleline = data.replace(/\r?\n|\r/g, " ").replace(/\s+/g, " ");


  var handle = document.getElementsByClassName('c-account-sidebar__profile-info-handle')[0].innerText;
  if (!!handle && handle !== "") {
    parsed.handle = handle;
  } else {
    return "handle not found";
  }

  var raquoRes = document.getElementsByClassName('raquo')[0];
  if (!raquoRes) {
    parsed.isLastPage = true;
  } 

  var data = document.documentElement.outerHTML;
  var singleline = data.replace(/\r?\n|\r/g, " ").replace(/\s+/g, " ");

  if (/No pledges available/.test(singleline)) {
    parsed.isLastPage = true;
    return "empty";
  }

  var articleNodes = document.getElementsByTagName('article');
  for (var s = 0; s < articleNodes.length; s++) {
    buyback = parseArticle(articleNodes[s], page);
    if (!!buyback) {
      parsed.buybacks.push(buyback);
    } else {
      console.log({errorParsingArticle: articleNodes[i]});
    }
  } 
}

function parseArticle(articleNode, page) {
  var name = "";
  {
    var nameNode = articleNode.getElementsByTagName('h1');
    if (nameNode.length == 1) {
      name = nameNode[0].innerText.replace(/\r?\n|\r/g, " ").replace(/\ \- upgraded/gi, " ").trim();
    } else {
      console.log({ error: "name not found" });
      return null;
    }
  }

  var lastModified = "";
  var contained = "";
  {
    var dataNode = articleNode.getElementsByTagName('dd');
    if (dataNode.length == 4) {
      lastModified = dataNode[0].innerText.trim();
      contained = dataNode[2].innerText.trim();
    } else if (dataNode.length == 2) {
      lastModified = dataNode[0].innerText.trim();
      contained = dataNode[1].innerText.trim();
    } else {
      console.log({error: "dd not found"});
      return null;
    }
  }

  var pledgeId = "";
  var fromShipId = "";
  var toShipId = "";
  var toSkuId = "";
  var href = "";
  {
    var holosmallbtn = articleNode.getElementsByClassName('holosmallbtn')[0];
    if (!!holosmallbtn) {
      pledgeId = holosmallbtn.getAttribute('data-pledgeId');
      fromShipId = holosmallbtn.getAttribute('data-fromShipId');
      toShipId = holosmallbtn.getAttribute('data-toShipId');
      toSkuId = holosmallbtn.getAttribute('data-toSkuId');
      href = holosmallbtn.getAttribute('href');
    } else {
      console.log({ error: "holosmallbtn not found" });
      return null;
    }
  }

  return {
    pledgeName: name || "",
    date: lastModified || "",
    contains: contained || "",
    pledgeId: pledgeId || "",
    fromShipId: fromShipId || "",
    toShipId: toShipId || "",
    toSkuId: toSkuId || "",
    buybackHref: href || "",
    page: page,
  };
}
