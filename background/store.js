Vue.use(Vuex);

let apiRoot = 'https://ashbhat.pythonanywhere.com';

let store = new Vuex.Store({
  state: {
    apiKey: '',
    clientTabId: -1,
    // Anything in 'synced' will automatically be synchronized
    // with any injected content scripts running in tabs
    synced: {
      dialogs: {
        results: {
          visible: false,
          loading: false,
          screenName: ''
        },
        thanks: {
          visible: false
        },
        auth: {
          screenName: '',
          visible: false
        }
      },
      results: {
        exampleUserName: {
          username: 'exampleUserName',
          prediction: false,
          profile_image: ''
        }
      }
    }
  },
  actions: {
    AUTH_APIKEY_GET(context, browserToken) {
      axios.get(`${apiRoot}/chromekey?token=${browserToken}`).then(res => {
        if (res && res.data && res.data.token) {
          context.commit('AUTH_CLOSE');
          context.commit('AUTH_APIKEY_SET', res.data.token);
          if (context.state.synced.dialogs.auth.screenName) {
            context.dispatch('SCREEN_NAME_CHECK', context.state.synced.dialogs.auth.screenName);
          }
        }
      });
    },
    AUTH_TWITTER(context) {
      let browserToken = generateBrowserToken();
      chrome.tabs.create(
        {
          url: `${apiRoot}/chromelogin?token=${browserToken}`
        },
        authTab => {
          chrome.tabs.onRemoved.addListener(closedTabId => {
            if (closedTabId === authTab.id) {
              context.dispatch('AUTH_APIKEY_GET', browserToken);
            }
          });
        }
      );
    },
    SCREEN_NAME_CHECK(context, screenName) {
      if (!context.state.apiKey) {
        context.commit('AUTH_OPEN', screenName);
        return;
      }

      context.commit('RESULTS_OPEN', screenName);

      // Don't check network again if we've already done the check
      // This will reset on browser restart
      if (context.state.synced.results[screenName]) {
        context.commit('SCREEN_NAME_CHECK_DONE', context.state.synced.results[screenName]);
        return;
      }

      axios
        .post(`${apiRoot}/checkhandle/`, {
          username: screenName,
          apikey: context.state.apiKey
        })
        .then(result => {
          if (result && result.data) {
            context.commit('SCREEN_NAME_CHECK_DONE', result.data);
            context.dispatch('LOG', result.data);
          }
        });
    },
    DISAGREE(context, prediction) {
      axios.post(`${apiRoot}/disagree`, {
        prediction,
        username: context.state.synced.dialogs.results.screenName,
        apikey: context.state.apiKey
      });
    },
    LOG(context, payload) {
      // Log errors/messages/etc to remote logger
      let uuid = generateUuid();
      try {
        axios.post('https://log.declaredintent.com/entries', {
          namespace: 'me.botcheck.chrome-extension',
          useragent: navigator && navigator.userAgent,
          payload,
          uuid
        });
      } catch (ex) {}
    }
  },
  mutations: {
    CLIENT_TAB_SET(state, tabId) {
      state.clientTabId = tabId;
    },
    AUTH_APIKEY_SET(state, apiKey) {
      state.synced.dialogs.auth.visible = false;
      state.apiKey = apiKey;
    },
    SCREEN_NAME_CHECK_DONE(state, result) {
      Vue.set(state.synced.results, result.username, result);
      state.synced.dialogs.results.loading = false;
    },
    RESULTS_OPEN(state, screenName) {
      if (!state.synced.results[screenName]) {
        state.synced.dialogs.results.loading = true;
      }
      state.synced.dialogs.results.visible = true;
      state.synced.dialogs.results.screenName = screenName;
    },
    RESULTS_CLOSE(state) {
      state.synced.dialogs.results.visible = false;
      state.synced.dialogs.results.screenName = '';
    },
    THANKS_OPEN(state) {
      state.synced.dialogs.thanks.visible = true;
    },
    THANKS_CLOSE(state) {
      state.synced.dialogs.thanks.visible = false;
    },
    AUTH_OPEN(state, screenName) {
      state.synced.dialogs.auth.screenName = screenName;
      state.synced.dialogs.auth.visible = true;
    },
    AUTH_CLOSE(state) {
      state.synced.dialogs.auth.visible = false;
    },
    SHARE(context, screenName) {
      chrome.tabs.create({
        url: `https://twitter.com/intent/tweet/?text=I+just+found+out+@${screenName}+is+likely+a+propaganda+account%2C+by+using+the+botcheck+browser+extension%21+You+can+download+it+from+https%3A%2F%2Fbotcheck.me+and+check+for+yourself.`
      });
    }
  }
});
