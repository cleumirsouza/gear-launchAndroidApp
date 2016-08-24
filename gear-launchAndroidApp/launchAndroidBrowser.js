
// open browser
var type = "phone";
var url = "https://www.google.com";
var appid = "com.samsung.w-manager-service";
var extra_data = [
          new tizen.ApplicationControlData("type", [type]),
          new tizen.ApplicationControlData("deeplink", [url])];
var appControl = new tizen.ApplicationControl(
           "http://tizen.org/appcontrol/operation/default",
           null,
           null,
           null,
           extra_data);
try {
    tizen.application.launchAppControl(
             appControl,
             appid,
             function() { console.log("intentBorba", "launchUrl success"); },
             function(err) { console.log("intentBorba", "launchUrl failed: " + err.message); });
}catch(err) {
    console.error("[launcher] " + err);
}