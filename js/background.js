chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.windows.create({url: "cf_cache_mon.html?" + tab.id, type: "popup", width: 800, height: 600});
});