/**
 * /content/store.js
 *
 * A Vuex store that keeps track of state in the current tab.
 */

Vue.use(Vuex);

const store = new Vuex.Store({ // eslint-disable-line no-unused-vars
  state: {
    // Stores the last tweet the user interacted with,
    // useful if later we want to e.g. trigger a report
    lastInteractedTweetEl: null,
    dialogs: {
      results: {
        visible: false,
        username: '',
        realName: '',
        whitelisted: false,
        tweetElement: null
      },
      thanks: {
        visible: false
      }
    },
    results: {
      /*
      exampleUsername: {
        deepScan: false, // Wether the result is from a deep scan
        prediction: false,
        realName: 'exampleRealName',
        username: 'exampleUsername'
      }
      */
    },
    whitelist: {
      /*
      exampleUsername: {
        realName: 'exampleRealName'
      }
      */
    }
  },
  mutations: {
    AUTH_APIKEY_SET(state, apiKey) {
      console.log('(botcheck) mutation: AUTH_APIKEY_SET');
      state.apiKey = apiKey;
    },
    // Loads deepscan results coming from browser storage
    LOAD_DEEPSCAN_RESULTS(state, results = {}) {
      console.log('(botcheck) mutation: LOAD_DEEPSCAN_RESULTS');
      // Merge deep scan results in, ignoring those without a prediction
      Object.keys(results).forEach((key) => {
        const result = results[key];
        if (result.prediction === true || result.prediction === false) {
          Vue.set(state.results, key, result);
        }
      });
    },
    // This mutation should only be called by the LOAD_WHITELIST action
    DONOTCALLDIRECTLY_LOAD_WHITELIST(state, whitelist) {
      console.log('(botcheck) mutation: LOAD_WHITELIST');
      state.whitelist = whitelist || {};
    },
    SET_LAST_TWEET_INTERACTED_WITH(state, tweetElement) {
      console.log('(botcheck) mutation: SET_LAST_TWEET_INTERACTED_WITH');
      console.log(tweetElement);
      state.lastInteractedTweetEl = tweetElement;
    },
    RESULTS_OPEN(state, {
      username,
      realName,
      whitelisted,
      clickEvent
    }) {
      console.log('(botcheck) mutation: RESULTS_OPEN');
      state.dialogs.results = {
        visible: true,
        username,
        realName,
        whitelisted,
        clickEvent
      };
    },
    RESULTS_CLOSE(state) {
      console.log('(botcheck) mutation: RESULTS_CLOSE');
      state.dialogs.results = {
        visible: false,
        username: '',
        realName: ''
      };
    },
    THANKS_OPEN(state) {
      console.log('(botcheck) mutation: THANKS_OPEN');
      state.dialogs.thanks.visible = true;
    },
    THANKS_CLOSE(state) {
      console.log('(botcheck) mutation: THANKS_CLOSE');
      state.dialogs.thanks.visible = false;
    },
    LEARN_MORE() {
      console.log('(botcheck) mutation: LEARN_MORE');
      window.open('https://botcheck.me');
    },
    SHARE(state, { username, prediction }) {
      console.log('(botcheck) mutation: SHARE');
      const msg = prediction === true ? 'likely' : 'not+likely';
      window.open(`https://twitter.com/intent/tweet/?text=I+just+found+out+@${username}+is+${msg}+a+propaganda+account%2C+by+using+the+botcheck+browser+extension%21+You+can+download+it+from+https%3A%2F%2Fbotcheck.me+and+check+for+yourself.`);
    }
  },
  actions: {
    AUTH_TWITTER() {
      let isLoginPage = (location.pathname.indexOf('/login') == 0);

      if (window.top === window && !isLoginPage) {
        console.log('(botcheck) action: AUTH_TWITTER');

        const browserToken = BC.util.generateBrowserToken();
        BC.xbrowser.tabs.open(`${botcheckConfig.apiRoot}/ExtensionLogin?token=${browserToken}`);
        // Now the background script auth-listener.js should see the login and trigger a response.
      }
      else {
        console.log('(botcheck) action: AUTH_TWITTER - skipping because not relevant tab.');
      }
    },
    LOAD_WHITELIST(context, newWhitelist) {
      console.log('(botcheck) action: LOAD_WHITELIST. Whitelist:');
      console.log(newWhitelist);

      // Get list of users removed from whitelist
      // and if no status is found locally, run deep scan
      Object.keys(context.state.whitelist).forEach((username) => {
        if (!newWhitelist[username]) {
          context.dispatch('SCAN', {
            deepScan: true,
            username,
            realName: context.state.whitelist[username].realName,
            ignoreWhitelist: true
          });
        }
      });
      context.commit('DONOTCALLDIRECTLY_LOAD_WHITELIST', newWhitelist);
    },
    BULK_LIGHT_SCAN(context, users = []) {
      console.log('(botcheck) action: BULK_LIGHT_SCAN');

      if (users.length < 1) {
        return;
      }

      if (!context.state.apiKey) {
        console.log('(botcheck) Called bulk light scan but store has no API key. Triggering authentication...');
        context.dispatch('AUTH_TWITTER');
        return;
      }

      const processedUsers = users.filter((user) => {
        // Don't check whitelisted accounts
        if (context.state.whitelist[user.username]) {
          return false;
        }

        // Don't check network again if this is a light scan
        // and we already have a result (from a deep scan or not)
        if (context.state.results && context.state.results[user.username]) {
          const previousResult = context.state.results[user.username];
          if (previousResult === true || previousResult === false) {
            return false;
          }
        }
        return true;
      });

      let handles = processedUsers.map(user => `@${user.username}`);

      // Remove repeated handles
      handles = Array.from(new Set(handles));

      console.log('Handles:');
      console.log(handles);

      const usernameDictionary = {};
      processedUsers.forEach((user) => {
        usernameDictionary[user.username] = user;
      });

      axios
        .post(`${botcheckConfig.apiRoot}/LightScanBulk`, {
          usernames: handles,
          apikey: context.state.apiKey
        })
        .then((result) => {
          if (result && result.data) {
            console.log('(botcheck) Bulk light scan successful:');
            console.log(result);

            result.data.response.forEach((value) => {
              context.dispatch('STORE_RESULT', {
                deepScan: false,
                realName: usernameDictionary[value.username].realName,
                username: value.username,
                prediction: value.prediction
              });
              context.dispatch('LOG', value);
            });
          }
        })
        .catch((e) => {
          console.error(e);
          console.error('Unable to run bulk light scan.');
        });
    },
    SCAN(context, {
      username,
      realName,
      ignoreWhitelist = false,
      deepScan = false
    }) {
      console.log(`(botcheck) action: SCAN. Username: ${username} deepScan: ${deepScan}`);

      if (!realName || !username) {
        console.error(`
          (botcheck) Called scan without real name or username.
          realName: ${realName}
          username: ${username}
        `);
        return;
      }
      if (!context.state.apiKey) {
        console.log('(botcheck) Called scan but store has no API key. Triggering authentication...');
        context.dispatch('AUTH_TWITTER');
        return;
      }

      // Don't check whitelisted accounts
      if (!ignoreWhitelist && context.state.whitelist[username]) {
        console.log(`${username} is whitelisted, aborting scan`);
        return;
      }

      // Don't check network again if this is a light scan
      // and we already have a result (from a deep scan or not)
      let previousResult;
      if (context.state.results && context.state.results[username]) {
        previousResult = context.state.results[username];
      }
      if (
        !deepScan
        && (previousResult === true || previousResult === false)
      ) {
        console.log(`(botcheck) Light scan requested for ${username}, but result found. Aborting scan.`);
        return;
      }

      let endpoint;
      if (deepScan) {
        endpoint = '/DeepScan';
      } else {
        endpoint = '/LightScan';
      }

      axios
        .post(`${botcheckConfig.apiRoot}${endpoint}`, {
          username,
          apikey: context.state.apiKey
        })
        .then((result) => {
          if (result && result.data) {
            console.log(`${username} has been${(deepScan ? ' deep ' : ' light ')}scanned. Prediction: ${result.data.prediction}`);

            if (result.data.error) {
              console.log('(botcheck) Error while running scan:');
              console.log(result.data.error);
              result.data.prediction = null; // null means unknown
            }

            context.dispatch('STORE_RESULT', {
              deepScan,
              realName,
              username: result.data.username,
              prediction: result.data.prediction
            });
            context.dispatch('LOG', result.data);
          }
        })
        .catch((e) => {
          console.error(e);
          console.error('Unable to run scan.');

          // Store unknown result
          context.dispatch('STORE_RESULT', {
            deepScan,
            realName,
            username,
            prediction: null // null means unknown
          });
        });
    },
    // Stores the result of a user being scanned
    STORE_RESULT(context, result) {
      console.log(`(botcheck) action: STORE_RESULT. Username: ${result.username} Prediction: ${result.prediction}`);

      let previousResult;
      if (context.state.results && context.state.results[result.username]) {
        previousResult = context.state.results[result.username];
      }

      // Refuse new result if previous result exists and:
      if (previousResult) {
        // New result is not deep scan AND previous result is deep scan
        if (!result.deepScan && previousResult.deepScan) {
          console.log(`
            (botcheck) Ignored light scan result for ${result.username} because
            deep scan result was already stored.
          `);
          return;
        }

        // OR if new result has no prediction
        if (
          result.prediction !== true
          && result.prediction !== false
        ) {
          console.log(`
            (botcheck) Ignored scan result for ${result.username} because
            it had no prediction and another result was already stored.
          `);
          return;
        }
      }

      Vue.set(context.state.results, result.username, result);

      // Only send deep scans to browser storage
      if (result.deepScan) {
        BC.xbrowser.storage.queueSet(['results', result.username], result);
      }
    },
    DISAGREE(context, prediction) {
      console.log(`
        (botcheck) action: DISAGREE.
        Username: ${context.state.dialogs.results.username}
        Prediction: ${prediction}
      `);
      axios
        .post(`${botcheckConfig.apiRoot}/disagree`, {
          prediction,
          username: context.state.dialogs.results.username,
          apikey: context.state.apiKey
        })
        .catch((e) => {
          console.error(e);
          console.error('Unable to log disagreement.');
        });
    },
    LOG(context, payload) {
      console.log('(botcheck) action: LOG');
      /*
        // Log errors/messages/etc to remote logger
        const uuid = BC.util.generateUuid();

        axios
          .post('https://log.declaredintent.com/entries', {
            namespace: 'me.botcheck.chrome-extension',
            useragent: navigator && navigator.userAgent,
            payload,
            uuid
          })
          .catch((e) => {
            console.error(e);
            console.error('Unable to log to declared intent. Attempted to send payload:');
            console.error(payload);
          });
      */
    }
  }
});
