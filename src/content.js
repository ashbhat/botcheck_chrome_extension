var apikey = ""

var observeDOM = (function(){
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver,
        eventListenerSupported = window.addEventListener;

    return function(obj, callback){
        if( MutationObserver ){
            // define a new observer
            var obs = new MutationObserver(function(mutations, observer){
                if( mutations[0].addedNodes.length || mutations[0].removedNodes.length )
                    callback();
            });
            // have the observer observe foo for changes in children
            obs.observe( obj, { childList:true, subtree:true });
        }
        else if( eventListenerSupported ){
            obj.addEventListener('DOMNodeInserted', callback, false);
            obj.addEventListener('DOMNodeRemoved', callback, false);
        }
    };
})();

function setupPage(){
  var target = document.querySelector('ol.stream-items')

  observeDOM(target  ,function(){
      updateTweets()
      updateProfile()
  });
}

chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {
      setupPage()
    }
);

function httpGet(theUrl)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
    xmlHttp.send( null );
    return xmlHttp.responseText;
}

function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 15; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function disagree(username, apikey, prediction){
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'https://ashbhat.pythonanywhere.com/disagree', true);
  xhr.onload = function () {
    chrome.runtime.sendMessage({
      from:    'content',
      subject: 'finished'
    });
  };
  xhr.send(JSON.stringify({ username: username, apikey: apikey, prediction : prediction}));
}

function check_username(username, apikey){
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'https://ashbhat.pythonanywhere.com/checkhandle/', true);
  xhr.onload = function () {
    chrome.runtime.sendMessage({
      from:    'content',
      subject: 'finished'
    });
    result = JSON.parse(this.responseText)
    if (result["prediction"]) {
      container = document.getElementsByClassName("js-topbar")[0]
      container.innerHTML += "<center><div id=\"bbb\" class=\"botbackground\">  <div class=\"temp\"> <div class=\'classification_title\'/></div>  <img class=\'profile_img\' src=\"" + result["profile_image"] + "\"></img> <div class=\'header_text\'>Propaganda Bot like Patterns Found</div><div class=\'subheader_text\'>Our model has classified @" + username + " to exhibit patterns conducive to a <a>political bot</a> or <a>highly moderated</a> account.</div> <div class=\'links_bbb\'><a href=\'https://medium.com/@robhat/identifying-propaganda-bots-on-twitter-5240e7cb81a9\'> How this works •</a>  <a href=\"http://twitter.com/theashbhat\"> Follow us for updates </a> </div> <div class=\'button_holder\'> <Button id=\'dismiss_button\' class=\'dismiss_button\'>Dismiss</Button> <Button class=\'disagree_button\'>Disagree</Button> <a href=\'https://twitter.com/home?status=Check%20out%20botcheck.me%20to%20analyze%20and%20recognize%20twitter%20bots!\'><button class=\'share_button\'>Share</Button></a> </div>  </div></center>"
      var bigdiv = container.getElementsByClassName("botbackground")[0];
      bigdiv.addEventListener('click', function(mouse_event) {
          document.getElementById("bbb").remove();
      });

      var disagree_button = container.getElementsByClassName("disagree_button")[0];
      disagree_button.addEventListener('click', function(mouse_event) {
          document.getElementById("bbb").remove();
          disagree(username, apikey, true)
          setTimeout(showthanks, 500);
      });
    }
    else{
      // alert("@" + username +  " does not look like a bot")
      container = document.getElementsByClassName("js-topbar")[0]
      container.innerHTML += "<center><div id=\"bbb\" class=\"botbackground\">  <div class=\"temp\"> <div class=\'classification_title\'/></div>  <img class=\'profile_img\' src=\"" + result["profile_image"] + "\"></img> <div class=\'header_text\'>Propaganda Bot like patterns not found</div><div class=\'subheader_text\'>Our model finds that @" + username + " does not exhibit patterns conducive to propaganda bots or moderated behavior conducive to political propaganda accounts.</div><div class=\'links_bbb\'><a href=\'https://medium.com/@robhat/identifying-propaganda-bots-on-twitter-5240e7cb81a9\'>How this works •</a>  <a href=\"http://twitter.com/theashbhat\">Follow us for updates </a> </div> <div class=\'button_holder\'> <Button id=\'dismiss_button\' class=\'dismiss_button\'>Dismiss</Button> <Button class=\'disagree_button\'>Disagree</Button> <a href=\'https://twitter.com/home?status=Check%20out%20botcheck.me%20to%20analyze%20and%20recognize%20twitter%20bots!\'><button class=\'share_button\'>Share</Button></a> </div>  </div></center>"
      var bigdiv = container.getElementsByClassName("botbackground")[0];
      bigdiv.addEventListener('click', function(mouse_event) {
          document.getElementById("bbb").remove();
      });

      var disagree_button = container.getElementsByClassName("disagree_button")[0];
      disagree_button.addEventListener('click', function(mouse_event) {
          document.getElementById("bbb").remove();
          disagree(username, apikey, false)
          setTimeout(showthanks, 500);
      });

    }
  };
  xhr.send(JSON.stringify({ username: username, apikey: apikey}));
}

