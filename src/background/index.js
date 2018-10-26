

(function() {

// Main message handler for comms between content script & background page.
browser.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type == BC.backgroundMessageTypes.openNewTab) {
    browser.tabs.create({url: msg.url})
  }
});

// Reloads every twitter tab when this backround page loads.
// This is useful when a users installs the extension with a twitter tab open,
// and then goes to that tab expecting to see it in action.
browser.tabs.query({ url: 'https://twitter.com/*' }).then((tabs) => {
  tabs.forEach(tab => browser.tabs.reload(tab.id));
});


})();