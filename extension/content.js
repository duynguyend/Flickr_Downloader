(function() {
  if (window.FlickrExtContentScriptInjected) {
    // Prevent multiple injections
    console.log("[FlickrExt] Content script already injected, skipping.");
    return;
  }
  window.FlickrExtContentScriptInjected = true;
  console.log("[FlickrExt] Content script loaded (injected).");

// == Settings and Constants ==
const KEY_OPEN_LINK = "flickr_openLink";
const KEY_ALWAYS_SHOW = "flickr_alwaysShow";
let valueOpenLink = false;
let valueAlwaysShow = false;
let valueMaxSize = 4096;
const KEY_MAX_SIZE = "flickr_maxSize";
const imageSizeOrder = ["9k","8k","7k","6k","5k","4k","3k","2k","o", "k", "h", "l","b", "c", "z"];

// == Utility ==
function log(msg) {
  console.log("[FlickrExt]", msg);
}

// == Settings ==
function loadSettings(callback) {
  if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.local) {
    // Chrome extension APIs not available, use defaults
    callback();
    return;
  }
  chrome.storage.local.get([KEY_OPEN_LINK, KEY_ALWAYS_SHOW, KEY_MAX_SIZE], (result) => {
    valueOpenLink = !!result[KEY_OPEN_LINK];
    valueAlwaysShow = !!result[KEY_ALWAYS_SHOW];
    valueMaxSize = result[KEY_MAX_SIZE] || 4096;
    callback();
  });
}
function saveSetting(key, value) {
  let obj = {};
  obj[key] = value;
  chrome.storage.local.set(obj);
}


// == Style ==
function injectStyle(css) {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
}
injectStyle(`
.commonButton {
  display: inline-block;
  border-radius: 0.5em;
  margin: 0.2em;
  padding: 0.5em;
  font-size: 90%;
  height: fit-content;
  color: white !important;
  text-decoration: none;
}
.bigButton { background-color: lightgreen; }
.smallButton { background-color: pink; }
.flickr-ext-btns { margin-bottom: 8px; }
.myFuckingLink {
  position: absolute;
  z-index: 999999;
  left: 3px;
  bottom: 0px;
  width: 100%;
  display: block;
  color: white !important;
}
.myFuckingLink:hover {
  background-color: rgba(100, 100, 255,0.65) !important;
}
`);

// == Page Type Detection ==
function getPageType() {
  const htmlClass = document.documentElement.className;
  if (/html-photo-page.+scrappy-view/i.test(htmlClass)) return 'single';
  if (/html-(search-photos-unified|group-pool)-page-view/i.test(htmlClass)) return 'hover';
  if (document.querySelector('div.photo-list-photo-view')) return 'normal';
  if (document.querySelector('div.photo-list-view')) return 'album';
  return 'none';
}

// == Image Extraction ==
function extractImageLinksFromDOM() {
  // Find the <script> tag containing "modelExport" or "sizes"
  const script = [...document.querySelectorAll('script')].map(s => s.textContent).find(t => t.includes('modelExport') || t.includes('"sizes"'));
  if (!script) return null;
  // Try to extract the JSON object
  let sizesObj = null;
  try {
    // Extract the "sizes" object as a JSON string
    const sizesIndex = script.indexOf('"sizes":');
    if (sizesIndex !== -1) {
      let start = script.indexOf('{', sizesIndex);
      if (start !== -1) {
        let braceCount = 1;
        let end = start + 1;
        while (end < script.length && braceCount > 0) {
          if (script[end] === '{') braceCount++;
          else if (script[end] === '}') braceCount--;
          end++;
        }
        let sizesStr = script.substring(start, end);
        log("RAW SIZES STRING:");
        log(sizesStr);
        // Clean up JS object to valid JSON:
        // 1. Add double quotes around keys
        sizesStr = sizesStr.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
        // 2. Replace single quotes with double quotes
        sizesStr = sizesStr.replace(/'/g, '"');
        // 3. Remove trailing commas
        sizesStr = sizesStr.replace(/,(\s*[}\]])/g, '$1');
        log("CLEANED SIZES STRING:");
        log(sizesStr);
        sizesObj = JSON.parse(sizesStr);
      }
    }
  } catch (e) {
    log("Failed to parse sizes from DOM: " + e);
    return null;
  }
  if (!sizesObj) return null;
  // Build array of {url, size}
  const links = [];
  for (const key of imageSizeOrder) {
    if (sizesObj[key] && sizesObj[key].displayUrl && sizesObj[key].width && sizesObj[key].height) {
      links.push({
        url: (() => {
          let u = sizesObj[key].displayUrl.replace(/\\/g, "").replace(/(_[0-9a-z]+)\.([a-z]{3,4})/i, valueOpenLink ? '$1.$2' : '$1_d.$2');
          if (u.startsWith("//")) u = "https:" + u;
          return u;
        })(),
        size: `${sizesObj[key].width} x ${sizesObj[key].height}`
      });
    }
  }
  return links;
}

