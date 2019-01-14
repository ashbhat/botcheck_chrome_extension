/**
 * /popup/popup.js
 *
 * Controls the popup that appears when the extension icon is clicked.
 */

browser.storage.local.get('lang').then(({ lang }) => {

  console.log('(popup) Got lang from storage:', lang);

  BC.internationalization.load(lang);

  BC.internationalization.getInternationalizer((i) => {

    const app = new Vue({ // eslint-disable-line no-unused-vars
      el: '#app',
      data() {
        return {
          showMainView: true,
          showWhitelistView: false,
          showLanguageOptionsView: false,
          whitelist: {
            exampleUsername: {
              realName: 'exampleRealName'
            }
          },
          languageList: []
        };
      },
      methods: {
        i, // Pass internationalizer
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
            this.showWhitelistView = true;
            this.showLanguageOptionsView = false;
            this.showMainView = false;
          });
        },
        closeWhitelist() {
          this.showMainView = true;
          this.showLanguageOptionsView = false;
          this.showWhitelistView = false;
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
        },
        openLanguageOptions() {
          axios
            .get(`${botcheckConfig.internationalizationURL}locales`)
            .then((result) => {
              this.languageList = result.data;

              this.showLanguageOptionsView = true;
              this.showMainView = false;
              this.showWhitelistView = false;
            });
        },
        closeLanguageOptions() {
          this.showMainView = true;
          this.showLanguageOptionsView = false;
          this.showWhitelistView = false;
        },
        chooseLanguage(lang) {
          browser.storage.local.set({ lang });
          this.closeLanguageOptions();

          if (browser && browser.runtime && browser.runtime.sendMessage) {
            // Reload Twitter tabs
            browser.runtime.sendMessage({ message: 'reloadTwitterTabs' }).then(() => {
              // Refresh popup for changes to take effect
              window.location.reload();
            });
          } else {
            window.location.reload();
          }

        }
      }
    });
  });
});
