# Flickr Image Downloader

This Chrome extension allows you to download images from Flickr pages.

## Features

*   Downloads images from Flickr pages.
*   Provides a settings box to allow the user to configure the maximum size of the image to download.

## How to use

1.  Install the extension from the Chrome Web Store or load the unpacked extension from the `extension` directory.
2.  Open a Flickr page containing the image you want to download.
3.  The extension will automatically inject a download link near the image.
4.  Click the download link to download the image.
5.  You can configure the maximum size of the image to download via the settings in the extension popup.

## Project Structure

```
Flickr_Downloader/
├── LICENSE
├── README.md
├── extension/
│   ├── background.js - Handles background tasks, such as managing downloads.
│   ├── content.js - Injects the download link into Flickr pages.
│   ├── manifest.json - Defines the extension's metadata, permissions, and scripts.
│   ├── popup.html - The HTML structure for the extension's popup.
│   ├── popup.js - Handles the logic for the extension's popup.
│   └── images/ - Contains the extension's icons.
│       ├── icon16.png
│       ├── icon48.png
│       ├── icon64.png
│       └── icon128.png
└── .git/
```
## Development

1.  Clone the repository.
2.  Install dependencies: N/A
3.  Load the unpacked extension in Chrome:
    *   Open Chrome and go to `chrome://extensions/`.
    *   Enable "Developer mode" in the top right corner.
    *   Click "Load unpacked" and select the `extension` directory.

## Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Commit your changes.
4.  Push your changes to your fork.
5.  Submit a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for details.