
let runID = Math.random();

const log = function(...args) {
    console.log('(botcheck - safari)', runID, ...args);
}

// Dont run inside iframes
if (window.top === window) {
    log("injection script on", document.location.href);
}
else {
    log('skipped because not top frame')
}

