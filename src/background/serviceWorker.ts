/**
 * Background Service Worker for Website Upgrade Detector by SkyDevLab
 * Manifest V3 compliant service worker.
 */

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[Website Upgrade Detector] Extension installed successfully.');
  } else if (details.reason === 'update') {
    console.log('[Website Upgrade Detector] Extension updated to version:', chrome.runtime.getManifest().version);
  }
});

// Listener for background messaging if needed
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'WUD_PING') {
    sendResponse({ status: 'ok', version: chrome.runtime.getManifest().version });
  }
  return true;
});
