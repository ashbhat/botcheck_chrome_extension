BC.internationalization.getInternationalizer((i) => {

  Vue.component('dialog-results', {
    template: `
      <el-dialog :visible.sync="dialogVisible" class="botcheck-dialog">
        <el-container v-if="result && 'prediction' in result">
          <el-main v-if="whitelisted">
            <el-row type="flex">
              <el-col :span="5">
                <img :src="icon" class="botcheck-modal-image">
              </el-col>
              <el-col :span="19">
                <span class="header">${i('results_userWhitelisted')}</span>
                <span class="status-text">
                  <strong>@{{ result.username }}</strong> ${i('results_userWhitelistedDescription')}
                </span>
                <el-button type="text" class="remove-from-whitelist"
                  @click="removeFromWhitelist(result.username)">
                  ${i('results_unwhitelist')}
                </el-button>
                </div>
              </el-col>
            </el-row>
          </el-main>
          <el-main v-else>
            <el-row type="flex">
              <el-col :span="5">
                <img :src="icon" class="botcheck-modal-image">
              </el-col>
              <el-col :span="19">

                <div v-if="prediction === true">
                  <span class="header">${i('results_isBot')}</span>
                  <span class="status-text">
                    ${i('results_isBotDescription', {
                      username: '<strong>@{{ result.username }}</strong>'
                    })}
                  </span>
                </div>
                <div v-else-if="prediction === false">
                  <span class="header">${i('results_notBot')}</span>
                  <span class="status-text">
                    ${i('results_notBotDescription', {
                      username: '<strong>@{{ result.username }}</strong>'
                    })}
                  </span>
                </div>
                <div v-else>
                  <span class="header">${i('results_unknown')}</span>
                  <span class="status-text">
                    ${i('results_unknownDescription', {
                      username: '<strong>@{{ result.username }}</strong>'
                    })}
                  </span>
                </div>

                <div v-if="prediction !== null"
                    :class="{ 'share-link': true, 'positive': prediction === false }">
                  <a href="#" @click="share">
                    <i class="Icon Icon--bird"></i><span>${i('results_sharePrompt')}</span>
                  </a>
                </div>
              </el-col>
            </el-row>
            <el-dropdown trigger="click" @command="actionCommand">
              <span class="el-dropdown-link">
                <i class="el-icon-arrow-down el-icon--right"></i>
              </span>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item
                  command="disagree"
                  v-if="prediction !== null"
                >
                  ${i('results_dropdown_disagree')}
                </el-dropdown-item>
                <el-dropdown-item
                  command="whitelist"
                  v-if="prediction !== null"
                >
                  ${i('results_dropdown_whitelist')}
                </el-dropdown-item>
                <el-dropdown-item
                  divided
                  command="report"
                  v-if="prediction !== null"
                >
                  ${i('results_dropdown_report')}
                </el-dropdown-item>
                <el-dropdown-item
                  :divided="prediction !== null"
                  command="learn-more"
                >
                  ${i('results_dropdown_learnMore')}
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </el-main>
        </el-container>
      </el-dialog>
    `,
    computed: {
      username() {
        return this.$store.state.dialogs.results.username;
      },
      realName() {
        return this.result.realName;
      },
      whitelisted() {
        return this.$store.state.dialogs.results.whitelisted;
      },
      lastInteractedTweetEl() {
        return this.$store.state.lastInteractedTweetEl;
      },
      result() {
        const results = this.$store.state.results;
        if (results && results[this.username]) {
          return results[this.username];
        }
        return {};
      },
      prediction() {
        return this.result.prediction;
      },
      icon() {
        if (this.whitelisted) {
          return BC.xbrowser.extension.getURL('icons/happy@128-gray.png');
        }
        if (this.prediction === true) {
          return BC.xbrowser.extension.getURL('icons/mad@128.png');
        }
        if (this.prediction === false) {
          return BC.xbrowser.extension.getURL('icons/happy@128.png');
        }
        return BC.xbrowser.extension.getURL('icons/scanning@128.png');
      },
      dialogVisible: {
        get() {
          return this.$store.state.dialogs.results.visible;
        },
        set() {
          this.$store.commit('RESULTS_CLOSE');
        }
      }
    },
    methods: {
      actionCommand(type) {
        if (type === 'disagree') {
          this.$store.commit('RESULTS_CLOSE');
          this.$store.dispatch('DISAGREE', this.prediction);
          this.$store.commit('THANKS_OPEN');
        } else if (type === 'whitelist') {
          this.addToWhitelist(this.result);
        } else if (type === 'report') {
          this.reportTweet();
        } else {
          this.$store.commit('LEARN_MORE');
        }
      },
      share() {
        this.$store.commit('SHARE', { prediction: this.prediction, username: this.username });
        this.$store.commit('RESULTS_CLOSE');
      },
      // Updates whitelist on browser storage.
      // Other content scripts should pick up on the change
      addToWhitelist(result) {
        console.log('(botcheck) addToWhitelist', result);

        if (!result.username || !result.realName) {
          console.error(`
            (botcheck) Attempted to whitelist user but missing username or real name.
            result: ${result}
            username: ${result.username}
            realName: ${result.realName}
          `);
        }
        this.getWhitelist((whitelist) => {
          whitelist[result.username] = {
            realName: result.realName
          };
          this.setWhitelist(whitelist, () => {
            this.$store.commit('RESULTS_CLOSE');
          });
        });
      },
      // Updates whitelist on browser storage.
      // Other content scripts should pick up on the change
      removeFromWhitelist(username) {
        this.getWhitelist((whitelist) => {
          if (whitelist[username]) {
            delete whitelist[username];
            this.setWhitelist(whitelist);
          } else {
            console.warn(`
              (botcheck) Attempted to remove user from whitelist by clicking
              button in results dialog, but user was not in whitelist.
            `);
          }
          this.$store.commit('RESULTS_CLOSE');
        });
      },
      getWhitelist(callback) {
        BC.xbrowser.storage.get('whitelist').then(({whitelist}) => {
          callback(whitelist || {});
        });
      },
      setWhitelist(whitelist, callback) {
        console.log('(botcheck) setWhitelist', whitelist);

        BC.xbrowser.storage.set({whitelist}).then(() => {
          this.$store.dispatch('LOAD_WHITELIST', whitelist);

          if (callback) {
            callback();
          }
        });
      },
      reportTweet() {
        // Store click event and username before they get erased
        const clickEvent = this.$store.state.dialogs.results.clickEvent;
        const username = this.$store.state.dialogs.results.username;

        // Close botcheck results dialog
        this.$store.commit('RESULTS_CLOSE');

        if (!clickEvent) {
          console.log('(botcheck) Tried to report after clicking status but couldn\'t find clickEvent.');
          return;
        }
        // eslint-disable-next-line no-use-before-define
        const clicked = clickRelevantReportButton(clickEvent, username, this.lastInteractedTweetEl);
        if (!clicked) {
          window.open('https://help.twitter.com/en/rules-and-policies/twitter-report-violation');
        }
      }
    }
  });

  function clickReportButtonOfTweet(tweet) {
    const button = tweet.querySelector('.report-link.js-actionReport button');
    if (button) {
      console.log('(botcheck) Clicking report button of tweet.');
      console.log('Tweet:');
      console.log(tweet);

      button.click();
      return true;
    }
    return false;
  }

  // Returns the relevant report button related to
  // a given click event
  // (the event is from when the user clicked the botcheck status)
  // Returns true if clicked successfully, false otherwise
  function clickRelevantReportButton(e, username, lastInteractedTweetEl) {
    // Attempt to extract report button from closest tweet
    const closestTweet = e.target.closest('.tweet');
    if (closestTweet) {
      // Ignore full screen tweets
      // TODO: Move this tweet processing logic to its own module

      let parentIsModal = false;
      const classList = closestTweet.parentElement.classList;
      for (const c of classList) { // eslint-disable-line no-restricted-syntax
        if (c === 'modal-tweet' || c === 'modal-body') {
          parentIsModal = true;
        }
      }

      if (!parentIsModal) {
        return clickReportButtonOfTweet(closestTweet);
      }
    }

    // Attempt to extract report button from
    // the dropdown present in profile pages
    if (document.querySelector('div.ProfileHeaderCard')) {
      const li = document.querySelector('li.report-text');
      if (li) {
        const button = li.querySelector('button.dropdown-link');

        if (button) {
          // We have to open the dropdown first, or report dialog won't open
          const dropdownToggle = document.querySelector('button.user-dropdown.dropdown-toggle');
          dropdownToggle.click();

          console.log('(botcheck) Clicking report button of profile.');
          console.log(button);
          button.click();
          return true;
        }
      }
    }

    // Attempt to extract report button from the last tweet
    // the user clicked reply/retweet on
    const tweet = lastInteractedTweetEl;
    if (tweet) {
      // Check that the stored tweet is of the current user
      const tweetUser = tweet.querySelector('a.account-group span.username');

      if (tweetUser && tweetUser.innerHTML.includes(username)) {
        console.log('(botcheck) Reporting the last tweet user clicked reply/retweet on.');
        return clickReportButtonOfTweet(tweet);
      }
    }
    return false;
  }

});
