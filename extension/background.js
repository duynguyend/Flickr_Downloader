chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "downloadImage") {
    if (request.imageUrl) {
      chrome.downloads.download({
        url: request.imageUrl,
        // Suggest a filename (optional, Chrome might adjust it)
        // filename: "flickr-image.jpg"
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error("Download failed:", chrome.runtime.lastError);
          sendResponse({ status: "failed", error: chrome.runtime.lastError.message });
        } else {
          console.log("Download started with ID:", downloadId);
          sendResponse({ status: "success", downloadId: downloadId });
        }
      });
      // Indicate that the response will be sent asynchronously
      return true;
    } else {
      console.error("No image URL provided for download.");
      sendResponse({ status: "failed", error: "No image URL provided" });
      return true;
    }
  }
  return false;
});

// Optional: Log when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  console.log('Flickr Image Downloader installed.');
});