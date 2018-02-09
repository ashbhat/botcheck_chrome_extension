function injectDialogs() {
  let el = document.createElement('div');
  el.innerHTML = `
    <dialog-auth></dialog-auth>
    <dialog-results></dialog-results>
    <dialog-thanks></dialog-thanks>
  `;
  document.body.appendChild(el);
  new Vue({ el, store });
}
