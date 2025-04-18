document.addEventListener('DOMContentLoaded', () => {
  const downloadButton = document.getElementById('downloadButton');
  const statusDiv = document.getElementById('status');

  const maxSizeInput = document.getElementById('maxSize');

  downloadButton.addEventListener('click', () => {
    statusDiv.textContent = 'Finding image...';
    downloadButton.disabled = true; // Disable button during processing
    const maxSize = parseInt(maxSizeInput.value, 10);

    // Get the current active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        statusDiv.textContent = 'Error: No active tab found.';
        downloadButton.disabled = false;
        return;
      }
      const activeTab = tabs[0];

      // Check if the tab is a Flickr page (optional but good practice)
      if (!activeTab.url || !activeTab.url.includes('flickr.com')) {
          statusDiv.textContent = 'Error: Not a Flickr page.';
          downloadButton.disabled = false;
          return;
      }

      // Dynamically inject content.js into the current tab
      chrome.scripting.executeScript(
        {
          target: { tabId: activeTab.id },
          files: ['content.js']
        },
        (injectionResults) => {
          if (chrome.runtime.lastError) {
            statusDiv.textContent = `Error injecting script: ${chrome.runtime.lastError.message}`;
            console.error("Script injection failed:", chrome.runtime.lastError);
            downloadButton.disabled = false;
            return;
          }

          // After injection, send the message to the content script
          chrome.tabs.sendMessage(activeTab.id, { action: "getImageUrl", maxSize: maxSize }, (response) => {
            if (chrome.runtime.lastError) {
              if (chrome.runtime.lastError.message && chrome.runtime.lastError.message.includes("Receiving end does not exist")) {
                statusDiv.textContent = "Error: Extension not active on this page. Please reload the Flickr page and try again.";
              } else {
                statusDiv.textContent = `Error: ${chrome.runtime.lastError.message}`;
              }
              console.error(chrome.runtime.lastError);
              downloadButton.disabled = false;
              return;
            }

            if (response && response.status === "success" && response.imageUrl) {
              statusDiv.textContent = 'Image found! Requesting download...';
              // Send message to background script to download the image
              chrome.runtime.sendMessage({ action: "downloadImage", imageUrl: response.imageUrl }, (downloadResponse) => {
                if (chrome.runtime.lastError) {
                    statusDiv.textContent = `Download Error: ${chrome.runtime.lastError.message}`;
                    console.error("Download request failed:", chrome.runtime.lastError);
                } else if (downloadResponse && downloadResponse.status === "success") {
                  statusDiv.textContent = 'Download started!';
                } else {
                  statusDiv.textContent = `Download failed: ${downloadResponse ? downloadResponse.error : 'Unknown error'}`;
                  console.error("Download failed response:", downloadResponse);
                }
                 downloadButton.disabled = false; // Re-enable button
              });
            } else {
              statusDiv.textContent = `Error: ${response ? response.error : 'Could not get image URL.'}`;
              downloadButton.disabled = false; // Re-enable button
            }
          });
        }
      );
    });
  });
});