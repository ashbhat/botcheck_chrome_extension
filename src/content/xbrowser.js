/**
 * /content/xbrowser.js
 *
 * Wraps chrome/safari/firefox methods to do the right thing per browser.
 * Uses https://github.com/mozilla/webextension-polyfill internally to simplify things.
 * Most of these methods return promises, unlike the direct `chrome.*` methods.
 */

(function() {

  // Where gulp outputs js/css folders relative to the xcode project.
  const extensionBuildOutputFolder = 'build/';
  const isSafari = 'safari' in window;
  const safariExtensionHandlerMessages = {
    BC_OPEN_NEW_TAB: 'BC_OPEN_NEW_TAB'
  };

  // In Safari we need to use localStorage, so we include Lockr to do the JSON parsing etc.
  // https://github.com/tsironis/lockr

  BC.xbrowser = {
    storage: {
      /**
       * STORAGE
       */
      get(key) {
        /**
         * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/StorageArea/get
         */
        console.assert(key === null || key.constructor === String);

        if (isSafari) {
          let data;

          if (key === null) {
            // Special case if "null" - return all data
            // Turn array of dicts into 1 big dict
            data = Object.assign({}, ...Lockr.getAll(true));
          }
          else {
            // Return in same format as the browser.storage API.
            data = {[key]: Lockr.get(key)};
          }

          return Promise.resolve(data);
        }

        return browser.storage.local.get(key);
      },
      set(keys) {
        /**
         * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/StorageArea/set
         */
        console.assert(keys.constructor === Object);

        if (isSafari) {
          // localStorage doesn't support setting multiple keys at once, so we do it manually.
          for (let [key, val] of Object.entries(keys)) {
            Lockr.set(key, val);
          }
          return Promise.resolve();
        }

        return browser.storage.local.set(keys);
      },
      queueSet(keyPath, value) {
        /**
         * Because chrome.storage.sync is throttled, we queue things for things that are rapid-fire updating.
         * - In non-safari it just wraps browser.runtime.sendMessage which the background script handles.
         * - In safari things use localstorage, so no need for this.
         */
        console.assert(keyPath.constructor === Array);
        console.log('(botcheck) - queueSet', arguments);

        if (isSafari) {
          // Traverse tree to find right place to set value
          // Safari optimization: instead of retrieving all of storage, we just get the relevant key
          // so that `updateNestedKey` only needs to update the children
          let firstKey = keyPath[0];
          let existing = Lockr.get(firstKey) || {};
          let data = BC.util.updateNestedKey(existing, keyPath.slice(1), value);

          console.log('(botcheck) - existing for', firstKey, existing);
          console.log('(botcheck) - setting new data for key', firstKey, data);

          Lockr.set(firstKey, data);
          return;
        }

        browser.runtime.sendMessage({
          type: BC.backgroundMessageTypes.storageQueueUpdate,
          key: keyPath,
          value: value
        });
      },
      onChanged(callback) {
        /**
         * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/onChanged
         */
        console.assert(callback.constructor === Function);

        if (isSafari) {
          // Try to mimic how chrome's onChanged.addListener works.
          window.addEventListener('storage', (event) => {
            let changes = {
              [event.key]: {
                oldValue: event.oldValue,
                newValue: Lockr.get(event.key)
              }
            };
            callback(changes)
          });
          return;
        }

        browser.storage.onChanged.addListener(callback);
      }
    },
    /**
     * EXTENSION HELPERS
     */
    extension: {
      getURL(path) {
        /**
         * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/getURL
         * https://developer.apple.com/documentation/safariservices/safari_app_extensions/injecting_a_script_into_a_webpage
         */
        if (isSafari) {
          // WTF: sometimes the safari.extension object dissappears randomly.
          // This seeems to happen when an swallowed/not thrown error happens in our content scripts, but I'm not sure.
          if (!safari.extension || !safari.extension.baseURI) {
            console.error('safari.extension.baseURI not set', safari.extension);
          }
          return safari.extension.baseURI + extensionBuildOutputFolder + path;
        }
        return browser.runtime.getURL(path);
      }
    },
    /**
     * TABS
     */
    tabs: {
      open(url) {
        console.log('(botcheck) xbrowser.tabs.open', url);

        if (isSafari) {
          // Call our Swift code.
          safari.extension.dispatchMessage(safariExtensionHandlerMessages.BC_OPEN_NEW_TAB, {
            url: url
          });
          return;
        }

        // window.open can get blocked by the popup blocker so we need to call it via the background script.
        browser.runtime.sendMessage({
          type: BC.backgroundMessageTypes.openNewTab,
          url: url
        });
      }
    }
  };

})();