function showthanks(){

  container = document.getElementsByClassName("js-topbar")[0]
  container.innerHTML += "<center><div id=\"bbb\" class=\"botbackground\">  <div class=\"temp\"> <div class=\'classification_title\'/></div>  <div class=\'header_text\'>Thanks for the feedback!</div><div class=\'subheader_text\'>Our model currently has ~90% accuracy and does make mistakes. Thank you for your reponse. :)</div> <div class=\'button_holder\'> <Button id=\'dismiss_button\' class=\'dismiss_button\'>Dismiss</Button> </div>  </div></center>"
  var bigdiv = container.getElementsByClassName("botbackground")[0];
  bigdiv.addEventListener('click', function(mouse_event) {
      document.getElementById("bbb").remove();
  });
}

Element.prototype.remove = function() {
    this.parentElement.removeChild(this);
}
NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
    for(var i = this.length - 1; i >= 0; i--) {
        if(this[i] && this[i].parentElement) {
            this[i].parentElement.removeChild(this[i]);
        }
    }
}

function botcheck(username){
  if (apikey) {
    check_username(username, apikey);
  }
  else{
    chrome.storage.local.get('chromekey', function(result){
      chromekey = result.chromekey
      if (chromekey) {
        result = httpGet("https://ashbhat.pythonanywhere.com/chromekey?token=" + chromekey);
        result = JSON.parse(result);
        if (result.token) {
          apikey = result.token
          check_username(username, apikey)
        }
        else{
          window.open('https://ashbhat.pythonanywhere.com/chromelogin?token='+chromekey,'1507410086239','width=700,height=500,toolbar=0,menubar=0,location=0,status=1,scrollbars=1,resizable=1,left=0,top=0');
        }
      }
      else{
        var chrome_token = makeid()
        chrome.storage.local.set({'chromekey': chrome_token}, function() {
          window.open('https://ashbhat.pythonanywhere.com/chromelogin?token='+chrome_token,'1507410086239','width=700,height=500,toolbar=0,menubar=0,location=0,status=1,scrollbars=1,resizable=1,left=0,top=0');
        });
      }
    });
  }
}

function updateTweets(){
  var all_tweets = document.getElementsByClassName('stream-item-header');
  for (var i = 0; i < all_tweets.length; i++) {
    var tweet = all_tweets[i]
    if (!tweet.innerHTML.includes("Botcheck.me")) {
      var twitterUrl = tweet.getElementsByClassName("username")[0];
      var username = twitterUrl.textContent.replace("@", "");
      // var username = twitterUrl.replace("https://", "").replace("http://", "").replace("twitter.com/");
      // console.log(username);
      // var mycode = "<a target='_blank' href='http://www.robhat.com/" + username + "' > <button class=\"BotButton\">Russian Bot Check</button> </a>";
      var mycode = "<a target='_blank'> <button username="+  username +" class=\"BotButton\">Botcheck.me</button> </a>";
      tweet.innerHTML += mycode;
      var button = tweet.getElementsByClassName("BotButton")[0];
      button.addEventListener('click', function(mouse_event) {
          var username = mouse_event.path[0].getAttribute("username")
          botcheck(username);
      });

    }
  }
}



function updateProfile(){
  var profile = document.getElementsByClassName('ProfileHeaderCard-name');
  if (profile.length > 0 && profile[0].innerHTML && !profile[0].innerHTML.includes("Botcheck.me")) {
    var username = document.getElementsByClassName('ProfileHeaderCard-screennameLink')[0].textContent.trim().replace("@", "");
    // var username = twitterUrl.replace("https://", "").replace("http://", "").replace("twitter.com/");
    // console.log(username);
    // var mycode = "<a target='_blank' href='http://www.robhat.com/" + username + "' > <button class=\"BotButton\">Russian Bot Check</button> </a>";
    var mycode = "<br/><a target='_blank'> <button username="+  username +" class=\"BigBotButton\">Botcheck.me</button> </a>";
    profile[0].innerHTML += mycode;
    var button = profile[0].getElementsByClassName("BigBotButton")[0];
    button.addEventListener('click', function(mouse_event) {
        var username = mouse_event.path[0].getAttribute("username")
        botcheck(username);
    });
  }
}
// window.setInterval(updateTweets, 1000);
setupPage()
