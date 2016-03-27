
var tabId = parseInt(window.location.search.substring(1));
var filters = { urls: ["<all_urls>"], tabId: tabId };

function addListeners() {
	chrome.webRequest.onBeforeRequest.addListener(handleEvent, filters, ['requestBody']);
	chrome.webRequest.onSendHeaders.addListener(handleEvent, filters, ['requestHeaders']);
	chrome.webRequest.onBeforeRedirect.addListener(handleEvent, filters, ['responseHeaders']);
	chrome.webRequest.onCompleted.addListener(handleEvent, filters, ['responseHeaders']);
	chrome.webRequest.onErrorOccurred.addListener(handleEvent, filters);
}

function removeListeners() {
	chrome.webRequest.onBeforeRequest.removeListener(handleEvent);
	chrome.webRequest.onSendHeaders.removeListener(handleEvent);
	chrome.webRequest.onBeforeRedirect.removeListener(handleEvent);
	chrome.webRequest.onCompleted.removeListener(handleEvent);
	chrome.webRequest.onErrorOccurred.removeListener(handleEvent);
}

//	------------------------------------	------------------------------------	------------------------------------	

function handleEvent(details) {
	// $("#tabs-all").append("<!-- DEBUG: " + JSON.stringify(details) + "--> \n");
	var resp_CF_div = $('div.address[id="respCF-' + details.requestId + '"]');
	if (resp_CF_div.length === 0) {
		resp_CF_div = $('<div>').addClass("address").attr("id", "respCF-" + details.requestId);
		$("#tabs-cf").append(resp_CF_div);
		$('<div>').addClass("url").text(details.url).appendTo(resp_CF_div);
	}

	var addressDiv = $('div.address[id="req-' + details.requestId + '"]');
	if (addressDiv.length === 0) {
		addressDiv = $('<div>').addClass("address").attr("id", "req-" + details.requestId);
		$("#tabs-all").append(addressDiv);
		$('<div>').addClass("url").text(details.url).appendTo(addressDiv);
	}


	if (details.requestHeaders) {
		$('<div>').addClass("request").text('\n' + details.method + ' ' + details.url).appendTo(addressDiv);
		addressDiv.children().last().append(formatHeaders(details.requestHeaders));
	} else if (details.redirectUrl) {
		$('<div>').addClass("redirect").text('\n' + details.statusLine + "\n Redirect to: " + details.redirectUrl).appendTo(addressDiv);
		addressDiv.children().last().append(formatHeaders(details.responseHeaders));
	} else if (details.responseHeaders) {
		// $('<div>').addClass("response").text('\n' + details.statusLine).appendTo(addressDiv);
		$('<div>').addClass("response").text('\n').appendTo(resp_CF_div);
		resp_CF_div.children().last().append(show_cf_info(details.responseHeaders));

		$('<div>').addClass("response").text('\n').appendTo(addressDiv);
		addressDiv.children().last().append(formatHeaders(details.responseHeaders));
	}

	if (details.requestBody) {
		addressDiv.children().last().append(formatPost(details.requestBody.formData));
	}
}

function formatPost(postData) {
	var text = "";
	for (var name in postData) {
		text += name + ": " + postData[name] + "\n";
	}
	var div = $('<div>').addClass("post").text(text);
	return div;
}

//	------------------------------------	------------------------------------	------------------------------------	

function formatHeaders(headers) {
	var text = "";
	for (var i in headers) {
		text += headers[i].name + ": " + headers[i].value + "\n";
	}
	var div = $('<div>').addClass("headers").text(text);
	return div;
}

//	------------------------------------	------------------------------------	------------------------------------	

