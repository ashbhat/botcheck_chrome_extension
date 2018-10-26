/**
 * /content/util.js
 *
 * Utility methods.
 */

BC.util = {
  generateBrowserToken() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < 32; i += 1) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  },
  generateUuid() {
    /**
     * https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
     */
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
  },
  parseQueryString(queryString) {
    const query = {};
    const pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');

    pairs.forEach((i) => {
      const pair = i.split('=');
      query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    });

    return query;
  },
  onDOMReady(fn) {
    /**
     * Because `DOMContentLoaded` only fires once, and in safari we need the page to be ready before doing any html.
     * This function will also fire even if the event already happened.
     */
    if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  },
  updateNestedKey(object, path, value) {
    /**
     * Updates a nested key in a object,
     * given a path ['in', 'this', 'format']
     * updates object.in.this.format to value.
     */
    if (!object || !path || path.length < 1) {
      return object;
    }
    // Set and return if done iterating over key components.
    if (path.length === 1) {
      object[path[0]] = value;
      return object;
    }
    // Create path if it doesn't exist
    if (!object[path[0]]) {
      object[path[0]] = {};
    }
    return this.updateNestedKey(object[path[0]], path.slice(1), value);
  }
};