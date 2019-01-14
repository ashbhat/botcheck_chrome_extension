(function() {

  const reloadTwitterTabs = () => {
    browser.tabs.query({ url: 'https://twitter.com/*' }).then((tabs) => {
      tabs.forEach(tab => browser.tabs.reload(tab.id));
    });
  };

  // Main message handler for comms between content script & background page.
  browser.runtime.onMessage.addListener((msg, sender) => {
    if (msg.type == BC.backgroundMessageTypes.openNewTab) {
      browser.tabs.create({url: msg.url})
    }
  });

  // Reloads every twitter tab when this background page loads.
  // This is useful when a user installs the extension with a twitter tab open,
  // and then goes to that tab expecting to see it in action.
  console.log('Detected extension load. Reloading Twitter tabs.');
  reloadTwitterTabs();

  // Listen for requests to refresh Twitter tabs
  // (happens when user changes language in the popup)
  browser.runtime.onMessage.addListener((request) => {
    if (request.message === 'reloadTwitterTabs') {
      console.log('Reloading twitter tabs by external request.');
      reloadTwitterTabs();
    }
  });

})();
