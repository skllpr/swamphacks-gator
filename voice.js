var authorizationToken;
var SpeechSDK;
var subscriptionKeyBool;
var subscriptionKey;
var serviceRegion;



var preventTimeoutCall = false;
var TIMEOUT = 2000;
var currentSpeech = '';
var lat;
var long;
function success(pos) {
  console.log("got loc");
  lat = pos.coords.latitude;
  long = pos.coords.longitude;
  console.log("latitude: " +lat);
  console.log("longitude: "+long);
}
function error(err) {
  console.warn('ERROR(' + err.code + '): ' + err.message);
}
let options = {
};
var loc = navigator.geolocation.watchPosition(success, error, options);
async function RequestAuthorizationToken () {
  var authorizationEndpoint = true;
  if (authorizationEndpoint) {
    var myHeaders = new Headers();
    myHeaders.append('Accept', 'application/json');
    myHeaders.append('Ocp-Apim-Subscription-Key', 'd3807d190141428285cd1d5e55595e55');

    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      redirect: 'follow'
    };
    var token;

    var result = await fetch('https://eastus.api.cognitive.microsoft.com/sts/v1.0/issuetoken', requestOptions)
      .then(response => response.text())
      .catch(error => console.log('error', error));
    var token = await JSON.parse(atob(result.split('.')[1]));
    serviceRegion = token.region;
    authorizationToken = result;
    subscriptionKeyBool = true;
    //subscriptionKey = '';
    console.log('Got an authorization token: ' + authorizationToken);
  }
}

document.addEventListener('DOMContentLoaded', async function () {
  document.addEventListener("click", async function(){
    console.log("click");

  if (window.SpeechSDK) {
    SpeechSDK = window.SpeechSDK;
    if (typeof RequestAuthorizationToken === 'function') {
      await RequestAuthorizationToken();
      console.log("loaded sdk");
    }
      else {
    console.log("oof")
  }
  }
  //textBox = document.getElementById('textBox');
  //textBox.innerHTML = '';
  // if we got an authorization token, use the token. Otherwise use the provided subscription key
    var speechConfig;
    if (authorizationToken) {
      console.log('speech configured');
      speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(authorizationToken, serviceRegion);
    } else {
      if (window.SpeechSDK) {
       SpeechSDK = window.SpeechSDK;

       // in case we have a function for getting an authorization token, call it.
       if (typeof RequestAuthorizationToken === 'function') {
         await RequestAuthorizationToken();
       }
     }
      if (subscriptionKey === '' || subscriptionKey === 'subscription'||!subscriptionKey) {
        return;
      }
      console.log(subscriptionKey);
      speechConfig = SpeechSDK.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
    }
    speechConfig.speechRecognitionLanguage = 'en-US';
    var audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
    phraseList = SpeechSDK.PhraseListGrammar.fromRecognizer(recognizer);

    recognizer.startContinuousRecognitionAsync();
    var timer;
    recognizer.recognizing = (s, e) => {
      console.log(`RECOGNIZING: Text=${e.result.text}`);
      if (e.result.text.length + 3 > currentSpeech.length) {
        currentSpeech = e.result.text;

        preventTimeoutCall = false;
        timer = setTimeout(function () {
          console.log('After setting timer: ' + preventTimeoutCall);
        }, TIMEOUT);
      } else {
        if (currentSpeech.includes("leave note")) {
          console.log("final speech to send: " + currentSpeech.split("leave note")[1])
          var myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");

      var raw = JSON.stringify({"latitude":lat,"longitude":long,"message":currentSpeech.split("leave note")[1]});

      var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow'
      };

fetch("https://f3bd2dd3a5b9.ngrok.io/insert", requestOptions)
  .then(response => response.text())
  .then(result => location.reload())
  .catch(error => console.log('error', error));
          //location.reload();
        }
        else if (currentSpeech.includes("leave no")) {
          console.log("final speech to send: " + currentSpeech.split("leave no")[1])
                 var myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");

      var raw = JSON.stringify({"latitude":lat,"longitude":long,"message":currentSpeech.split("leave no")[1]});

      var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow'
      };

fetch("https://f3bd2dd3a5b9.ngrok.io/insert", requestOptions)
  .then(response => response.text())
  .then(result => location.reload())
  .catch(error => console.log('error', error));
          //location.reload();

        }
        else {
        preventTimeoutCall = true;
        console.log('Last Speech: ' + currentSpeech);
        }
        currentSpeech = e.result.text;
      }
    };
    recognizer.sessionStarted = (s, e) => {
      console.log('session started');
    };
    recognizer.speechStartDetected = (s, e) => {
      console.log('phrase logged');
    };

    recognizer.recognized = (s, e) => {
      if (e.result.reason === ResultReason.RecognizedSpeech) {
        console.log(`RECOGNIZED: Text=${e.result.text}`);
      } else if (e.result.reason === ResultReason.NoMatch) {
        console.log('NOMATCH: Speech could not be recognized.');
      }
    };

    recognizer.canceled = (s, e) => {
      console.log(`CANCELED: Reason=${e.reason}`);

      if (e.reason === CancellationReason.Error) {
        console.log(`"CANCELED: ErrorCode=${e.errorCode}`);
        console.log(`"CANCELED: ErrorDetails=${e.errorDetails}`);
        console.log('CANCELED: Did you update the subscription info?');
      }

      recognizer.stopContinuousRecognitionAsync();
    };

    recognizer.sessionStopped = (s, e) => {
      console.log('\n    Session stopped event.');
      recognizer.stopContinuousRecognitionAsync();
    };
    });
  })
