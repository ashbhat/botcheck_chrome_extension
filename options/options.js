// Options can access the store object from the background script,
// so no need to do syncing here.
let bg = chrome.extension.getBackgroundPage();
let store = bg.store;

let app = new Vue({
  el: '#app',
  data() {
    return {
      message: store.state.synced.message
    };
  },
  methods: {
    updateMessage(ev) {
      store.commit('UPDATE_MESSAGE', ev.target.value);
    }
  }
});