function show_cf_info(headers) {
	var text = "";
	var ch_obj = {};
	for (var i in headers) {
		ch_obj[headers[i].name] = headers[i].value;
	}

	for (var i in headers) 
		if ([
				'Pragma',
				'Last-Modified',
				'Cache-Control',
				'Expires',
				'CF-Cache-Status',
				'Server',
				'CF-RAY',
				'Cf-Bgj',
				'Content-Length',
				'Access-Control-Allow-Origin',
		    ].indexOf(headers[i].name) >= 0)
		{
			var add_info = "";
			switch (headers[i].name) {
				case 'Expires':
					time_diff = new Date(headers[i].value).getTime() - new Date(ch_obj['Date']).getTime();
					diff_s = parseInt(time_diff/1000)
					diff_h = parseInt(diff_s/3600)
					diff_d = parseInt(diff_h/24)
					diff_w = parseInt(diff_d/7)
					diff_m = parseInt(diff_d/30)
					diff_y = parseInt(diff_m/12)
					if (diff_y>=1) add_info = "expires in " + diff_y + " year"
					else if (diff_m>=1) add_info = "expires in " + diff_m + " month"
					else if (diff_w>=1) add_info = "expires in " + diff_w + " week"
					else if (diff_d>=1) add_info = "expires in " + diff_d + " day"
					else if (diff_h>=1) add_info = "expires in " + diff_h + " hour"
					else if (diff_s>=1) add_info = "expires in " + diff_s + " second"
					else if (time_diff<0) add_info = "Expired"
					// add_info = time_diff>0 ? parseInt((time_diff)/(3600*1000)) : "Expired";
					break;

				case 'Content-Length':
					sz_b = headers[i].value
					sz_k = parseInt(sz_b/1024)
					sz_m = parseInt(sz_k/1024)
					if (sz_m>=1) add_info = "size " + sz_m + " Mb"
					else if (sz_k>=1) add_info = "size " + sz_k + " kb"
					else add_info = "size " + sz_b + " b"
					break;

				case 'CF-Cache-Status':
					switch (headers[i].value) {
						case 'HIT': 
							add_info = "resource in cache, served from CDN cache";
							break;

						case 'MISS': 
							add_info = "resource not in cache, served from origin server";
							break;

						case 'EXPIRED': 
							add_info = "resource was in cache but has since expired, served from origin server";
							break;

						case 'STALE': 
							add_info = "resource is in cache but is expired, served from CDN cache because another visitor's request has caused the CDN to fetch the resource from the origin server. This is a very uncommon occurrence and will only impact visitors that want the page right when it expires.";
							break;

						case 'IGNORED': 
							add_info = "resource is cacheable but not in cache because it hasn't met the threshold (number of requests, usually 3), served from origin server. Will become a HIT once it passes the threshold.";
							break;

						case 'REVALIDATED': 
							add_info = "REVALIDATED means we had a stale representation of the object in our cache, but we revalidated it by checking using an If-Modified-Since header.";
							break;
					}
					break;
			}
			text += headers[i].name + ": " + headers[i].value + 
					(add_info ? new Array(40 - headers[i].name.length - headers[i].value.length).join(' ') + "--  <b>" + add_info + "</b>" : "") + "\n";
		}
	var div = $('<div>').addClass("headers").html(text);
	return div;
}

//	------------------------------------	------------------------------------	------------------------------------	

function clearContent() {
	$('#tabs-cf').empty();
	$('#tabs-all').empty();
}

function closeWindow() {
	window.close();
}

function pauseCapture() {
	removeListeners();
	var resumeButton = $('<button>').attr('id', 'resume').text("Resume").button();
	$('button#pause').replaceWith(resumeButton);
	$('button#resume').click(resumeCapture);
}

function resumeCapture() {
	addListeners();
	var pauseButton = $('<button>').attr('id', 'pause').text("Pause").button();
	$('button#resume').replaceWith(pauseButton);
	$('button#pause').click(pauseCapture);
}

//	------------------------------------	------------------------------------	------------------------------------	

$(function() {
	addListeners();
	$('button#clear').click(clearContent);
	$('button#close').click(closeWindow);
	$('button#pause').click(pauseCapture);

	$('button').button();
	$("#tabs").tabs();
});