// == Inject Download/Open Links ==
function injectSinglePage() {
  // This function is now empty to remove the injected link
}

function injectNormalOrAlbumPage(type) {
  // This function is now empty to remove the injected link
}

function injectHoverPage() {
  // This function is now empty to remove the injected link
}

// == Settings UI ==
function injectSettingsBox() {
  if (document.querySelector(".flickr-ext-settings")) return;
  const navMenu = document.querySelector("ul.nav-menu");
  if (!navMenu) return;
  const li = document.createElement("li");
  li.className = "flickr-ext-settings";
  li.innerHTML = `
    <div style="color:pink;padding:1px">
      <input id="optionbox_openLink" type="checkbox"${valueOpenLink ? " checked" : ""} style="margin:2px"/>Open image link in browser<br>
      <input id="optionbox_alwaysShow" type="checkbox"${valueAlwaysShow ? " checked" : ""} style="margin:2px"/>Always show image information in Photostream
    </div>
  `;
  navMenu.appendChild(li);
  document.getElementById("optionbox_openLink").addEventListener("change", e => {
    valueOpenLink = e.target.checked;
    saveSetting(KEY_OPEN_LINK, valueOpenLink);
    setTimeout(kickStart, 500);
  });
  document.getElementById("optionbox_alwaysShow").addEventListener("change", e => {
    valueAlwaysShow = e.target.checked;
    saveSetting(KEY_ALWAYS_SHOW, valueAlwaysShow);
  });
}

// == Main Logic ==
function kickStart() {
  const type = getPageType();
  if (type === 'single') injectSinglePage();
  else if (type === 'normal' || type === 'album') injectNormalOrAlbumPage(type);
  else if (type === 'hover') injectHoverPage();
  setTimeout(injectSettingsBox, 1000);
}

// == SPA Navigation Observer ==
let prevUrl = location.href;
const observer = new MutationObserver(() => {
  if (location.href !== prevUrl) {
    prevUrl = location.href;
    setTimeout(kickStart, 1000);
  }
});
observer.observe(document.body, { childList: true, subtree: true });

// == Initial Run ==
loadSettings(() => {
  kickStart();
});

// == Message Listener for Popup (optional, for download button) ==
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getImageUrl") {
    const imageLinks = extractImageLinksFromDOM();
    const maxSize = request.maxSize || valueMaxSize;
    if (imageLinks && imageLinks.length > 0) {
      // Find all images with width and height <= maxSize
      let candidates = imageLinks.filter(link => {
        const [w, h] = link.size.split('x').map(s => parseInt(s.trim(), 10));
        return w <= maxSize && h <= maxSize;
      });
      // From those, pick the one with the largest area
      let chosen = null;
      if (candidates.length > 0) {
        chosen = candidates.reduce((max, link) => {
          const [w, h] = link.size.split('x').map(s => parseInt(s.trim(), 10));
          const area = w * h;
          const [maxW, maxH] = max.size.split('x').map(s => parseInt(s.trim(), 10));
          const maxArea = maxW * maxH;
          return area > maxArea ? link : max;
        }, candidates[0]);
      } else {
        // Fallback: largest available image
        chosen = imageLinks[imageLinks.length - 1];
      }
      sendResponse({ status: "success", imageUrl: chosen.url });
    } else {
      sendResponse({ status: "failed", error: "No image links found" });
    }
    return true;
  }
});
})(); // End IIFE