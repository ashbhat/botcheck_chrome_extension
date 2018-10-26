/**
 * /popup/popup.js
 *
 * Controls the popup that appears when the extension icon is clicked.
 */

const app = new Vue({ // eslint-disable-line no-unused-vars
  el: '#app',
  data() {
    return {
      showMainView: true,
      showWhitelistView: false,
      whitelist: {
        exampleUsername: {
          realName: 'exampleRealName'
        }
      }
    };
  },
  methods: {
    openUrl(url) {
      window.open(url, '_blank');
      window.close();
    },
    openWhitelist() {
      // Load whitelist when opening
      browser.storage.local.get('whitelist').then(({ whitelist }) => {
        console.log('(botcheck) Popup loaded whitelist:');
        console.log(whitelist);

        this.whitelist = whitelist || {};
        this.showMainView = false;
        this.showWhitelistView = true;
      });
    },
    closeWhitelist() {
      this.showWhitelistView = false;
      this.showMainView = true;
    },
    // Updates browser storage,
    // content scripts should listen for changes
    removeFromWhitelist(username) {
      browser.storage.local.get('whitelist').then(({ whitelist }) => {
        if (!whitelist[username]) {
          console.warn(`
            (botcheck) Attempted to remove user from whitelist by clicking X
            on the popup, but user was not in whitelist.
          `);
          return;
        }
        delete whitelist[username];

        // Update UI
        this.whitelist = whitelist;

        browser.storage.local.set({ whitelist });
      });
    },
    openTwitterProfile(username) {
      window.open(`https://twitter.com/${username}`);
    }
  }
});
