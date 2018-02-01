chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
    if(details.frameId === 0) {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, "reload");
      });
    }
});

var timeoutvar;
var currentColor;

chrome.runtime.onMessage.addListener(function (msg, sender) {
  if ((msg.from === 'content') && (msg.subject === 'loading')) {
    timeoutvar = setInterval(function(){
      if (currentColor == "green") {
        currentColor = "yellow"
        chrome.browserAction.setIcon({ path: "main.png" });
      }
      else{
        currentColor = "green"
        chrome.browserAction.setIcon({ path: "main.png" });
      }
    }, 400);

  }
  else{
    clearInterval(timeoutvar);
    chrome.browserAction.setIcon({ path: "main.png" });
  }
});
