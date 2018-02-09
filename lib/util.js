function generateBrowserToken() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < 15; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

// Just for syntax highlighting in vscode...
function html(strings, ...keys) {
  return function(...values) {
    if (!values) {
      return '';
    }
    let dict = values[values.length - 1] || {};
    let result = [strings[0]];
    keys.forEach((key, i) => {
      let value = Number.isInteger(key) ? values[key] : dict[key];
      result.push(value, strings[i + 1]);
    });
    return result.join('');
  };
}

// https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function generateUuid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
