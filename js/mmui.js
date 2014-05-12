// BUG: If connection drops user is logged out and CPU usage skyrockets

// S1E: Group functions into distinct modules and partition into seperate files
// S1E: Use proper templating to unclutter view logic
// S1E: Break functions down-to subroutines to turn them into composed methods
// S1E: (De)Couple appropriately to create models, views and controllers

mmUI = new Object();

mmUI.uiver = 'v2011-10-28 20:09';
mmUI.expiretime = 90;
mmUI.debug = 0;
mmUI.apiurl = null;
//mmUI.apiurl = 'http://localhost';
mmUI.geo = null;
mmUI.clat = null;
mmUI.clon = null;

mmUI.lastUpdateCheck = null;
mmUI.lastGeoUpdate = null;

mmUI.infowindow = null;
mmUI.map;
mmUI.geocoder;
mmUI.currentpositionmarker;
mmUI.locations = null;
mmUI.homelatlng = null;

mmUI.currentmarker = null;
mmUI.mapLoadingRequested = null;
mmUI.mapDefinePoint = null;

mmUI.loaded = {};
mmUI.startedRequests = {};
mmUI.messages = {};
mmUI.requestCache = {};

mmUI.img_translator = {};
mmUI.img_translator['Last.Fm'] = 'as';
mmUI.img_translator['Delicious'] = 'delicius';
mmUI.img_translator['Google Calendar'] = 'calendar';
mmUI.img_translator['Google Mail'] = 'mail';
mmUI.img_translator['Twitter'] = 'twitter';
mmUI.img_translator['Facebook'] = 'facebook';

mmUI.editor = null;

/*
mmUI.access_token = '0B535081575ADF13F0057C7EB49E52F6';
mmUI.account = 'sparklehorse%40middlemachine.com';
mmUI.username = 'sparlky horse';
*/
/*
action={update,save}
type={aim,interest,}
*/
/* entry parameters
text
priority
*/

// app loading view
mmUI.updateCurrentRequestInfo = function() {
	var cont = 'Loading ';
	var found = false;
	var currdate=new Date().getTime();
	var timeout = 50000;
	var currentReqs = {};
	var operations = {'loading':null, 'saving':null};
	for(var time in mmUI.startedRequests) {
		if (mmUI.startedRequests[time]==null) continue;
		if (mmUI.startedRequests[time]==time) continue;
		var spl = mmUI.startedRequests[time].split(':');
		//alert(spl[0]+' '+spl[1]);
		operations[spl[0]] = true;
		if (currdate > time+timeout) {
			//handle timeout?
			mmUI.startedRequests[time] = null;
		}
		currentReqs[time] = time;
		//if (found) cont += ', ';
		found = true;
		//cont += mmUI.startedRequests[time];
	}
	mmUI.startedRequests = currentReqs;
	cont += ' <img src="images/wait.gif">';
	if (!found) cont = '';
	for(var i in operations) {
		if (mmUI.debug>0) console.log(i+' '+operations[i]);
		if (operations[i]!=null) {
			//$('#'+i+'msg').show();
			//if ($('#'+i+'msg').is(':hidden')) $('#'+i+'msg').show('highlight');
		} else {
			//if ($('#'+i+'msg').is(':visible')) $('#'+i+'msg').hide('blind');
			//$('#'+i+'msg').hide();
		}
	}
	
	var html = '';
	if (!empty(mmUI.messages['filtered'])) html += mmUI.messages['filtered'];
	if (!empty(mmUI.messages['ground'])) html += mmUI.messages['ground'];
	if (!empty(cont)) html += (empty(html)?'':'<br> ') + cont;
	if (!empty(html)) {
		$('#filteredby').html(html).fadeIn('fast');
	} else {
		$('#filteredby').html('');
	}
	
	//$('#currentrequests').html(cont);
	//setTimeout(150, 'updateCurrentRequestInfo()');
}

// app request
function JSONPCall(context, params, func, errfunc, descriptive) {
	if (empty(mmUI.apiurl)) return mmUI.logout();//if a server is not defined, you just cant make a call.
	//alert(mmUI.apiurl);
	var reqdate=new Date().getTime();
	if (descriptive==null) descriptive = reqdate;
	
	mmUI._setCookie('lastcookieupdate',reqdate,90);
	
	mmUI.startedRequests[reqdate] = descriptive;
	mmUI.updateCurrentRequestInfo();	
	if (params.length>0 && params[0] != '&') params = '&'+params;
	//	$.getJSON(mmUI.apiurl+'/BTW/'+context+'/'+mmUI.account+'?access_token='+mmUI.access_token+'&'+params+'&json_callback=?', function(dataall) {
	$.jsonp({timeout: 25000,"url": mmUI.apiurl+'/BTW/'+context+'/'+mmUI.account+'?access_token='+mmUI.access_token+params+'&json_callback=?', "success": function(dataall) {
		if (mmUI.checkError(dataall)) {
			/*
			updateCurrentRequestInfo();
			if (context!='api/logout') {
				mmUI.setupUI();
				return mmUI.logout();
			}
			*/
			if (errfunc!=null) errfunc(dataall);
			return;
		}
		var respdate=new Date().getTime();
		mmUI.startedRequests[reqdate] = null;
		if (func!=null) func(dataall);
		mmUI.updateCurrentRequestInfo();	
	}, "error": function(d,msg) {
		mmUI.startedRequests[reqdate] = null;
		//alert("Error "+d+", "+msg);//TODO ZACASNO
		mmUI.updateCurrentRequestInfo();	
		if (context!='api/logout') {
			mmUI.setupUI();
			return mmUI.logout();
		}
	}
	});
}

// entries dnd helper
function disableDnD() {
	$('section#entries-01,section#entries-02,section#entries-03').sortable('disable');
	dragin = true;
}

// entries dnd helper
function enableDnD() {
	$('section#entries-01,section#entries-02,section#entries-03').sortable('enable');
	dragin = false;
}

// user helper
mmUI.isUserLoggedIn = function() {
	if (empty(mmUI.access_token)||empty(mmUI.apiurl)) return false;
	return true;
}

// S1E: invoked from jsonp callbacks as default error handler
// app routing
mmUI.checkError = function(msg) {
	if (!empty(msg.error)) {
		if (msg.error_code==200) {
			mmUI.logout();
			//mmUI.setupUI();
			return true;
		}
		//alert('error!');//TODO handle errors gracefully - dont upset the user:)
		return true;
	}	
	if (mmUI.debug>0) console.log('checkerror fail');
	return false;
}

// app ui init
mmUI.initializeUI = function() {
	mmUI.loaded = {};
	mmUI.startedRequests = {};
	mmUI.messages = {};
	mmUI.requestCache = {};
}

// app view
mmUI.initializeDOM = function() {
	$('#entries-01').html('');
	$('#entries-02').html('');
	$('#entries-03').html('');
	$('#aim_part').html('');	
	$('#contacts_part').html('');	
	$('#new-entry').val('');
	$('#loginmsg').html('');
}

// app cache manifest
mmUI.checkForUpdate = function() {
	var cstamp = new Date().getTime();
	if (mmUI.lastUpdateCheck!=null && ((cstamp - mmUI.lastUpdateCheck) < 30000)) return;
	mmUI.lastUpdateCheck = cstamp;
	//TODO check
	$.get('version/', function(data) {
		if (!empty(data) && mmUI.uiver != data) {
			//return;
			//alert(location.href); 
			//$('#justsubmit').submit();
			if (location.href.search('reload')!=-1) alert('Please reload page to receive new version');
			//location.href = '.?'+Math.random();
		}
	});
}

// entries update request helper
mmUI.updateEntryValue = function(id, key, value, func) {
	JSONPCall('entry','&update=entry&eid='+id+'&'+key+'='+encodeURIComponent(value), function(dataall) {
		if (!empty(func)) func(dataall);
	},null,'saving:updating entry value');
 }

// entries delete request, callback
mmUI.deleteEntry = function(id) {
	JSONPCall('entry','&action=delete&eid='+id, function(dataall) {
		mmUI.updateEntries();
	},null,'saving:deleting entry');
 }

// pad get request, view callback, event bindings
mmUI.updatePad = function() {
	mmUI.editor = ace.edit("padeditor");
		
	JSONPCall('pad','', function(dataall) {
		mmUI.editor.getSession().setValue(dataall.pad);
		mmUI.editor.setShowPrintMargin(false);
		mmUI.editor.getSession().setUseSoftTabs(false);
		mmUI.editor.gotoPageUp();
		mmUI.editor.focus();
	},null,'loading:pad');
	
	$('#padeditor').keydown(function(e) {
		var cursor = mmUI.editor.getSelection().getCursor(); 
		var lineStart = mmUI.editor.getSession().getLine(cursor.row);
		var tabs = lineStart.split('\t').length - 1;

		if (e.keyCode === 13 && tabs > 0) { // if ENTER was pressed and if line begins with tab
			e.preventDefault();
			mmUI.editor.insert('\n');
			for (i=0; i<tabs; i++)
				mmUI.editor.indent();
		}
	});

	$('#padeditor').focusout(function() {
		mmUI.editor.gotoPageUp();
		mmUI.editor.focus();
	});

	
	/*TO DO ZA CUSTOM!!!
	 * napravit indent
	 * 		na način da se provjeri dal je prethodno kliknut tab
	 * postavit na prvu liniju na početku
	 * zabranit rastezanje
	 * line select
	 */
	
	// ZA CUSTOM PAD!!!
	/*
	JSONPCall('pad','', function(dataall) {
		$('#pad').val(dataall.pad);
		$('#pad').autoGrow();
		$('#pad').selectRange(0, 0);
	},null,'loading:pad');
	
	 * $('#pad').keydown(function(e) {		
		 if (e.keyCode === 9) { // if TAB was pressed
				e.preventDefault();
				// get caret position/selection
				var start = $(this)[0].selectionStart;
				var end = $(this)[0].selectionEnd;

				// set textarea value to: text before caret + tab + text after caret
				$(this).val($(this).val().substring(0, start)
						+ "\t"
						+ $(this).val().substring(end));
				
				// put caret at right position again
				$(this)[0].selectionStart = $(this)[0].selectionEnd = start + 1;

				// prevent the focus lose
				return false;
		} else if (e.keyCode === 13) { // if ENTER was pressed
			var start = $(this)[0].selectionStart;
				var end = $(this)[0].selectionEnd;
				
				
		}
	});
	
	$.fn.selectRange = function(start, end) {
			return this.each(function() {
					if (this.setSelectionRange) {
							this.focus();
							this.setSelectionRange(start, end);
					} else if (this.createTextRange) {
							var range = this.createTextRange();
							range.collapse(true);
							range.moveEnd('character', end);
							range.moveStart('character', start);
							range.select();
					}
			});
	};  */
	
	 /* AUTOGROW TEXTAREA PLUGIN */
	/*$.fn.autoGrow = function() {
		return this.each(function() {
			// Variables
			var colsDefault = this.cols;
			var rowsDefault = this.rows;
			
			//Functions
			var grow = function() {
				growByRef(this);
			}
			
			var growByRef = function(obj) {
				var linesCount = 0;
				var lines = obj.value.split('\n'); */
				
				/*for (var i=lines.length-1; i>=0; --i)
				{
					linesCount += Math.floor((lines[i].length / colsDefault) + 1);
				} */
				/*linesCount = lines.length;

				if (linesCount >= rowsDefault)
					obj.rows = linesCount + 1;
				else
					obj.rows = rowsDefault;
			}
			
			var characterWidth = function (obj) {
				var characterWidth = 0;
				var temp1 = 0;
				var temp2 = 0;
				var tempCols = obj.cols;
				
				obj.cols = 1;
				temp1 = obj.offsetWidth;
				obj.cols = 2;
				temp2 = obj.offsetWidth;
				characterWidth = temp2 - temp1;
				obj.cols = tempCols;
				
				return characterWidth;
			}
			
			// Manipulations
			this.style.width = "100%";
			this.style.height = "auto";
			this.style.overflow = "hidden";
			//this.style.width = ((characterWidth(this) * this.cols) + 6) + "px";
			this.onkeyup = grow;
			this.onfocus = grow;
			this.onblur = grow;
			growByRef(this);
		});
	}; */
 }

// S1E: Calls updatePad which causes unnecessary reload
// pad update request
mmUI.savePad = function() {    
	var padtext = mmUI.editor.getSession().getValue();
	//$.getJSON(this.apiurl+'/BTW/pad/'+this.account+'?access_token='+this.access_token+'&save=contentofpad&json_callback=?, function(dataall) {
	JSONPCall('pad', '&save='+padtext, function(dataall) {
		mmUI.updatePad();
	},null,'saving:pad');
		
	/*
	 * ##dr:ta koda zgoraj še ne dela - ne save-a podatke
	 * ##dr:ex-code
	var padtext = $('#pad').val();
	//$.getJSON(this.apiurl+'/BTW/pad/'+this.account+'?access_token='+this.access_token+'&save=contentofpad&json_callback=?, function(dataall) {
		JSONPCall('pad', '&save='+padtext, function(dataall) {
			mmUI.updatePad();
		},null,'saving:pad');*/
 }

/*  ACCOUNT SETTINGS */
mmUI.getAccountSettings = function() {	
	//$.getJSON(this.apiurl+'/BTW/settings/'+this.account+'?access_token='+this.access_token+'&json_callback=?, function(dataall) {
	JSONPCall('settings', '', function(dataall) {
		if (empty(dataall)) return;
		
		var clat = dataall.lat;
		var clng = dataall.lng;
		
		$('#fullname').val(empty(dataall.fullname) ? '' : dataall.fullname);
		$('#primaryemail').val(empty(dataall.email) ? '' : dataall.email);
		$('#country').val(empty(dataall.country) ? '' : dataall.country);
		$('#timezone').val(empty(dataall.timezone) ? '' : dataall.timezone);
		$('#homelocation').val(empty(dataall.homeloc) ? '' : dataall.homeloc);
		//$('input:radio[name="dateformat"][value="'+(empty(dataall.dateformat) ? 'default' : dataall.dateformat)+'"]').attr("checked", true);
		//$('input:radio[name="timeformat"][value="'+(empty(dataall.timeformat) ? 'default' : dataall.timeformat)+'"]').attr("checked", true);
		$('#account-settings input[name=intersubjectivity][value='+(empty(dataall.intersubjectivity) ? 'public' : dataall.intersubjectivity)+']').attr('checked', true);
		$('#account-settings input[name="skiprsvp"]').attr('checked', dataall.skiprsvp);
		
		//TODO...
		//password change button event
		//delete acc button event	
			
		if (dataall.lat && dataall.lng) {
			mmUI.homelatlng = ({lat:dataall.lat, lng:dataall.lng});
		} else {
			// default position @Ljubljana
			mmUI.homelatlng = ({lat:46.05143, lng:14.50597});
		}
		
		if (typeof google === 'undefined') {
			var script = document.createElement("script");
			script.type = "text/javascript";
			script.src = "http://maps.google.com/maps/api/js?sensor=true&callback=mmUI.setLocationMap";
			document.body.appendChild(script);
		} else {
			mmUI.setLocationMap();		
		}
		
		$('#homelocation').focusout(function(e) {
			var geocoder = new google.maps.Geocoder();
			
			if ($('#country').val() != "") {
				var address = $('#homelocation').val() + ', ' + $('#country').val();
				geocoder.geocode({ 'address': address}, function(results, status) {
						if (status == google.maps.GeocoderStatus.OK)
						{
							mmUI.homelatlng = ({lat:results[0].geometry.location.lat(), lng:results[0].geometry.location.lng() })
							mmUI.setLocationMap();
						}
				});
			} else {
				//alert('add country');
			}
		});
		
		/* save settings */
		$('#account-settings #save-settings-btn').click(function(e) {
			e.preventDefault();
			var settings = ({
				fullname: $('#fullname').val(), 
				email: $('#primaryemail').val(), 
				country: $('#country').val(), 
				timezone: $('#timezone').val(),
				//timeformat
				//dateformat
				homeloc: $('#homelocation').val(), 
				lat: mmUI.homelatlng.lat, 
				lng: mmUI.homelatlng.lng,
				intersubjectivity: $('#account-settings input[name=intersubjectivity]:checked').val(),
				skiprsvp: $('#account-settings input[name=skiprsvp]').is(':checked') });
			mmUI.saveAccountSettings(settings);
			//kle poklicat lat lng
		});

		/* change password */
		$('#account-settings #save-password-btn').click(function(e) {
			e.preventDefault();
			var currentpass = $('#account-settings #currentpass').val();
			var newpass = $('#account-settings #newpass').val();
			var retypenewpass = $('#account-settings #retypenewpass').val();
			if (currentpass != "") {
				if (newpass == retypenewpass)
					mmUI.changePassword(currentpass, newpass);
			}
		});

		/* delete account */
		$('#account-settings #settings-delete-btn').click(function(e) {
			e.preventDefault();
			if (confirm("Are you sure you want to deactivate your account?"))
				mmUI.deleteAccount();
		});
	},null,'loading:settings');
 }

// geo map init
mmUI.setLocationMap = function() {
	var latlng;

	if (mmUI.homelatlng) {
		latlng = new google.maps.LatLng(mmUI.homelatlng.lat, mmUI.homelatlng.lng);
	} else if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(position) {
			latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
		});	
	}
	
	var myOptions = {
		zoom: 7,
		center: latlng,
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		navigationControl: true,
		disableDefaultUI: true
	};	

	var locationmap = new google.maps.Map(document.getElementById("homelocationmap"), myOptions);
	
	var marker = new google.maps.Marker({position:latlng, map:locationmap});
	locationmap.setZoom(15);
}

// user update request
mmUI.saveAccountSettings = function(settings) {
	var settingsdata = 
		'&set=true'+
		'&fullname='+settings['fullname']+
		'&email='+settings['email']+
		'&country='+settings['country']+
		'&timezone='+settings['timezone']+
		'&homeloc='+settings['homeloc']+
		//timeformat
		//dateformat
		'&lat='+settings['lat']+
		'&lng='+settings['lng']+
		'&intersubjectivity='+settings['intersubjectivity']+
		'&skiprsvp='+settings['skiprsvp'];

	/*$.getJSON(this.apiurl+'/BTW/settings/'+this.account+'?access_token='+this.access_token+'&fullname&primaryemail&country&timezone&homelocation&lat&lng&
	json_callback=?, function(dataall) { */
	JSONPCall('settings', settingsdata, function(dataall) {
		if (mmUI.checkError(dataall)) return;
	},null,'loading:save settings');
	//alert(settingsdata);
 }

// user update request
mmUI.changePassword = function(currentpass, newpass) {						
	//$.getJSON(this.apiurl+'/BTW/password/'+this.account+'?access_token='+this.access_token+'&currentpass='+currentpass+'&newpass='+newpass+'&json_callback=?, function(dataall) {
	JSONPCall('settings', '&changepass=true&currentpass='+currentpass+'&newpass='+newpass, function(dataall) {
		if (mmUI.checkError(dataall)) return;
	},null,'loading:saving password');
 }

// user destroy request
mmUI.deleteAccount = function() {
	//$.getJSON(this.apiurl+'/BTW/deleteaccount/'+this.account+'?access_token='+this.access_token+'&json_callback=?, function(dataall) {
	//JSONPCall('deleteaccount', '', function(dataall) {
		//if (mmUI.checkError(dataall)) return;
	//},null,'deleting account');
 }

/*  REMINDER SETTINGS */
mmUI.getRemindersSettings = function() {}

/* SERVICES SETTINGS */
mmUI.getServicesSettings = function() {}

/* ENTITIES SETTINGS */
mmUI.getEntitiesSettings = function() {}

/* SHARING SETTINGS */
mmUI.getSharingSettings = function() {}

/* IMPORT DATA SETTINGS */
mmUI.getImportSettings = function() {
	//test data
	dataall = [ {"type":"delicious", "connected":true}, 
		{"type":"facebook","connected":false}, 
		{"type":"google", "connected":false}, 
		{"type":"lastfm", "connected":false} ];
	
	//$.getJSON(this.apiurl+'/BTW/importsettings/'+this.account+'?access_token='+this.access_token+'&json_callback=?, function(dataall) {
	//JSONPCall('importsettings', '', function(dataall) {
	if (empty(dataall)) return;

	for (i in dataall) {
		var importstatus = '';
		
		if (dataall[i].connected) {
			importstatus = '<a onclick="javascript: mmUI.setImportSettings(\''+ dataall[i].type +'\', false); return false;" class="disconnect_btn">Disconnect</a>';
			importstatus +='<div class="working-sync"><p>Data sync working</p><img src="images/bgr/ok-simbol.png" alt="ok" /></div>';
		} else {
			importstatus = '<a onclick="javascript: $(\'.import-data-content\'\).hide(); $(\'#import-data-'+ dataall[i].type +'\').show(); return false;" class="connect_btn">Enable connection</a>';
		}
		
		$('#import-'+ dataall[i].type +' .import-status').html(importstatus);
	}
	//},null,'loading:import data');
 }

mmUI.setImportSettings = function(type, connect) {
	if (connect) {
		var username = $('#import-data-'+ type +' #username');
		var password = $('#import-data-'+ type +' #password');	
		var inputs = $('#import-data-'+ type +' .tick-form input');
		var options = '';
		
		$('#import-data-'+ type +' .tick-form input[type=checkbox]').each(function() {		
			options += '&'+ $(this).attr('value') +'='+ $(this).attr('checked');
		});

		mmUI.getImportSettings();
		
		//$.getJSON(this.apiurl+'/BTW/importsettings/'+this.account+'?access_token='+this.access_token+'&json_callback=?, function(dataall) {
		//JSONPCall('importsettings', '&type='+type+'&connect='+connect+options, function(dataall) {
			//if (mmUI.checkError(dataall)) return;
			/*var dataall = [ {"type":"delicious", "connected":false}, 
				{"type":"facebook","connected":true}, 
				{"type":"google", "connected":true}, 
				{"type":"lastfm", "connected":false} ];*/
		//},null,'loading:connecting synchronization');
	} else {
		mmUI.getImportSettings();

		//$.getJSON(this.apiurl+'/BTW/importsettings/'+this.account+'?access_token='+this.access_token+'&json_callback=?, function(dataall) {
		//JSONPCall('importsettings', '&type='+type+'&connect='+connect, function(dataall) {
			//if (mmUI.checkError(dataall)) return;
			/*var dataall = [ {"type":"delicious", "connected":false}, 
				{"type":"facebook","connected":false}, 
				{"type":"google", "connected":false}, 
				{"type":"lastfm", "connected":false} ];*/
		//},null,'loading:disconnecting synchronization');
	}
 }

// persistence helper
mmUI.setUIObject = function(key, value) {
	mmUI._setCookie(key, JSON.stringify(value), mmUI.expiretime);
}

// persistence helper
mmUI.getUIObject = function(key) {
	var v = mmUI._getCookie(key);
	if (empty(v)) return v;
	return JSON.parse(v);
}

// persistence helper
mmUI.saveUIParameter = function(key, value) {
	mmUI._setCookie(key, value, mmUI.expiretime);
}

// persistence helper
mmUI.toggleUIParameter = function(key) {
	if (mmUI._getCookie(key)!='1') mmUI._setCookie(key, '1', mmUI.expiretime);
	else mmUI._setCookie(key, '0', mmUI.expiretime);
	return mmUI._getCookie(key);
}

// persistence helper
mmUI.getUIParameter = function(key) {
	return mmUI._getCookie(key);
}

// entry tags view
mmUI._getEntryTagsHTML = function(entry) {
	if (empty(entry.aims)) return '';
	var ret = '';
	for(aim in entry.aims) {
		ret += '<li>'+entry.aims[aim]+' <a href="javascript: mmUI.updateRelationEntryAim('+entry.id+', \''+entry.aims[aim]+'\', true);" title="Remove">Remove</a></li>';
	}
	return ret;
}

// entry shared view
mmUI._getEntrySharedHTML = function(entry) {
	if (empty(entry.share)) return '';
	var ret = '';
	for(share in entry.share) {
		var shar = empty(entry.share[share].name) ? entry.share[share].email : entry.share[share].name;
		var sharetype = "share_icon_add";
		if (entry.share[share].type == "DELEGATED") {
			sharetype = "share_icon_move_right";
		}
		//alert(shar);
		//TODO send id not email for deletion
		ret += '<li><div class="'+sharetype+'"><a name="'+entry.share[share].id+'" title="'+entry.share[share].email+'"></a></div>'+shar+'<a href="javascript: mmUI.updateRelationEntryShared('+entry.id+', \''+entry.share[share].email+'\', true);" title="Remove">Remove</a></li>';
	}
	return ret;
}

// entry location view
mmUI._getEntryLocationHTML = function(entry) {
	var ret = [];
	var i = 0;
	if (!empty(entry.at) && !empty(entry.at.lat)	) {
		ret[i++] = ('<div id="wom-'+entry.id+'">                    <div class="extralink"><a href="#locations/?location='+entry.at.id+'&backtoentry='+entry.id+'">view on map</a></div>	                 '); 
		//ret[i++] = ('                    <div class="extralink"><a onclick="mmUI.deleteGeoLocation('+entry.at.id+')">delete</a></div> '); 
		//ret[i++] = ('                    <div class="extralink"><a onclick="mmUI.updateEntryValue('+entry.id+', \'at\', \'\');">remove</a></div> '); 
		ret[i++] = ('                    <a href="#locations/?lat='+entry.at.lat+'&lon='+entry.at.lon+'&location='+entry.at.id+'"><img id="staticmap-'+entry.id+'"align="right" src="http://maps.google.com/maps/api/staticmap?center='+entry.at.lat+','+entry.at.lon+'&markers=color:blue|label:'+encodeURIComponent(entry.at.name)+'|'+entry.at.lat+','+entry.at.lon+'&zoom=14&size=320x160&sensor=false"></a></div>'); 
	} else {
		if (empty(entry.at) || empty(entry.at.id)) {
			ret[i++] = ('<div id="wom-'+entry.id+'">                     <div class="extralink" id="entrylocation-'+entry.id+'"><a onclick="$(\'#at-'+entry.id+'\').click();">Click to define location</a></div>'); 
		} else {
			ret[i++] = ('<div id="wom-'+entry.id+'">                     <div class="extralink" id="entrylocation-'+entry.id+'"><a href="#locations/?define='+entry.at.id+'&backtoentry='+entry.id+'">Define location on map</a></div>'); 
			//ret[i++] = ('                    <div class="extralink"><a href="" class="editableparam">or click here to pick on map</a></div> '); 
		}
		ret[i++] = ('                    <img id="staticmap-'+entry.id+'"align="right" src="http://chart.apis.google.com/chart?chst=d_map_pin_letter_withshadow&chld=%3f|43AAFD"></div>'); 
		//http://chart.apis.google.com/chart?chst=d_map_pin_letter_withshadow&chld=A|B88A00|002EB8		
	}
	return ret.join('');
}

// entry view
mmUI._htmlEntry = function(entry) {
	//craft the entry
}

// S1E: Function body wrapped in object
// entry tags view
mmUI._editableTagsClose = function(id) {
	var fail = true

	//	function(event,ui)
	{
		var val = $('#'+id).val();
		var art = $('#'+id).parents('article');
		var eid = $('#'+id).parents('article')[0].id;
		var t = $('#'+id);
		//alert(val);
		if (!empty(val)) {
			mmUI.updateRelationEntryAim(eid,val,false, function(entry) {
				var aims = mmUI._getEntryTagsHTML(entry);
				$('#assigned_tags_'+eid).html(aims);
				t.parent().children('input').hide();
				t.parent().children('a').show();
				//event.preventDefault();
			});
			//event.preventDefault();
			//mmUI.addFuzz();
			//$(this).remove();

			//$(this).show()
		}
		var addbutt = $('#'+id).prev();
		$(addbutt).next().remove();
		$(addbutt).show()
		/*
		var t = $(this);
		t.parent().children('input').hide();
		t.parent().children('a').show();
		*/		
		//event.preventDefault();
		//$(this).html();
		fail = false
	}
	if (fail) {
		console.log("WARNING: mmUI._editableTagsClose does not execute")
	}
}

// S1E:	Composed method, extract logic to subroutines
// entry extended view
mmUI._initializeExtendedItem = function(entryid) {
	$(".editableinput").focus(function(event,ui) {
		$(this).after(' <p style="padding:2px;"><span onclick="" class="editableapply">APPLY</span> <span onclick="" class="editablecancel">CANCEL</span></p>');
			event.preventDefault();
			//$(this).html();
	});

	$('.justnotes').moreLess({
		//speed:'slow',
		truncateIndex:300,
		//callback: function() {alert('done');}
	});

	$(".editabletags").click(function(event,ui) {
		//$(this).attr('value','');
		event.preventDefault();
		$(this).hide();
		// S1E:	Ensure proper unique id
		var id = Math.round(Math.random()*100000);
		$(this).after('<input id="'+id+'" type="text" class="editableinput" style="margin:0; padding:0">');
		//$(this).after('<input id="'+id+'" type="text" class="editableinput"><p style="padding:2px;"><span onclick="" class="editableapply">APPLY</span> <span onclick="" class="editablecancel">CANCEL</span></p>');
			//$(this).html();
		$('#'+id).autocomplete({
			minLength: 0,
			delay: 0,
			source: mmUI.allTags['#']
		});
		$('#'+id).focus();

		// S1E:	Extract event handler to named function
		$('#'+id).bind("keydown", function(event) {
			//alert('tuki');
			//return;
			/*		
			if (self.options.disabled) {
				return;
			}
			*/
			var keyCode = $.ui.keyCode;
			switch(event.keyCode) {
			case keyCode.TAB:
			case keyCode.ENTER:
			case keyCode.NUMPAD_ENTER:
				var val = $(this).val();
				var eid = $(this).parents('article')[0].id;
				var t = $(this);
				//alert(val);
				if (!empty(val)) {
					mmUI.updateRelationEntryAim(eid,val,false, function(entry) {
						var aims = mmUI._getEntryTagsHTML(entry);
						//if mmUI.lastAimRequest
						{
							mmUI.updateAims();
						}
						$('#assigned_tags_'+eid).html(aims);
						t.parent().children('input').hide();
						t.parent().children('a').show();
						event.preventDefault();
					});
					event.preventDefault();
					//mmUI.addFuzz();
					//$(this).remove();
					
					//$(this).show()
				}
				
				//$('awesome-bar').submit();
				// when menu is open or has focus
				/*
				if (self.menu.element.is(":visible")) {
				
				}
				*/
				//passthrough - ENTER and TAB both select the current element
				break;
			}
		})
		
		$('#'+id).blur(function() {
			//mmUI._editableTagsClose(id)
			settimeout('mmui._editabletagsclose('+id+')',150)// for autocomplete jao:)
		});
	});
	
	$(".editablelocation").editable({
		onSubmit: function(value,settings) {
			if (value.current == value.previous) return value;
			/*					
			if ($.trim(value.current) == '') {
				return false;
				value.current = value.previous;
				return value;
			}
			*/					
			var key = $(this)[0].id;
			var t = $(this);
			var eid = $(this).parents('article')[0].id;
			var t = $(this);
			//var 
			mmUI.updateEntryValue(eid, 'at', escapeForHTML(value.current), function(entry) {
				//$(this).next().remove();
				$('#locationhtml-'+entry.id).html(mmUI._getEntryLocationHTML(entry));
			});
			//event.preventDefault();
			return value;
		},
		editClass : 'editable',
									
		submit: 'APPLY',
		cancel: 'CANCEL',
		type     : "location"
		//type     : "textarea",
		//style  : "inherit"
	});	
	
			
	/*
	$(".editablelocation").click(function(event,ui) {
		//$(this).attr('value','');
		event.preventDefault();
		$(this).hide();
		var id = Math.round(Math.random()*100000);
		$(this).after('<input id="'+id+'" type="text" value="'+$(this).html()+'" class="editableinput">');
		//$(this).after('<input id="'+id+'" type="text" class="editableinput"><p style="padding:2px;"><span onclick="" class="editableapply">APPLY</span> <span onclick="" class="editablecancel">CANCEL</span></p>');
		//$(this).html();
		$('#'+id).autocomplete({
			source: mmUI.allTags['@']
		});
		$('#'+id).focus();
		$('#'+id).bind("keydown", function(event) {
				//alert('tuki');
				//return;
				var keyCode = $.ui.keyCode;
				switch(event.keyCode) {
				case keyCode.TAB:
				case keyCode.ENTER:
				case keyCode.NUMPAD_ENTER:
					$(this).blur();
					return;
					//passthrough - ENTER and TAB both select the current element
					break;
				}
		}).blur(function(event,ui) {
			var val = $(this).val();
			var eid = $(this).parents('article')[0].id;
			var t = $(this);
			//t.css('backgroud-color','#ff0000');
			t.parent().children('input').hide();
			//alert(val);
			if (!empty(val)) {
				mmUI.updateEntryValue(eid, 'at', val, function(entry) {
					//$(this).next().remove();
					$('#locationhtml-'+entry.id).html(mmUI._getEntryLocationHTML(entry));
					
				});
				//event.preventDefault();
			}
				
			//$(this).html();
		});;
	});
	*/

	$(".editableshared").click(function(event,ui) {
		//$(this).attr('value','');
		event.preventDefault();
		$(this).hide();
		var id = Math.round(Math.random()*1000000);
		$(this).after('<input id="'+id+'" type="text" class="editableinput">');
		//$(this).after('<input id="'+id+'" type="text" class="editableinputadd"><p style="padding:2px;"><span onclick="" class="editableapply">APPLY</span> <span onclick="" class="editablecancel">CANCEL</span></p>');
		//$(this).html();					
		$('#'+id).autocomplete({
			minLength: 0,
			delay: 0,
			source: mmUI.allTags['contacts']
		});
		$(this).data('widget',id);
		$('#'+id).focus();
		$('#'+id).bind("keydown", function(event) {
				//alert('tuki');
				//return;
				var keyCode = $.ui.keyCode;
				switch(event.keyCode) {
					case keyCode.TAB:
					case keyCode.ENTER:
					case keyCode.NUMPAD_ENTER:
						$(this).blur();
						return;
						//passthrough - ENTER and TAB both select the current element
						break;
				}
		}).blur(function(event,ui) {
			var val = $(this).val();
			var eid = $(this).parents('article')[0].id;
			var t = $(this);
			//alert(val);
			if (!empty(val)) {
				mmUI.updateRelationEntryShared(eid,val,false, function(entry) {
					var sh = mmUI._getEntrySharedHTML(entry);
					$('#assigned_shared_'+eid).html(sh);
					t.parent().children('input').hide();
					t.parent().children('a').show();
				});
				event.preventDefault();
				//mmUI.addFuzz();
				//$(this).remove();
				//$(this).show()
			}
			
			$(this).next().remove();
			$(this).show()
			var t = $(this);
			t.parent().children('input').hide();
			t.parent().children('a').show();
			event.preventDefault();
			//$(this).html();
		});			
	});

	$(".editableinputadd").focus(function(event,ui) {
		$(this).attr('value','');
		$(this).html('');
		$(this).after('<p style="padding:2px;"><span onclick="" class="editableapply">APPLY</span> <span onclick="" class="editablecancel">CANCEL</span></p>');
		event.preventDefault();
		//$(this).html();
	});

	$(".editableinputadd").blur(function(event,ui) {
		$(this).nextAll().remove();
		event.preventDefault();
		//$(this).html();
	});

	$(".editablesharing").editable({
		onEdit: function(content) {
			content.current = '';
			event.preventDefault();
			//$(this).html();
		},
		onSubmit: function(content) {
			var el = $(this).parents('article');
			var key = $(this)[0].name;
			//var 
			//var val = mmUI.updateEntryValue(el[0].id, key,value.current);
			return val;
		},
		submit: 'APPLY',
		cancel: 'CANCEL',
		editClass : 'editable',				
		type     : "text"
		//type   : "textarea",
		//style  : "inherit"
	});			
				
	$(".editableparam").editable({
		onEdit: function($this,options) {
			//t.find("dd[class='editableparam']").editable('disable');
			t.toNonEditable($this,true);
			return false;
		},		
		onSubmit: function(value,settings) {
			if (value.current == value.previous) return value;
			var el = $(this).parents('article');
			var key = $(this)[0].id;
			var t = $(this);
			//var 
			mmUI.updateEntryValue(el[0].id, key,value.current, function(data) {
				var value = (empty(data['pretty'+key]) ? data[key] : data['pretty'+key]);
				t.html(value);
			});
			
			return value;
		},
		editClass : 'editable',		
		//submit: 'APPLY',
		//cancel: 'CANCEL',
		type     : "text"
		//type     : "textarea",
		//style  : "inherit"
	});			

	$(".editablenotes").editable({
		onSubmit: function(value,settings) {
			if (value.current == value.previous) return value;
			var el = $(this).parents('article');
			var key = $(this)[0].id;
			var t = $(this);
			//var 
			mmUI.updateEntryValue(el[0].id, key,value.current, function(data) {
				var value = (empty(data['pretty'+key]) ? data[key] : data['pretty'+key]);
				t.html(value);
			});
			
			return value;
		},
		editClass : 'editable',
									
		submit: 'APPLY',
		cancel: 'CANCEL',
		//type   : "text",
		type     : "textarea"
		//style  : "inherit"
	});			
	
	$(".editablemouse").editable(function(value,settings)
		{ 
			//alert(value);
			//alert(this.id);
			return value;
		},
		{
			indicator : "<img src='images/wait.gif'>",
			//tooltip   : "Doubleclick to edit...",
			event     : "mouseover",
			style  : "inherit"
		}
	);			
	
	$(".editabledrop").editable(function(value,settings)
		{ 
			//alert(value);
			//alert(this.id);			
			return value;
		},
		{
			indicator : "<img src='images/wait.gif'>",
			//tooltip   : "Doubleclick to edit...",
			event     : "mouseover",
			type	: "select",
			style  : "inherit"
		}
	);
}

// entry extened view
mmUI._constructExtendedItem = function(entry) {
	var entrydata = new Array();
	entrydata["work"] = new Array();
	entrydata["plan"] = new Array();

	var show = [];
	show['map'] = true;
	show['date'] = true;
	var skip = [];

	var sections = ['aims', 'dates', 'location', 'sharing', 'notes'];
	var sourceurl = null;
	var entrysource = '';
	
	if (!empty(entry.source)) {
		entrysource = entry.source.name;
		sourceurl = new String(entry.source.iconimg).toLowerCase();
		if (!empty(mmUI.img_translator[entry.source.name])) sourceurl = mmUI.img_translator[entry.source.name];
		
		if (entry.source.name == 'Delicious') {
			var sections = ['notes', 'aims', 'sharing'];
		} else if (entry.source.name == 'Facebook') {
			var sections = ['notes', 'location', 'aims', 'dates', 'sharing'];
		}
	}

	var cur = 'work';
	//entrydata[cur].push('					<a href="#entry-'+entry.id+'" title="'+escapeForHTML(entry.text)+'" class="editabletitle" id="text" name="text">'+escapeForHTML(entry.text)+'</a>');;
	entrydata[cur].push('<div class="btn-editabletitle">');
	entrydata[cur].push('<ul>');
	entrydata[cur].push('<li><a onclick="mmUI.editEntryTitle('+entry.id+');">edit title</a></li>');
	entrydata[cur].push('<li>|</li>');
	entrydata[cur].push('<li><a onclick="mmUI.editEntryTitle('+entry.id+', \''+htmlentities(entry.fuzz)+'\');">edit fuzz</a></li>');
	entrydata[cur].push('<li>&nbsp;</li>');
	entrydata[cur].push('<li>&nbsp;</li>');
	entrydata[cur].push('<li>Created: <time datetime="2010-01-20T20:00+01:00" name="timecreated">'+entry.prettytimecreated+'</time> </li>');
	entrydata[cur].push('</ul>');
	entrydata[cur].push('</div>');
	
	for(var i in sections) {

		/*
		entrydata[cur].push('					<div class="notes"><p style="font-style:italic">Created: <time datetime="2010-01-20T20:00+01:00" name="timecreated">'+entry.prettytimecreated+'</time> '); 
		if (!empty(entrysource) && entrysource != 'Middlemachine' && entrysource != 'Google Calendar') entrydata[cur].push(' from <b>'+entrysource+'</b>');
		if (!empty(entry.source) && !empty(entry.source.text))  entrydata[cur].push(' &nbsp;<span style="background-color:'+entry.source.color+');">&nbsp;&nbsp;&nbsp; </span><b>&nbsp; ('+entry.source.text+')</b>');
		entrydata[cur].push('</p></div>'); 
		*/				
		
		if (sections[i] == 'aims') {
			entrydata[cur].push('					<section class="aims"> ');
			entrydata[cur].push('                    <div class="border"> ');
			entrydata[cur].push('						<h2 class="location_tag">Aims</h2> ');
			entrydata[cur].push('                     </div> ');
			//entrydata[cur].push('							<div id="extendeditem-tags" class="editabletags"> <ul id="assigned_tags_'+entry.id+'"> ');
			entrydata[cur].push('							<div id="extendeditem-tags"> <ul id="assigned_tags_'+entry.id+'"> ');
			entrydata[cur].push(mmUI._getEntryTagsHTML(entry));
			entrydata[cur].push('                        </ul></div>');
			entrydata[cur].push('					</section> ');
			entrydata[cur].push('                  <div class="extralink"><a href="" class="editabletags">add</a></div></div>');
			entrydata[cur].push('<div class="notes">');
			entrydata[cur].push('</div>');
		}
		if (sections[i] == 'dates') {
			entrydata[cur].push(' 					<dl class="schedule"> ');
			entrydata[cur].push('                        <div class="border"> '); 
			entrydata[cur].push('						<dt>Start</dt> '); 
			entrydata[cur].push('                        </div> '); 
			entrydata[cur].push('                    	<dd id="timeat" class="editableparam">'+emptyString(entry.prettytimeat)+'</time></dd>&nbsp; '); 
			entrydata[cur].push(' '); 
			entrydata[cur].push('                        <div class="border"> '); 
			entrydata[cur].push('						<dt>Duration</dt> '); 
			entrydata[cur].push('                        </div> '); 
			entrydata[cur].push('						<dd class="editableparam" id="timeq">'+emptyString(entry.timeq)+'</dd> '); 
			entrydata[cur].push(' '); 
			entrydata[cur].push('                    </dl> '); 
			if (entry.type!='event') {
				entrydata[cur].push('                    <dl class="schedule"> '); 
				entrydata[cur].push('                    <div class="border"> '); 
				entrydata[cur].push('						<dt>Deadline</dt> '); 
				entrydata[cur].push('                        </div> '); 
				entrydata[cur].push('						<dd class="editableparam" id="deadline">'+(entry.prettydeadline)+' &nbsp;</dd> ');
				entrydata[cur].push(' '); 
				entrydata[cur].push('                    <div class="border"> '); 
				entrydata[cur].push('                        <dt >Repeat</dt> '); 
				entrydata[cur].push('                        </div> '); 
				entrydata[cur].push('						<dd class="editableparam" id="repeat">'+entry.timecycle+' &nbsp;</dd> '); 
				entrydata[cur].push(' '); 
				entrydata[cur].push('                    </dl> '); 
			}
		}
		if (sections[i] == 'location') {
			entrydata[cur].push('                    <div class="border"> ');
			entrydata[cur].push('                    <h2 class="location">Location</h2>'); 
			entrydata[cur].push('                    </div>'); 
			entrydata[cur].push('                    <dl class="location_addres" id="location_address_'+entry.id+'"> '); 
			entrydata[cur].push('                    <dd> ');
			// TODO: wtf , kaj je ta datetime spodaj?
			entrydata[cur].push('                    <time datetime="2010-01-20T20:00+01:00"><a title="Show location" class="editablelocation" id="at-'+entry.id+'">'+((empty(entry.at)||empty(entry.at.name)) ? '' : escapeForHTML(entry.at.name))+'</a></time> '); 
			entrydata[cur].push('                    </dd> '); 
			entrydata[cur].push('                    </dl><span id="locationhtml-'+entry.id+'">'); 
			entrydata[cur].push(mmUI._getEntryLocationHTML(entry));
			entrydata[cur].push('</span> '); 
		}
		if (sections[i] == 'sharing') {
			entrydata[cur].push('                 <section class="aims"> ');
			entrydata[cur].push('                    <div class="border"> ');
			entrydata[cur].push('						<h2 class="location_share">Sharing</h2> ');
			entrydata[cur].push('                        </div> ');
			entrydata[cur].push('						<ul id="assigned_shared_'+entry.id+'"> ');
			entrydata[cur].push(mmUI._getEntrySharedHTML(entry));
			/*
			entrydata[cur].push('							<li><div class="share_icon_add"><a href="/"></a></div>Some Name <a href="/" title="Remove">Remove</a></li> ');
			entrydata[cur].push('							<li><div class="share_icon_move_right"><a href="/"></a></div>Someones Sirname <a href="/" title="Remove">Remove</a></li> ');
			entrydata[cur].push('							<li><div class="share_icon_move_left"><a href="/"></a></div>Name Name <a href="/" title="Remove">Remove</a></li> ');
			*/
			entrydata[cur].push('						</ul>');
			entrydata[cur].push('					</section> ');
			entrydata[cur].push('                    <div class="extralink"><a href="" class="editableshared">add</a></div> ');
		}
		if (sections[i] == 'notes') {
			entrydata[cur].push('					<section class="notes"> ');
			if (entrysource != 'Facebook') {
				entrydata[cur].push('                    <div class="border"> ');
				entrydata[cur].push('						<h2 class="lasth2">Notes</h2> ');
				entrydata[cur].push('                        </div> ');
			}
			//entrydata[cur].push('						<h3>Notes</h3>');
			if (entrysource == 'Facebook') entrydata[cur].push('						<div class="facebook-note">');//ffs description ~= note
			else entrydata[cur].push('						<div class="standout-notes">');//ffs description ~= note
			if (!empty(entry.image)) {
				var imgsrc = '					<img src="'+entry.image+'" align="left" style="margin-right:10px; border: 2px solid black;">';
				if (!empty(entry.url)) {
					var enurl = (entry.url.substr(0,4)=='http' ? entry.url : 'http://'+entry.url);
					imgsrc = '<a href="'+enurl+'" target="_blank">'+imgsrc+'</a>';
				}
				entrydata[cur].push(imgsrc);
			}
			if (entrysource == 'Facebook') entrydata[cur].push('						<p class="justnotes" id="description">');//ffs description ~= note
			else entrydata[cur].push('						<p class="editablenotes" id="description">');//ffs description ~= note
			if (!empty(entry.note)) {
				entrydata[cur].push(nl2br(entry.note, false));
				//entrydata[cur].push(nl2br(htmlentities(entry.note)));
			} else entrydata[cur].push('&nbsp;');
			entrydata[cur].push('</p>');
			entrydata[cur].push('</div>');
			entrydata[cur].push('					</section>');
		}
	}
	
	entrydata[cur].push('					<section class="notes">');
	entrydata[cur].push('						<a onclick="javascript:$(\'#really-'+entry.id+'\').toggle(\'fast\')">Remove entry</a>');
	entrydata[cur].push('						<div id="really-'+entry.id+'" style="display:none;padding-top:8px;"><a onclick="javascript:mmUI.deleteEntry('+entry.id+');">Really?</a></div>');
	entrydata[cur].push('					</section>');
	return entrydata[cur];
}

// entry subhead view
mmUI.generateSubHeadText = function(entry) {
	var undertextSeparator = '&nbsp;';
	var undertext = "";
	
	//1: time at
	undertext +=
		empty(entry.prettytimeat) ? '' : undertextSeparator + '<b>' + entry.prettytimeat + '</b>';
		
	//2: location
	undertext +=
		empty(entry.at.name) ? '' : undertextSeparator + ' @' + entry.at.name + '';
	
	//3: time cycle
	undertext +=
		empty(entry.timecycle) ? '' : undertextSeparator + ' ~every ' + entry.timecycle;
	
	//4: url
	if (!empty(entry.url)) {
		var _url = entry.url;
		if (_url.length>60) _url = _url.substring(0,60) + '....';
		undertext += undertextSeparator + ' <a onclick="openLink(\''+escapeForJS(entry.url)+'\');" title="'+entry.url+'">'+_url+'</a>';
	}
	
	/* DON'T SHOW FOR NOW
	//5: time duration
	undertext +=
		empty(entry.timeq) ? '' : undertextSeparator + entry.timeq;
	*/
		
	//6: sharing
	if (!empty(entry.share)) {
		undertext += undertextSeparator;
		$.each(entry.share, function() {
			var sharetype = " +";
			if (this.type == "DELEGATED") {
				sharetype = " >"
			}
			undertext += empty(this.name) ? sharetype + this.email : sharetype + this.name;
		});
	}
	
	//-------------------------------------------------------------------//
	if (undertext.substring(0, undertextSeparator.length) === undertextSeparator) {
		undertext = undertext.substring(undertextSeparator.length, undertext.length);
	}
	
	/*
	if (undertext.indexOf("NaN") != -1) {
		// BREAKPOINT
	}
	*/
	
	//-------------------------------------------------------------------//
	return undertext;
}

// S1E: 500 LOC
// entries view, templates, toggle extended view & drag sort events, update requests
mmUI._constructEntries = function(dataall) {
	var aimfilter = mmUI._getCookie('filterbyaims');
	var contactfilter = mmUI._getCookie('filterbycontacts');
	var contactfilternames = mmUI._getCookie('filterbycontacts_names');
	var nearlocfilter = mmUI._getCookie('filterbynearlocs');
	var nearlocfilternames = mmUI._getCookie('filterbynearlocs_names');
	var fuzz = mmUI._getCookie('searchentries');
	
	var thingstoplan = 0;
	var thingstowork = 0;
	var thingstonow = 0;
	
	var types = {};
	types[0] = 'passed';//verify
	types[1] = 'verify';//RSVP
	types[2] = 'soon';
	types[3] = 'soon';
	types[4] = 'now';
	types[5] = 'soon';
	types[6] = 'later';
	types[7] = 'passed';//done
	types[8] = 'passed';//passed
	types[9] = 'bla';//passed
	types[666] = 'none';
	
	var passed_hentry = '';
	var verify_hentry = '';
	var datatosort = dataall.entries.items;
	//var entryid = 1;
	var data = new Array();
	var tempar = {};
		
	
	var maxfg = 0;
	for(i in datatosort) {
		if (tempar[datatosort[i].fg]==undefined) tempar[datatosort[i].fg] = new Array();
		if (datatosort[i].fg!=undefined  && (datatosort[i].fg>maxfg)) maxfg = datatosort[i].fg;
		//if (empty(datatosort[i].fg)) break;
		tempar[datatosort[i].fg].push(datatosort[i]);
	}
	
	for(i=0; i<=maxfg; i++) {//do it manually to set the group order in the view
		if (empty(tempar[i])) continue;
		for(it in tempar[i]) {
			data.push(tempar[i][it]);
		}
	}
	
	var entrydata = new Array();
	entrydata["work"] = new Array();
	entrydata["plan"] = new Array();
	entrydata["now"] = new Array();
	
	var appdata = mmUI.getUIObject('appdata');
	
	for(i in data) {
		var entry = data[i];
		var cur = 'work';
		
		if (entry.fg >= 3) {
			thingstowork++;
		} else if (entry.fg>1) {
			thingstonow++
			cur = 'now';
		} else {
			thingstoplan++
			cur = 'plan';
		}
		
		//##
		//##
		//##
		var type = types[entry.fg];
		var eventtype = '';//event.type;
		//entryid = sprintf("%03d",entryidcount);
		var fgdebug = '';
		var timing = (entry.over ? 'over' : 'notover');
		if (empty(entry.timeat)) entry.timeat = (empty(entry.timeq)?'':entry.timeq);
		//if (empty(entry.timeq)) entry.timeq = entry.timeat; <------- ##david WHAT THE FUCK?!
		if (empty(entry.at)) entry.at = {};
		if (empty(entry.at.name)) entry.at.name = '';
		if (empty(entry.prettydeadline)) entry.prettydeadline = '';
		if (empty(entry.timecycle)) entry.timecycle = '';
		
		var entrysource = null;
		if (empty(entry.source)) {
		} else {
			if (empty(entry.source.name) || entry.source.name.toLowerCase()=='middlemachine') entry.source.iconimg = null;
			entrysource = entry.source.name;
		}
		//entry.source = {};
		
		var sourceurl = null;
		
		if (!empty(entry.source)) {
			sourceurl = new String(entry.source.iconimg).toLowerCase();
			if (!empty(mmUI.img_translator[entry.source.name])) sourceurl = mmUI.img_translator[entry.source.name];
		}
		
		//fgdebug = entry.fg;
		fgdebug = entry.fg+' '+entrysource+' '+(Math.round(entry.taskpriority*10)/10);
		fgdebug = escapeForHTML(entry.text);
		//fgdebug = entry.id;
		entrydata[cur].push('			<article class="'+type+' hentry noselect" id="'+entry.id+'">');
		//entrydata[cur].push('				<div id="statusvalue-'+entry.id+'" style="display:none;">'+entry.fg+'</div>');//yes i know ffs
		entrydata[cur].push('				<header>');
		if (!empty(sourceurl)) entrydata[cur].push('					<div class="subject_img_'+sourceurl+'" style="float:left"></div>');
		entrydata[cur].push('  <div>					<h1 class="entry-title" title="'+fgdebug+'" id="entry-'+entry.id+'">');
		//entrydata[cur].push('					<a href=""><div class="subject_img_'+sourceurl+'" title="'+fgdebug+'"></div></a>');
		//entrydata[cur].push('					<a name="#entry-'+entry.id+'"><input type="text" value="'+escapeForHTML(entry.text)+'" title="'+fgdebug+'" " class="editableinputtitle" id="text"></a></h1>');;
		//entrydata[cur].push('					<a name="#entry-'+entry.id+'">'+entry.id+' <input type="text" value="'+entry.text+' " class="editableinputtitle" id="text"></a></h1>');;
		//entrydata[cur].push('					<a href="#entry-'+entry.id+'" title="'+escapeForHTML(entry.text)+'" class="editabletitle" id="text" name="text">'+escapeForHTML(entry.text)+'</a></h1>');;
		entrydata[cur].push('					<a href="#entry-'+entry.id+'" title="'+escapeForHTML(entry.text)+'" id="text" name="text">'+escapeForHTML(entry.text)+'</a>');
		entrydata[cur].push('					</h1>');
		
		//## UNDERTEXT
		entrydata[cur].push('<p id="undertext" class="sub_head_text">');			
		entrydata[cur].push(mmUI.generateSubHeadText(entry));
		entrydata[cur].push('</p>');
		
		entrydata[cur].push('					</div>');
		entrydata[cur].push('				</header>');
		var entrystatus = appdata[entry.wfid];
		for (var currentstatus in entrystatus) {
			if (currentstatus == 'null' || currentstatus == 'Undefined') {
				currentstatuslabel = entry.status.substr(0,1)+entry.status.substr(1).toLowerCase();
			} else currentstatuslabel = currentstatus;
			entrydata[cur].push('				<section>');
			entrydata[cur].push('					<a href="#verify-'+entry.id+'" class="status" title="Change"><em title="'+(currentstatuslabel)+'">'+(currentstatuslabel)+'</em></a>');
			entrydata[cur].push('					<menu id="verify'+entry.id+'" class="respond">');
			
			for(cm in entrystatus[currentstatus]) {
				entrydata[cur].push('						<li'+(empty(entrystatus[currentstatus][cm]['st'])?'':' class="selected"')+'><a name="'+entrystatus[currentstatus][cm].name+'" id="'+entry.id+'">'+entrystatus[currentstatus][cm].name+'</a></li>');
			}
			//entrydata[cur].push('						<li class="selected"><a href="/">Maybe</a></li>');
			entrydata[cur].push('					</menu>');
			entrydata[cur].push('				</section>');
			break;//omg check for only one
		}
		
		/*
		entrydata[cur].push('				<footer> '); 
		//entrydata[cur].push('					<a title="Edit" id="timeat" name="timeat" style="font-size:12px">'+emptyString(entry.prettytimeat, 'N/A')+'</a>');
		entrydata[cur].push('					<time datetime="2010-01-20T20:00+01:00"><a title="Edit" id="timeat" name="timeat" style="font-size:12px">'+emptyString(entry.prettytimeat, 'N/A')+'</a></time>');
		//entrydata[cur].push('					<time datetime="2010-01-20T20:00+01:00"><a title="Edit" class="editableinputtitle" name="at" style="font-size:12px">'+(entry.timeat)+'</a></time>');
		entrydata[cur].push('					<section> '); 
		entrydata[cur].push('						<time class="published" datetime="2010-01-20T20:00+01:00" pubdate class="editableparam" id="published">15.07.2010</time>');
		entrydata[cur].push('						<a href="#author" class="include">Author</a> '); 
		entrydata[cur].push('					</section> '); 
		entrydata[cur].push('				</footer> ');
		*/
		
		entrydata[cur].push('				<menu class="move"> ');
		entrydata[cur].push('					<li><a href="/" title="Move up">Up</a></li> '); 
		entrydata[cur].push('					<li><a href="/" title="Move down">Down</a></li> '); 
		entrydata[cur].push('				</menu> '); 
		entrydata[cur].push('				<section id="extendeditem-'+entry.id+'" class="entry-content">');
		//entrydata[cur].push('				<span id="extendeditem-'+entry.id+'></span>'); 
		//entrydata[cur] = entrydata[cur].concat(mmUI._constructExtendedItem(entry));
		entrydata[cur].push('				</section> ');		
		entrydata[cur].push('			</article>');
	}	
	
	entrydata["plan"].unshift('		<header class="labeled">\
	<h3>Things to plan <span>('+thingstoplan+'/'+dataall.entries.meta.count_plan+')</span></h3>\
	</header>');

	entrydata["now"].unshift('		<header class="labeled">\
	<h3>Here and now <span>('+thingstonow+'/'+dataall.entries.meta.count_here+')</span></h3>\
	</header>');

	entrydata["work"].unshift('			<header class="labeled"> \
		<h3>Things to work on <span>('+thingstowork+'/'+ (dataall.entries.meta.count_work + dataall.entries.meta.others) + ')</span></h3>\
	</header>');
	
	if (thingstonow==0) {
		$('#entries-02').slideUp();
	}

	$('#entries-01').html(entrydata["plan"].join(''));
	$('#entries-02').html(entrydata["now"].join(''));
	$('#entries-03').html(entrydata["work"].join(''));

	if (thingstonow>0) {
		$('#entries-02').slideDown();
	}

	$("img").lazyload({
		placeholder : "images/grey.gif", 
		//event : "sporty"
		threshold : 20,
		effect : "fadeIn"
	});
	
	if (mmUI.getUIParameter('entry_limit') == true ) {
		if (dataall.entries.meta.count_current<dataall.entries.meta.count_all) {
			$('#show-entries').html('Not enough to do? <a href="javascript:mmUI.toggleLimit(\'entry\');">See your complete list.</a>');
		} else {
			$('#show-entries').html('');
		}
	} else {
		$('#show-entries').html('Too many entries? <a href="javascript:mmUI.toggleLimit(\'entry\');">Hide some</a>');
	}
	
	var dragin = false;
	var t = setTimeout('',1); // @michal --> what does the empty timeout do? 

	$("#entryitemcount").html('Showing '+dataall.entries.meta.count_current+' / '+dataall.entries.meta.count_all+' items.');
	
	var filterhtml = '';
	if (!empty(aimfilter)) {
		var s = new String(aimfilter);
		filterhtml = '#' + s.replace(/;/g,', #');
	}
	
	var contactfilterhtml = '';
	if (!empty(contactfilter) && !empty(contactfilternames)) {
		//contacts = contactfilternames.split(';');
		contacts = '+' + contactfilternames.replace(/;/g,', +')
		//TODO just preselect
		//contactfilterhtml = ' Filtered by <b>'+contacts+'</b> / <a onclick="mmUI._setCookie(\'filterbycontacts\',undefined); mmUI.updateEntries(); mmUI.updateContacts();">clear filters</a>';
		if (filterhtml!='') filterhtml+=', ';
		filterhtml += contacts;
	}
	
	if (!empty(nearlocfilter)) {
		//contacts = contactfilternames.split(';');
		locs = '@' + nearlocfilternames.replace(/;/g,', @')
		//TODO just preselect
		//contactfilterhtml = ' Filtered by <b>'+contacts+'</b> / <a onclick="mmUI._setCookie(\'filterbycontacts\',undefined); mmUI.updateEntries(); mmUI.updateContacts();">clear filters</a>';
		if (filterhtml!='') filterhtml+=', ';
		filterhtml += locs;
	}
	
	if (filterhtml!='') { filterhtml = 'Filtered by <b>'+filterhtml+'</b> / <a onclick="mmUI.clearSearchFilters();">clear filters</a>';}
	
	if (!empty(fuzz)) {
		filterhtml += ' Searching for <b>'+fuzz+'</b> / <a onclick="mmUI._setCookie(\'searchentries\',undefined); mmUI.updateEntries();">clear search</a>';
	}

	/*			
	if (!empty(contactfilter)) {
		contacts = contactfilter.split(';');
		for(var i in contacts) {
			//alert(contacts[i]);
			for(var it in mmUI.contacts) {
				if (mmUI.contacts[it].id == contacts[i]) {
					if (contactfilterhtml != '') contactfilterhtml += ', ';
					contactfilterhtml += mmUI.contacts[it].name;
				}
			}
		}
		contactfilterhtml = 'Filtered by <b>'+contactfilterhtml+'</b> / <a onclick="mmUI._setCookie(\'filterbycontacts\',undefined); mmUI.updateEntries(); mmUI.updateContacts();">clear filters</a>';
	}
	*/
				
	if (empty(filterhtml)) {
		mmUI.messages['filtered'] = '';
		//$('#filteredby').fadeOut('fast');
	} else {
		mmUI.messages['filtered'] = filterhtml;
		//$('#filteredby').html(filterhtml).fadeIn('fast');
	}

	mmUI.updateCurrentRequestInfo();

	// Toggle entries
	$('section.entries>article>header').click(function(e) {
		//$('section.entries>article>header>h1').mouseup(function(e) {
		//e.preventDefault();
		if (dragin == false) {
			var t = $(this).parents('article');
			var it = t.find("a[id='text']");
			var ffs = it.data('editable.options');
			//if (ffs.options == 'enable') return;
			//return;
			if (it.children('textarea').length>0)
			//if (it[0].innerHTML) 
			{
			//if (it[0].text == 'APPLYCANCEL') {
				return;
				//return;
			} 
			
			e.preventDefault();
			//var hr = t.attr('href').substring(1);
			var entryid = t.attr('id');
			var hr = 'entry-'+t.attr('id');
			var hr = 'extendeditem-'+t.attr('id');
			var subHeadText = $(this).find('#undertext');
			//if on bottom, scroll to it
			//alert(hr);
			$('section.entries>article menu+section:not(#'+hr+')').each(function() {
				$(this).hide().parents('article').removeClass('open');
				//.blur();
			});
			//$('.editableinputtitle').each(function() {$(this).blur();});
			
			var entry = mmUI.dataGetEntry(entryid);
			var opening = false;
			$('section#'+hr).parents('article').toggleClass('open').end().slideToggle(20, function() {
				//if (!$(this).hasClass('open')) disableDnD();
				//else enableDnD();
				//dragin = false;
				if (t.hasClass('open')) opening = true;
				if (opening) {
					//$('#'+hr).html('poopy');
					var html = mmUI._constructExtendedItem(entry)
					$('#'+hr).html(html.join(''));
					subHeadText.hide();
					/**
					 * initialize extended item
					/**/
					mmUI._initializeExtendedItem();
					
					//if (ffs.options == 'disable') it.editable('enable');
					//$(window).height()
					/** TODO Borked cause its absolute */
					/*							
					var scrtop = t.scrollTop();
					if (t.scrollTop()+400 < t[0].offsetTop)
					{
						//alert('scrolling');
						//$('section#'+hr).scroll();
						window.scrollTo(0,t[0].offsetTop-4);
					}
					*/							
				} else {
					/* ##drazen: just refresh undertext */
					subHeadText.show();
					subHeadText.html(mmUI.generateSubHeadText(entry));
					
					//if (it[0].innerHTML) 
					//if (it[0].text == 'APPLYCANCEL') {

					if (it.children('textarea').length>0)	{
						ffs.toNonEditable($this,true);						
						//return;
					} 
					
					/** TODO go through all editables in article and close them */
					//if (ffs.options == 'enable') it.editable('disable');
					//t.find("a[id='text']").editable('disable');
					//t.children('.editableinputtitle').editable('disable');
				}
			});
		}
	});

	// S1E: Stray timeout	
	var c = setTimeout('',1);

	/*			
	$('a.status').click(function(e) {
		e.preventDefault();
		var t = $(this);
		if ($('section.entries a.status').hasClass('locked') == false) t.addClass('locked');
		if (t.hasClass('locked') == true) {
			var m = t.next('menu.respond');
			if (!m.is(':visible')) {
				disableDnD();
				m.fadeIn(200).children('li.selected').removeClass('selected').addClass('mark');
				m.hover(function() {
					$(this).children('li.selected').removeClass('selected').addClass('mark');
				}, function() {
					$(this).children('li.mark').removeClass('mark').addClass('selected');
				}).click(function(e) {
					e.preventDefault();
					e.stopPropagation();
					m.fadeOut(20);
					enableDnD();
					t.removeClass('locked');
					/** tell server what happened * /
					var status = e.target.name;
					var id = e.target.id;
					$.getJSON(mmUI.apiurl+'/BTW/entry/'+mmUI.account+'?access_token='+mmUI.access_token+'&eid='+id+'&status='+status+'&json_callback=?', function(dataall) {
						mmUI.updateEntries();
					});
				});
			}
		}
	});
	*/
	
	// status menu and update request
	$('a.status').mousedown(function(e) {
		e.preventDefault();
		var t = $(this);
		//if (!$('section.entries a.status').hasClass('locked')) t.addClass('locked');
		//if (t.hasClass('locked')) {
			var m = t.next('menu.respond');
			if (!m.is(':visible')) {
				//##dr: close/refresh all opened menus
				$('body').click();
				disableDnD();
				m.fadeIn(200).children('li.selected').removeClass('selected').addClass('mark');
				m.hover(function() {
					m.children('li.selected').removeClass('selected').addClass('mark');
				}, function() {
					$(this).children('li.mark').removeClass('mark').addClass('selected');
				}).click(function(e) {e.preventDefault();});
				m.mousedown(function(e) {
					/** TOD-O dont just handle the mouseup, the user has to be able to 
							cancel by clicking somewhere else  -- body click handles closing this*/
					m.fadeOut(20);
					enableDnD();
					//t.removeClass('locked');
					/** tell server what happened */
					var status = e.target.name;
					var id = e.target.id;
					//$.getJSON(mmUI.apiurl+'/BTW/entry/'+mmUI.account+'?access_token='+mmUI.access_token+'&eid='+id+'&status='+status+'&json_callback=?', function(dataall) {
					JSONPCall('entry','&eid='+id+'&status='+status, function(dataall) {
						//TODO refresh only if entry status changed
						mmUI.updateEntries();
					},null,'saving:status change');
				});
			}
		//}
	}).click(function(e) {e.preventDefault();});

	// UI D & D
	$('section#entries-01,section#entries-02,section#entries-03').sortable({
		//handle:'menu',
		//axis: 'y',
		//grid: [50,1] ,
		//distance: 5,
		//tolerance: 'pointer',
		cursor: 'move',
		distance: 10,
		opacity: 0.4,
		//forceHelperSize: true,
		//revert: true,
		scroll: true,
		containment: 'document',
		connectWith:'section.entries',
		placeholder:'ui-ghost',
		items:'article',
		cancel: '.open',
		start: function(event, ui) {
			clearTimeout(t);
			dragin=true;
		},
		/*																
		beforeStop: function(event,ui) {
				$(this).sortable('cancel');
				var id = ui.item[0].id;
				//id = $(ui.item).id;
				var el = $('#statusvalue-'+id);
				var val = el.html();
				var next = $(ui.item).next('section.entries>article');
				var nextid = next.id;
				var cevap = ui.placeholder.parent();
				//var poopy = $(this).toArray();
				//var fgdropon = $('#statusvalue-'+nextid).html();
		},
		*/
					
		/*DnD solution */
		//1. ulovis "drag" event za entry div
		//2. shranis pozicijo / referenco na entry div
		//3. ulovis "hover" na right paneu
		//4. 
		//			- skrijes ghost
		//			- premaknes entry na orig. pozicijo
		//			- pobarvas entry
		sort: function(event, ui) {
			if (ui.item[0].offsetLeft > (0.9 * ui.item[0].clientWidth)) {
				ui.item[0].style.opacity = 0;
			} else {
				ui.item[0].style.opacity = 0.4;
			}
		},
		stop: function(event,ui) {   	  
			t=setTimeout(function() {
				dragin=false;
				clearTimeout(t);
			},200);
			var prev = $(ui.item).prev('section.entries>article');
			var next = $(ui.item).next('section.entries>article');
			if ((prev==null) && (next==null)) {
				/** redrag to empty sortable TODO */
				//find section and post to json
			}
			/** redrag entry */
			//$.getJSON(mmUI.apiurl+'/BTW/entry/'+mmUI.account+'?access_token='+mmUI.access_token+'&redrag=true&eid='+ui.item[0].id+'&id_above='+(prev.length>0 ? prev[0].id: '')+'&id_below='+(next.length>0 ? next[0].id: '')+'&json_callback=?', function(dataall) {
			JSONPCall('entry','&drag=&eid='+ui.item[0].id+'&id_above='+(prev.length>0 ? prev[0].id: '')+'&id_below='+(next.length>0 ? next[0].id: ''), function(dataall) {
				mmUI.updateEntries();
			},null,'saving:Entry redrag');	
		},
		change: function(event,ui) {
			var prev = $(ui.helper).prev('section.entries>article');
			var next = $(ui.helper).next('section.entries>article');
			/** DURING SORTING (change color*/
			var out='';
			out += 'prev: '+(empty(prev[0])?'':prev[0].id);
			out += 'next: '+(empty(next[0])?'':next[0].id);
			if (prev!=null) {
				//$(this).c
			}
			//$('#printf').html(out);
		},		
		update: function(event,ui) {
				var prev = $(ui.item).prev('section.entries>article');
				var next = $(ui.item).next('section.entries>article');
				/** DURING SORTING (change color*/
				var out='final: ';
				out += 'prev: '+(empty(prev[0])?'':prev[0].id);
				out += 'next: '+(empty(next[0])?'':next[0].id);
				if (prev!=null) {
					//$(this).c
				}
				//$('#printf').html(out);
			}
	});

	//$('section#entries-01,section#entries-02,section#entries-03').disableSelection();
	$('section.entries menu,section#aims label').disableSelection();

	/*
		// UI D & D
		$('section#entries-01,section#entries-02').sortable({handle:'menu',connectWith:'section.entries',placeholder:'ui-ghost'}).droppable({
		//$('section.entries>article').droppable({
		drop: function(event, ui) {
			//ui.draggable.clone();
			//alert(ui.draggable.context.id);menu
			
			alert(ui.draggable);
			alert(ui.draggable.context);
			//$(this).addClass('ui-state-highlight').html('Dropped!');
			
			return true;
		}
		});
	*/
	/*
		$(".editabletitle").editable({
			onSubmit: function(value,settings) {
				var el = $(this).parents('article');
				var key = $(this)[0].name;
				//var 
				var val = mmUI.updateEntryValue(el[0].id, key,value.current);
				
				return val;
			},
			submit: 'APPLY',
			cancel: 'CANCEL',
			editClass : 'editable',
										
			type     : "text",
			//type     : "textarea",
	// 				style  : "inherit"
		});			
	*/			
	/*
		$(".editableinputtitle").focus(function(event,ui) {
			$(this).data("previous", $(this).val());
			//$(this).after(' <p style="padding:2px;"><span onclick="" class="editableapply">APPLY</span> <span onclick="" class="editablecancel">CANCEL</span></p>');
			event.preventDefault();
				//$(this).html();
		});
		$(".editableinputtitle").blur(function(event,ui) {
			$(this).nextAll().remove();
			event.preventDefault();
			if ($(this).val()!=$(this).data("previous")) {
				var el = $(this).parents('article');
				var key = $(this)[0].id;
				var val = $(this).val();
				//var 
				mmUI.updateEntryValue(el[0].id, key,val);
			}
		});
	*/
 }

// entries request
mmUI.updateEntries = function (entryid, notused, fuzz) {
	var aimfilter = mmUI._getCookie('filterbyaims');
	var includeaims = (empty(aimfilter) ? '':'&_EfA='+aimfilter);
	
	var contactfilter = mmUI._getCookie('filterbycontacts');
	var contactfilternames = mmUI._getCookie('filterbycontacts_names');
	var includecontacts = (empty(contactfilter) ? '':'&_EfC='+contactfilter);
	var nearlocfilter = mmUI._getCookie('filterbynearlocs');
	var nearlocfilternames = mmUI._getCookie('filterbynearlocs_names');
	var includenearlocs = (empty(nearlocfilter) ? '':'&_EfP='+nearlocfilter);
	
	var filter = includeaims+includecontacts+includenearlocs;
	//if (filter!='') filter+='&filter=true';
	//mmUI._setCookie('filterbyaims',include);
	var limitreq = (mmUI.getUIParameter('entry_limit') == true ? '' : '&_El=off');
	var calltype = 'entries';
	var fuzztext = '';
	var fuzz = mmUI._getCookie('searchentries');
	if (!empty(fuzz)) {
		//calltype = 'search';
		fuzztext = '&_Es='+encodeURIComponent(fuzz);
	}
	// 	$.getJSON(mmUI.apiurl+'/BTW/'+calltype+'/'+mmUI.account+'?access_token='+mmUI.access_token+fuzztext+filter+limitreq+'&json_callback=?', function(dataall) {
	JSONPCall(calltype, fuzztext+filter+limitreq, function(dataall) {
			mmUI.requestCache['entries'] = {};
			for(var ei in dataall.entries.items) {
					mmUI.requestCache['entries'][dataall.entries.items[ei].id] = dataall.entries.items[ei];
			}
			mmUI._constructEntries(dataall);
	//		alert(dataall.entries.meta.count);
		},null,'loading:entries'
	);
 }

// entry persistence
mmUI.dataGetEntry = function(id) {
	if (empty(mmUI.requestCache['entries'])) return null;
	if (empty(mmUI.requestCache['entries'][id])) return null;
	var entry = mmUI.requestCache['entries'][id];
	return entry;
}

// entry persistence
mmUI.dataUpdateEntry = function(entry) {
	mmUI.requestCache['entries'][entry.id] = entry;
}

// entry aim update request, view callback
mmUI.updateRelationEntryAim = function(eid, aid, removerelation, func) {
	var deletereq = (removerelation!=true ? '&aim=add' : '&aim=delete')
	//$.getJSON(this.apiurl+'/BTW/entry/'+this.account+'?access_token='+this.access_token+'&eid='+eid+'&aid='+encodeURIComponent(aid)+deletereq+'&json_callback=?', function(dataall) {
	JSONPCall('entry','&eid='+eid+'&aid='+encodeURIComponent(aid)+deletereq, function(dataall) {
		if (empty(dataall.id)) return;
		mmUI.dataUpdateEntry(dataall);
		if (!empty(func)) {
			func(dataall);
		} else {
			var sh = mmUI._getEntryTagsHTML(dataall);
			$('#assigned_tags_'+dataall.id).html(sh);
		}
	},null,'saving:entry -> aim relation');	
}

// entry shared update request, view callback
mmUI.updateRelationEntryShared = function(eid, value, removerelation, func) {
	var reqtype = (removerelation==true ? '&share=delete' : '&share=add');
	//	$.getJSON(this.apiurl+'/BTW/entry/'+this.account+'?access_token='+this.access_token+reqtype+'&eid='+eid+'&email='+value+'&json_callback=?', function(dataall) {
	JSONPCall('entry',reqtype+'&eid='+eid+'&email='+value, function(dataall) {
		if (empty(dataall.id)) return;
		mmUI.dataUpdateEntry(dataall);
		if (!empty(func)) {
			func(dataall);
		} else {
			var sh = mmUI._getEntrySharedHTML(dataall);
			$('#assigned_shared_'+dataall.id).html(sh);
		}
		//mmUI.updateEntries();
	},null,'saving:entry -> contact relation');	
 }

// S1E: huge inline callback, should be extracted as named function
mmUI.updateAims = function() {
	var limitreq = (mmUI.getUIParameter('aim_limit') == true ? '&limit=7' : '');
	var aimPriorities = new Array();
	var staticaims = {
		/*		'to-do':0.6, */
		'quick tasks':0.6, 
		'to read':-0.3, 
		'events':0.1, 
		'meetings':1, 
		'lectures':0.6, 
		'shopping':0,
		'sunny':1
		//'last.fm':1, 
	};
	var pinned = '';
	for(var staticaim in staticaims) {
		pinned += staticaim+';';
	}	
	var aimfilter = mmUI._getCookie('filterbyaims');
	var includeaims = (!empty(aimfilter) ? aimfilter.split(';') : null);
	
	//$.getJSON(this.apiurl+'/BTW/aims/'+this.account+'?access_token='+this.access_token+limitreq+'&pinned='+encodeURIComponent(pinned)+'&json_callback=?', function(dataall) {
	JSONPCall('aims',limitreq+'&pinned='+encodeURIComponent(pinned), function(dataall) {
		//alert(dataall[0]);
		//var data = dataall['aims'];
		var aimid = 1;
		
		var datarest = [];
		var data = [];

		for(i in dataall['aims']) {
			if (staticaims[dataall['aims'][i].id]!=undefined) {
				staticaims[dataall['aims'][i].id] = dataall['aims'][i];
			} else {
				datarest.push(dataall['aims'][i]);
			}
		}

		for(var staticaim in staticaims) {
			if (typeof(staticaims[staticaim])!='object') {
				var label = (staticaim.substr(0,1).toUpperCase())+staticaim.substr(1);
				var construc = {'id':staticaim,'name':label,'count':0, 'priority':staticaims[staticaim]};
				data.push(construc);
			} else {
				staticaims[staticaim].name = (staticaim.substr(0,1).toUpperCase())+staticaim.substr(1);
				data.push(staticaims[staticaim]);
			}
		}
		data = data.concat(datarest);
		//mmUI.lastAimRequest = data;
		/*			
					for(var staticaim in staticaims) 
					{
						var sta = '';
						sta += '				<li id="'+staticaim+'" class="custom"> '; 
						sta += '					<="'+staticaim+'-range">'+(staticaim.substr(0,1).toUpperCase())+staticaim.substr(1)+' <span>('+staticaims[staticaim].count+')</span></label> '; 
						sta += '					<div class="slider" id="'+staticaim+'"> '; 
						sta += '						<a href="#'+staticaim+'-range" style="width:80%;">&nbsp;</a> '; 
						sta += '					</div> '; 
						sta += '					<input type="range" id="'+staticaim+'-range" name="'+staticaim+'-range" min="0" max="10" value="'+staticaims[staticaim]+'"> '; 
						 '				</li> '; 
						;
						passed_hentry += sta;
					}
		*/		

		var htmldata = [];
		var line = 0;
		htmldata[line++] = '<ul id="aimul">';
		for(i in data) {
			var entrysource = data[i].id.toLowerCase().replace('.','_').replace(' ','-');
			htmldata[line++] = '<li id="'+entrysource+'_aims" name="'+entrysource+'" class="custom">	<label for="to-do'+aimid+'-range">'+data[i].name+' <span>('+data[i].count+')</span></label>\
			<div class="slider" id="'+data[i].id+'_aims" name="'+data[i].id+'">	<a href="#to-do'+aimid+'-range" style="width:80%;">&nbsp;</a>	</div>\
			<input type="range" id="to-do'+aimid+'-range" name="to-do'+aimid+'-range" min="0" max="40" value="'+Math.round((parseFloat(data[i].priority)+1)*20)+'"></li>';
			aimid++;
		}
		htmldata[line++] = '</ul>';

		$('#aim_part').html(htmldata.join(''));	

		var el = $('#show-aims');
		if (mmUI.getUIParameter('aim_limit') == true) {
			var more = '';
			var manymore = dataall.meta.count_all - dataall.meta.count_current;
			if (manymore>0) {
				more = 'Show more';// ('+manymore+' more)';				
				el.html('<a href="javascript:mmUI.toggleLimit(\'aim\');">'+(more)+'</a>');
			} else {
				el.html('');
			}
		} else {
			el.html('<a href="javascript:mmUI.toggleLimit(\'aim\');">Show top aims</a>');
		}
		
			//$('section#aims ul').sortable({handle:'label'});
		//$('section#aims ul>li').draggable({revert: true});

		/** preselect aims at reload */
		if (!empty(includeaims)) {
			var t = $('section#aims ul#aimul>li');
			var u = t.parents('ul');
			//if (!u.children('li').hasClass('active')) u.removeClass('selecting');
			//else 
			u.addClass('selecting');
			
			for (var aim in includeaims) {
				//EX##dr: var el = $('section#aims ul#aimul>li[id='+includeaims[aim]+']');
				var el = $('section#aims ul#aimul>li[name='+includeaims[aim]+']');
				$(el).addClass('active');
				/*
				if (!t.hasClass('active')) {
					t.addClass('active');
				} else t.removeClass('active');
				
				var include = '';
				var poopy = u.children('.active').each(function(index) {
					if (include!='') include += ';'
					include += $(this).attr('id');
				});
				*/
				//if (!u.children('li').hasClass('active')) u.removeClass('selecting');
			
			}
		}
		
		// Select aims
		$('section#aims ul#aimul>li>label').click(function(e) {
			e.preventDefault();
			var t = $(this).parents('li');
			var u = t.parents('ul');
			if (!u.hasClass('selecting')) u.addClass('selecting');
			if (!t.hasClass('active')) {
				t.addClass('active');
			} else t.removeClass('active');
			
			var include = '';
			var poopy = u.children('.active').each(function(index) {
				if (include!='') include += ';'
				//EX##dr: include += $(this).attr('title');
				include += $(this).attr('name');
			});
			//alert(include);
			mmUI._setCookie('filterbyaims',include);
			mmUI.updateEntries();
			
			if (!u.children('li').hasClass('active')) u.removeClass('selecting');
		});

		// D & D entry -> aim
		$('section#aims ul>li').droppable({
			hoverClass: 'ui-state-dropp',
			over: function(event, ui) {
				ui.draggable[0].style.left = ui.draggable[0].nextSibling.offsetLeft;
				ui.draggable[0].style.top = ui.draggable[0].nextSibling.offsetTop;
			},
			drop: function(event,ui) {
				var eid = ui.draggable[0].id;
				//EX ##dr: var aid = this.id;
				var aid = this.getAttribute('name');
			
				//var aid = $(this).attributes[0].value;
				if (mmUI.debug>0) console.log('ajax call');

				mmUI.updateRelationEntryAim(eid,aid);
				mmUI.updateAims();//changed count... maybe update just the aim?
			}
		});
		
		//$('section#aims ul').selectable();

		//##dr: OLD REQUEST
		// UI Slider
		/*$('div.slider').each(function() {
			var t = $(this);
			var i = t.parents('li').find('input');
			
			t.slider({
				range:'min',
				value:i.val(),
				min:0,
				max:40,
				change: function(event,ui) {
					i.val(ui.value);				
					//alert(this.id);
					//EX ##dr: mmUI.updateAimPriority(this.id, ui.value);
					mmUI.updateAimPriority($(this).attr('name'), ui.value);
				}
			})
		}); */
		
		//NEW
		$('div.slider').each(function() {
			var t = $(this);
			var i = t.parents('li').find('input');
			var timer = 0;
			doTimer = function() {
				clearTimeout(timer);
				timer = setTimeout("mmUI.updateAimPriorities()", 2000);
			}
			t.slider({
				range:'min',
				value:i.val(),
				min:0,
				max:40,
				start: function(event, ui) {
					doTimer();
				},
				change: function(event, ui) {
					i.val(ui.value);
					var id = $(this).attr('name');
					var value = ((ui.value/20)-1);
					
					aimPriorities[id] = value;
					//aimPriorities.push({"id":id, "value":value});
				}
			})
			
			// S1E:	mmUI.updateAimPriorities gets redefined on every call to mmUI.updateAims

			/*##dr: NEW example for updating aims priority - can change more aims */
			mmUI.updateAimPriorities = function() {
				var priorities = '';
				
				for (id in aimPriorities) {
					priorities += id + ':' + aimPriorities[id] + ';';
				}
				
				priorities = priorities.substring(0, priorities.length-1);
				// 	$.getJSON(this.apiurl+'/BTW/aims/'+this.account+'?access_token='+this.access_token+limitreq+'&priorities='+priorities+'&json_callback=?', function(dataall) {
				JSONPCall('aim','&priorities='+priorities, function(dataall) {
						aimPriorities = new Array();
						mmUI.updateEntries();
					},
					null, 'saving:aim priority'
				);
			}
		});
		
		$(".editablenewaim").editable(function(value,settings) { 
				//alert(value);
				//alert(this.id);
				return value;
			},
			{
				indicator : "<img src='images/wait.gif'>",
				//tooltip   : "Doubleclick to edit...",
				event     : "click",
				type	: "select",
				style  : "inherit"
			}
		);
	}, null, 'loading:aims');
}

/*##dr: OLD example for updating aim priority - just for one aim */
/*mmUI.updateAimPriority = function(id, value) {
//	$.getJSON(this.apiurl+'/BTW/aim/'+this.account+'?access_token='+this.access_token+'&json_callback=?&aid='+id+'&val='+((value/5)-1)+'', function(dataall) {
	JSONPCall('aim','&aid='+id+'&val='+((value/20)-1), function(dataall) {
			//this.updateEntries(dataall['entries']);
			mmUI.updateEntries();
		}, null, 'saving:aim priority'
	);
}*/

// contacts get request, view callback
mmUI.updateContacts = function() {
	var limitreq = (mmUI.getUIParameter('contact_limit') == true ? '&limit=10' : '');
	var pinned = '';
	
	var contactfilter = mmUI._getCookie('filterbycontacts');
	var includecontacts = (!empty(contactfilter) ? contactfilter.split(';') : null);
	
	//$.getJSON(this.apiurl+'/BTW/contacts/'+this.account+'?access_token='+this.access_token+limitreq+'&pinned='+encodeURIComponent(pinned)+'&json_callback=?', function(dataall) {
	JSONPCall('contacts',limitreq+'&pinned='+encodeURIComponent(pinned), function(dataall) {
		//alert(dataall[0]);
		var data = dataall['cts'];
		mmUI.contacts = data;
		var htmldata = [];
		var line = 0;
		var found = false;
		htmldata[line++] = '<ul id="contul">';
		for(i in data) {
			var entrysource = data[i].id;
			var priority =5; //data[i].priority
			htmldata[line++] = '<li id="'+entrysource+'" name="'+escapeForHTML(data[i].name)+'" class="customcontacts"><label style="width:220px">'+data[i].name+' <span>('+data[i].count+')</span></label></li>';
			if (data[i].name == 'bugs@middlemachine.com') found = true;
		}
		if (!found) htmldata[line++] = '<li id="bugs@middlemachine.com" name="bugs@middlemachine.com" class="customcontacts"><label>'+'bugs@middlemachine.com'+' </label></li>';
		htmldata[line++] = '</ul>';

		$('#contacts_part').html(htmldata.join(''));	
		
		var el = $('#show-contacts');
		if (mmUI.getUIParameter('contact_limit') == true) {
			var more = '';
			var manymore = dataall.meta.count_all - dataall.meta.count_current;
			if (manymore>0) {
				more = 'Show more';// ('+manymore+' more)';				
				el.html('<a href="javascript:mmUI.toggleLimit(\'contact\');">'+(more)+'</a>');
			} else {
				el.html('');
			}
		} else {
			el.html('<a href="javascript:mmUI.toggleLimit(\'contact\');">Show top contacts</a>');
		}

		/** preselect contacts at reload */
		if (!empty(includecontacts)) {
			var t = $('section#aims ul#contul>li');
			var u = t.parents('ul');
			//if (!u.children('li').hasClass('active')) u.removeClass('selecting');
			//else 
			u.addClass('selecting');
			
			for (var aim in includecontacts) {
				var el = $('ul#contul>li[id='+includecontacts[aim]+']');
				$(el).addClass('active');
				/*
				if (!t.hasClass('active')) {
					t.addClass('active');
				} else t.removeClass('active');
				
				var include = '';
				var poopy = u.children('.active').each(function(index) {
					if (include!='') include += ';'
					include += $(this).attr('id');
				});
				*/
				//if (!u.children('li').hasClass('active')) u.removeClass('selecting');
			
			}
		}
		
		// Select contacts
		$('section#aims ul#contul>li>label').click(function(e) {
			e.preventDefault();
			var t = $(this).parents('li');
			var u = t.parents('ul');
			if (!u.hasClass('selecting')) u.addClass('selecting');
			if (!t.hasClass('active')) {
				t.addClass('active');
			} else t.removeClass('active');
			
			var include = '';
			var includenames = '';
			var poopy = u.children('.active').each(function(index) {
				if (include!='') include += ';'
				include += $(this).attr('id');
			});
			var contactfilternames = u.children('.active').each(function(index) {
				if (includenames!='') includenames += ';'
				includenames += $(this).attr('name');
			});
			//alert(include);
			mmUI._setCookie('filterbycontacts',include);
			mmUI._setCookie('filterbycontacts_names',includenames);
			mmUI.updateEntries(null, include);
			
			if (!u.children('li').hasClass('active')) u.removeClass('selecting');
		});
			
		// D & D entry -> contact
		$('section#aims ul#contul>li').droppable({
			hoverClass: 'ui-state-dropp',
			drop: function(event,ui) {
				var eid = ui.draggable[0].id;
				var aid = $(this).attr('name');
				
				//var aid = $(this).attributes[0].value;
				if (mmUI.debug>0) console.log('ajax call');

				mmUI.updateRelationEntryShared(eid,aid);
				//** TODO update entries? */
				mmUI.updateContacts();//changed count... maybe update just the aim?
				event.preventDefault();
				//$(ui.draggable).parent().sortable('cancel');//TODO this is a kludge and should be fixed
			}
		});

		//$('section#aims ul').selectable();
	}, null, 'loading:contacts');
}

// geo request, callback, view callback
mmUI.updateNearLocs = function() {
	var filter = mmUI._getCookie('filterbynearlocs');
	var includelocs = (!empty(filter) ? filter.split(';') : null);
	
	//$.getJSON(this.apiurl+'/BTW/contacts/'+this.account+'?access_token='+this.access_token+limitreq+'&pinned='+encodeURIComponent(pinned)+'&json_callback=?', function(dataall) {
	JSONPCall('geo','&nearlocs=', function(dataall) {
		//alert(dataall[0]);
		var htmldata = [];
		var line = 0;
		data = dataall['near'];
		htmldata[line++] = '<ul id="nearlocul">';
		for(i in data) {
			var entrysource = data[i].id;
			var priority =5; //data[i].priority
			//htmldata[line++] = '<li id="'+entrysource+'" name="'+escapeForHTML(data[i].name)+'" class="customcontacts"><label style="width: 230px; text-transform:capitalize">'+data[i].name+' <span style="font-size: 0.75em; vertical-align:top; line-height: 1.0em; float:right">'+(data[i].distance>500 ? Math.round(data[i].distance/100)/10+'k' : data[i].distance)+'m</span><span>('+data[i].i4p+')</span></label></li>';
			htmldata[line++] = '<li id="'+entrysource+'" name="'+escapeForHTML(data[i].name)+'" class="customnearlocs"><label style="width: 230px; text-transform:capitalize">'+data[i].name+(empty(data[i].distance)?'':' <span style=" float:right">'+(data[i].distance>500 ? Math.round(data[i].distance/100)/10+'k' : data[i].distance)+'m</span>')+(empty(data[i].i4p)?'':'<span>('+data[i].i4p+')</span>')+'</label></li>';
		}
		htmldata[line++] = '</ul>';

		$('#places_part').html(htmldata.join(''));	

		/** preselect contacts at reload */
		if (!empty(includelocs)) {
			var t = $('section#aims ul#nearlocul>li');
			var u = t.parents('ul');
			//if (!u.children('li').hasClass('active')) u.removeClass('selecting');
			//else 
			u.addClass('selecting');
			
			for (var aim in includelocs) {
				var el = $('ul#nearlocul>li[id='+includelocs[aim]+']');
				$(el).addClass('active');
				/*
				if (!t.hasClass('active')) {
					t.addClass('active');
				} else t.removeClass('active');
				
				var include = '';
				var poopy = u.children('.active').each(function(index) {
					if (include!='') include += ';'
					include += $(this).attr('id');
				});
				*/
				//if (!u.children('li').hasClass('active')) u.removeClass('selecting');
			}
		}
		
		// Select location
		$('section#aims ul#nearlocul>li>label').click(function(e) {
			e.preventDefault();
			var t = $(this).parents('li');
			var u = t.parents('ul');
			var selected = $('section#aims ul#nearlocul>li.customnearlocs.active');

			if (!u.hasClass('selecting')) u.addClass('selecting');
			if (!t.hasClass('active')) {
				selected.removeClass('active');
				t.addClass('active');
			} else t.removeClass('active');
			
			var include = '';
			var includenames = '';
			var poopy = u.children('.active').each(function(index) {
				if (include!='') include += ';'
				include += $(this).attr('id');
			});
			var contactfilternames = u.children('.active').each(function(index) {
				if (includenames!='') includenames += ';'
				includenames += $(this).attr('name');
			});	
			mmUI._setCookie('filterbynearlocs',include);
			mmUI._setCookie('filterbynearlocs_names',includenames);
			mmUI.updateEntries(null, include);
			
			if (!u.children('li').hasClass('active')) u.removeClass('selecting');
		});

		// D & D entry -> contact
		$('section#aims ul#contul>li').droppable({
			hoverClass: 'ui-state-dropp',
			drop: function(event,ui) {
				var eid = ui.draggable[0].id;
				var aid = $(this).attr('name');
				
				//var aid = $(this).attributes[0].value;
				if (mmUI.debug>0) console.log('ajax call');

				mmUI.updateRelationEntryShared(eid,aid);
				//** TODO update entries? */
				mmUI.updateContacts();//changed count... maybe update just the aim?
				event.preventDefault();
				//$(ui.draggable).parent().sortable('cancel');//TODO this is a kludge and should be fixed
			}
		});
	},null,'loading:nearlocs');
 }

// S1E: Toggles inline editing
// entry edit view
// id of entry, edit as fuzz
mmUI.editEntryTitle = function(id, fuzz, disable) {
	//$(".editabletitle")
	var el = $("section.entries>article[id='"+id+"']").find("a[id='text']");
	if (el.children('textarea').length>0){
		//if (it[0].text == 'APPLYCANCEL') {
		if (disable) {
			var previous = el.data('previous');
			//var current = el.children('textarea').html();
			var current = $('#textarea-'+id).val();
			if (escapeForHTML(current)!=previous) {
				//el.html(el.children('textarea').html());
					//if (escapeForHTML(value.current) == value.previous) return value;
				//var el = $(this).parents('article');
				//var key = $(this)[0].id;
				//var t = $(this);
				//var 
				mmUI.updateEntryValue(id, 'text',current, function(data) {
					//var value = (empty(data['pretty'+key]) ? data[key] : data['pretty'+key]);
					//t.html(value);
					el.html(current);
				});
			
			} else {
				el.html(el.data('cancelvalue'));
			}
		} 
		return;
		//return;
	}
	/*quick tasks proti quick-tasks drekec account	*/
	var text = el.html();
	if (fuzz!= null) text = fuzz;
	var data = {current: text};
	rows=getRowcount(text,45);
	el.data('previous',text);
	el.data('cancelvalue',el.html());
	
	el.html('<textarea id="textarea-'+id+'" onblur="mmUI.editEntryTitle(\''+id+'\',null,true)" class="editableinputtitle" onclick="javascript:return false;" rows="'+rows+'">'+data.current+'</textarea>');
	//el.html('<textarea id="textarea-'+id+'" onblur="mmUI.editEntryTitle(\''+id+'\',null,true)" class="editableinputtitle" onclick="javascript:return false;" rows="'+rows+'">'+data.current+'</textarea><button class="editableapplybutton">APPLY</button><button class="editablecancelbutton">CANCEL</button>');
	//.html('<button class="editableapplybutton" /><button class="editablecancelbutton" />');
	el.children('textarea').focus();	
}

// geo request, map view callback
mmUI.getCurrentGeo = function() {
	var limitreq = (mmUI.getUIParameter('geo_limit') == true ? '&limit=10' : '');
	//$.getJSON(this.apiurl+'/BTW/geo/'+this.account+'?access_token='+this.access_token+limitreq+'&get=true&json_callback=?', function(dataall) {
	JSONPCall('geo',limitreq+'&get', function(dataall) {
		//if (empty(dataall)) alert('pupi');
		if (mmUI.checkError(dataall)) return;
		if (dataall.lat == 0) return;
		mmUI.updateMap(dataall.lat,dataall.lon);
	},null,'loading:current location');
 }

// geo persistence helper
mmUI.getLocationByID = function(id) {
	for(var it in mmUI.locations) {	
		if (mmUI.locations[it].id == id) return mmUI.locations[it];
	}
	return null;
}

// geo map view helper
mmUI.geoCenterMarker = function(it, define) {
	if (it==-1) {//current position
		var clatlon = mmUI.currentpositionmarker.getPosition();
		if (empty(clatlon)) return;
		if (empty(clatlon.lat())) return;
		if (mmUI.debug>0) console.log('panning to: ',clatlng);
		mmUI.map.panTo(clatlon);
		google.maps.event.trigger(mmUI.currentpositionmarker, 'click');
		return;
	}
	if (empty(mmUI.locations)) return;
	if (empty(mmUI.locations[it])) return;
	if (empty(mmUI.locations[it].lat)) {
		var locat = mmUI.locations[it];
		//current marker
		var clatlon = mmUI.currentmarker.getPosition();
		if (empty(clatlon)) {
			//SET LOCATION YO
			clatlon = mmUI.map.getCenter();
			mmUI.currentmarker.setPosition(clatlon);
		}
		mmUI.infowindow.close();
		//if (empty(clatlon.lat()) || isNaN(clatlon.lat())) return;
		if (mmUI.debug>0) console.log('panning to2: ',clatlon);
		mmUI.map.panTo(clatlon);
		mmUI.infowindow.setContent(mmUI._getMarkerInfoHTML(locat));
		mmUI.infowindow.open(mmUI.map,mmUI.currentmarker);
		//google.maps.event.trigger(mmUI.currentmarker, 'click');
	} else {
		if (empty(mmUI.locations[it].marker)) return false;
		if (mmUI.debug>0) console.log('panning to3: ',mmUI.locations[it].marker.getPosition());
		mmUI.locations[it].marker.getMap().panTo(mmUI.locations[it].marker.getPosition());
		google.maps.event.trigger(mmUI.locations[it].marker, 'click');
		//$(mmUI.locations[it].marker).click();
	}
}

// geo marker template
mmUI._getMarkerInfoHTML = function(location) {
	if (empty(location)) {
		var ret = 'define it yo ';
		return ret;
	}
	var ret = location.name+'<br/>';
	ret += '<img src="images/tag.png">';
	if (!empty(location.tags)) ret += location.tags.join(', ');
	if (!empty(location.id))  {
		ret += '<br/><a onclick="mmUI.deleteGeoLocation('+location.id+')">delete location</a>';
		ret += '<br/><br/><a onclick="mmUI.ShowAllEntriesHere('+location.id+', \''+location.name+'\')">show all entries here (' + location.i4p + ')</a>';	
	}
	if (empty(location.lat)) ret += '<br/><a onclick="mmUI.saveCurrentMarkerGeoLocationSelected('+location.id+')">save location</a>';
	return ret;
}

// S1E: 
// geo map marker view, ui callbacks
mmUI.updateLocations = function(highlight) {
	var marker;

	var map_overlay = [];
	var mapit = 0;
	var pos = mmUI.currentpositionmarker.getPosition();
	if (!empty(pos)) {
		if (!empty(pos.lat()) && !isNaN(pos.lat())) {
			//alert(pos.lat());
			map_overlay[mapit++] = '<p><a href="javascript:mmUI.geoCenterMarker(-1)"><div style="">Current Location</div></a></p>';
		}
	}
	var arbitratrylocationcountercurrentlynotassociatedwithreality = 0;
	arbitratrylocationcountercurrentlynotassociatedwithreality++;
	for (it=0; it<mmUI.locations.length; it++) {
		var location = mmUI.locations[it];
		
		if (empty(location.lat)) {
			//map_overlay[mapit++] = '<p><a href="javascript:mmUI.geoCenterMarker('+it+')"><div style="padding:8px;font-size:17px;">'+(it+1)+' @?</div>'+location.name+'</a>';
		} else {
			var latlng = new google.maps.LatLng(location.lat, location.lon);

			var markarr = {
				position: latlng,
				map: mmUI.map,
				title: location.name
				//draggable: true ##implementirat
			}
			if (location.name == 'home') {
				//EX ##dr markarr['icon'] = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_icon_withshadow&chld=home|DDDD00&ext=.png");
				markarr['icon'] = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_icon&chld=home|DDDD00&ext=.png");
			} else {
				//EX ##dr markarr['icon'] = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter_withshadow&chld="+(it+1)+"|c44&ext=.png");
				markarr['icon'] = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld="+(it+1)+"|c44&ext=.png");
			}
			mmUI.locations[it].marker = new google.maps.Marker(markarr);
			
			mmUI.locations[it].marker.setTitle(mmUI.locations[it].name);
			
			if (location.id == highlight) {
				var cont = mmUI._getMarkerInfoHTML(location);
				/*
				mmUI.locations[it].infowindow.setContent(cont);
				mmUI.locations[it].infowindow.open(map,mmUI.locations[it].marker);
				*/
				mmUI.infowindow.close();
				mmUI.infowindow.setContent(cont);
				mmUI.infowindow.open(mmUI.map,location.marker);
			}
			
			/*					
			mmUI.locations[it].infowindow = new google.maps.InfoWindow({ 
				content: '<br/><br/><br/><br/><br/><br/><br/><br/>'
			});				
			*/
			google.maps.event.addListener(location.marker, 'click', (function(marker,it) {
				return function() {
					mmUI.infowindow.close();
					var cont = mmUI._getMarkerInfoHTML(mmUI.locations[it]);
					/*
					mmUI.locations[it].infowindow.setContent(cont);
					mmUI.locations[it].infowindow.open(map,mmUI.locations[it].marker);
					*/
					mmUI.infowindow.setContent(cont);
					mmUI.infowindow.open(mmUI.map,mmUI.locations[it].marker);
				}
			})(marker,it));
			map_overlay[mapit++] = '<p><a href="javascript:mmUI.geoCenterMarker('+it+')"><div style="">'+(arbitratrylocationcountercurrentlynotassociatedwithreality++)+' '+location.name+'</div></a>';
			//map_overlay[mapit++] = ' [<a onclick="mmUI.deleteGeoLocation('+location.id+')">x</a>]';
			map_overlay[mapit++] = '</p>';				
		}
		//break;
	}

	$('#map_overlay').html(map_overlay.join(''));

	if (mmUI.loaded['geolocations']) {
		var definemsg = '';
		if (!empty(highlight)) {
			var loc = mmUI.getLocationByID(highlight);
			definemsg = 'Please define '+loc.name+' on the map';
			//mmUI.infowindow.close();
		} 
		$('#definepoint').html(definemsg);
	}
}

// geo request, persistence callback
mmUI.getGeo = function(highlight) {
	if (mmUI.loaded['map'] != true) return;

	//$.getJSON(this.apiurl+'/BTW/geo/'+this.account+'?access_token='+this.access_token+'&locations=true&json_callback=?', function(dataall) {
	JSONPCall('geo','&locations', function(dataall) {
		if (mmUI.checkError(dataall)) return;
		/** if locations already loaded and autocompletes instantiated--- check for memory leak/destroy TODO */
		if (!empty(mmUI.locations)) {
			for(var i in mmUI.locations) {
				if (!empty(mmUI.locations[i].marker)) {
					mmUI.locations[i].marker.setMap(null);
					/**TODO close infowindow if open*/
				}
			}
			mmUI.infowindow.close();
		}
		mmUI.locations = dataall;//mmUI.updateMap(dataall.lat,dataall.lon);
		mmUI.updateLocations(highlight);
		mmUI.loaded['geolocations'] = true;
	},null,'loading:locations');
 }

// geo post request
mmUI.setGeo = function(name, lat, lon, tags, id) {
	//var limitreq = (mmUI.getUIParameter('geo_limit') == true ? '&limit=10' : '');
	//if (empty(map)) return;
	var tagsdelimited = (empty(tags) ? '' : tags.replace(',',';'));
	var idpart = (empty(id) ? '' : '&locid='+id);
	//$.getJSON(this.apiurl+'/BTW/geo/'+this.account+'?access_token='+this.access_token+'&name='+encodeURIComponent(name)+'&lat='+encodeURIComponent(lat)+'&lon='+encodeURIComponent(lon)+'&tags='+encodeURIComponent(tagsdelimited)+'&setloc=true&json_callback=?', function(dataall) {
	JSONPCall('geo','&name='+encodeURIComponent(name)+'&lat='+encodeURIComponent(lat)+'&lon='+encodeURIComponent(lon)+'&tags='+encodeURIComponent(tagsdelimited)+idpart+'&setloc=', function(dataall) {
		//if (empty(dataall)) alert('pupi');
		if (mmUI.checkError(dataall)) return;
		if (!empty(mmUI.map)) mmUI.getGeo();//reload all locations? dont update map yo
		//mmUI.locations = dataall;//mmUI.updateMap(dataall.lat,dataall.lon);
	});
}

// geo destroy request
mmUI.deleteGeoLocation = function(id) {
	//EX mmUI.infowindow.close();
	//$.getJSON(this.apiurl+'/BTW/geo/'+this.account+'?access_token='+this.access_token+'&locid='+encodeURIComponent(id)+'&delloc=true&json_callback=?', function(dataall) {
	JSONPCall('geo','&locid='+encodeURIComponent(id)+'&delloc=true', function(dataall) {
		//if (empty(dataall)) alert('pupi');
		if (mmUI.checkError(dataall)) return;
		//TODO if (id in mmUI.lastEntryRequest .at.id) update only this entry UI by removing location
		mmUI.getGeo();
		//mmUI.updateEntries();		
	});
}

// entries filter
mmUI.ShowAllEntriesHere = function(id, name) {
	mmUI._setCookie('filterbynearlocs',id);
	mmUI._setCookie('filterbynearlocs_names',name);
	mmUI.updateEntries(null, id);
	mmUI.saveDefinedAndClose();
	
	//show entries on infowindow under locations
	/*var calltype = 'entries';
	var efp = '_&EfP=' + id;
	var cont = '';
	
	cont += mmUI.infowindow.getContent().toString().replace('show all entries here', '');
	
	JSONPCall(calltype, efp, function(dataall) {
	mmUI.requestCache['entries'] = {};
	for(var ei in dataall.entries.items) {
		mmUI.requestCache['entries'][dataall.entries.items[ei].id] = dataall.entries.items[ei];
		cont += dataall.entries.items[ei].text + "<br />";
	}
	mmUI.infowindow.setContent(cont);
	}
	); */
}

// agenda
mmUI.saveDefinedAndClose = function() {
	location.href='#agenda/';
	mmUI.infowindow.close();
}

// geo helper
mmUI.saveCurrentMarkerGeoLocationSelected = function(returnto) {
	var pos = mmUI.currentmarker.getPosition();
	return mmUI.saveCurrentMarkerGeoLocation(returnto, pos);
}

// geo helper
mmUI.saveCurrentMarkerGeoLocationCurrent = function(returnto) {
	var pos = mmUI.currentpositionmarker.getPosition();
	return mmUI.saveCurrentMarkerGeoLocation(returnto, pos);
}

// geo helper
mmUI.saveCurrentMarkerGeoLocation = function(returnto, pos) {
	var name = $('#currentmarkername').val();
	var tags = $('#currentmarkertags').val();
	var el = $('#currentmarkerid');
	var id = null;
	if (!empty(el)) id = $('#currentmarkerid').val();
	
	if (empty(mmUI.currentmarker)) return;
	var lat = pos.lat();
	var lon = pos.lng();
	if (isNaN(lat)) return;
	mmUI.setGeo(name,lat,lon,tags,mmUI.mapDefinePoint);
	mmUI.currentmarker.setVisible(false);
	mmUI.mapDefinePoint = null;
	mmUI.infowindow.setContent('saving <img src="images/wait.gif">');
	if (!empty(returnto)) {
		setTimeout("mmUI.saveDefinedAndClose()",500);
		mmUI.messages['ground'] = '';
		/** TODO return to editing the entry that brought us to the map */
	} else {
		mmUI.infowindow.close();
	}
	return false;
}

// persistence util
mmUI._setCookie = function (name,value,expireminutes) {
	if (typeof localStorage != 'undefined') return localStorage.setItem(name,value);
	//return sessionStorage.setItem(name,value);
	var exdate=new Date();
	exdate.setTime(exdate.getTime()+(expireminutes*60*1000));
	//alert(document.domain);
	//document.cookie = 'middlemachine.com_'+name+ "=" +escape(value)+((expireminutes==null) ? "" : "; expires="+exdate.toUTCString())+'; path=/; domain='+document.domain;
	document.cookie = 'middlemachine.com_'+name+ "=" +escape(value)+((expireminutes==null) ? "" : "; expires="+exdate.toUTCString())+'; path=/';
}

/*
mmUI._getCookie = function(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return unescape(c.substring(nameEQ.length,c.length));
	}
	return null;
}
*/

// persistence util
mmUI._getCookie = function(name) {
	if (typeof localStorage != 'undefined') return localStorage.getItem(name);
	//return sessionStorage.getItem(name);
	var c_name = 'middlemachine.com_'+name;
	if (document.cookie.length>0)
	{
		c_start=document.cookie.indexOf(c_name + "=");
		if (c_start!=-1)
		{
			c_start=c_start + c_name.length+1;
			c_end=document.cookie.indexOf(";",c_start);
			if (c_end==-1) c_end=document.cookie.length;
			return unescape(document.cookie.substring(c_start,c_end));
		}
	}
	return "";
}

// persistence session
mmUI.updateCookie = function() {
	if (empty(mmUI.access_token)) return mmUI.deleteCookie();
	var currdate=new Date().getTime();
	mmUI._setCookie('lastcookieupdate',currdate,90);

	//alert(mmUI.account);
	mmUI._setCookie('account',mmUI.account,90);
	mmUI._setCookie('access_token',mmUI.access_token,90);
	mmUI._setCookie('username',mmUI.username,90);
	mmUI._setCookie('apiurl',mmUI.apiurl,90);
	//mmUI.loadCookie();
}

// persistence session
mmUI.deleteCookie = function() {
	//alert(mmUI.account);
	mmUI._setCookie('account','',-1);
	mmUI._setCookie('access_token','',-1);
	mmUI._setCookie('username','',-1);
	//mmUI.loadCookie();
}

// persistence session
mmUI.loadCookie = function() {
	var cookie = mmUI._getCookie('access_token');
	//	alert(document.cookie);
	if (empty(cookie)) return false;
	
	var currdate=new Date().getTime();
	var lastupdate = mmUI._getCookie('lastcookieupdate');
	if ((Number(lastupdate)+30*60*1000)<currdate) return;//30min "session timeout", refreshes upon login and with each json call
	
	mmUI.access_token = cookie;
	mmUI.account = mmUI._getCookie('account');
	mmUI.username = mmUI._getCookie('username');	
	mmUI.apiurl = mmUI._getCookie('apiurl');
}

// persistence search
mmUI.clearSearchFilters = function(skipupdate) {
	if (!empty(mmUI._getCookie('filterbyaims'))) {
		mmUI._setCookie('filterbyaims',undefined); 
		if (!skipupdate) mmUI.updateAims(); 
	}
	if (!empty(mmUI._getCookie('filterbycontacts'))) {
		mmUI._setCookie('filterbycontacts',undefined); 
		if (!skipupdate) mmUI.updateContacts(); 
	}
	if (!empty(mmUI._getCookie('filterbynearlocs'))) {
		mmUI._setCookie('filterbynearlocs',undefined); 
		if (!skipupdate) mmUI.updateNearLocs(); 
	}
	mmUI._setCookie('searchentries',undefined);
	if (!skipupdate)mmUI.updateEntries(); 
}

// session view, request, callback, persistence, redirect
mmUI.login = function(username, password) {
	//alert('_'+password+'_');
	//alert($.md5(password));
	$('#loginmsg').html('Logging in... <img src="images/wait.gif">');
	
	mmUI.apiurl = $('#server').val().replace(/^\s+|\s+$/g,"");
	//$.getJSON(this.apiurl+'/BTW/login/'+username+'?pass='+$.md5(password)+'&md5=true&json_callback=?', function(dataall) {
	//$.getJSON(this.apiurl+'/BTW/api/login/'+username+'?pass='+$.md5(password)+'&md5=true&json_callback=?', function(dataall) {
	$.jsonp({timeout: 25000, "url": mmUI.apiurl+'/BTW/api/login/'+username+'?pass='+$.md5(password)+'&md5=true&json_callback=?',
		"success": function(dataall) {
			//JSONPCall('api/login','&locid='+encodeURIComponent(id)+'&delloc=true', function(dataall) {
			//this.updateEntries(dataall['entries']);
			if (dataall.token!=null) {
				$('#loginmsg').html('');
				location.href= '#';
				//location.href= '#agenda/';
				
				mmUI.access_token = dataall.token;
				mmUI.account = dataall.account;
				mmUI.username = dataall.real_name;
				//document.cookie = 'ppkcookie1=testcookie; expires=Thu, 2 Aug 2001 20:47:11 UTC; path=/'
				mmUI.updateCookie();
				mmUI.saveUIParameter('entry_limit','1');
				mmUI.saveUIParameter('aim_limit','1');
				mmUI.saveUIParameter('contact_limit','1');
				mmUI.startedRequests = {};
				if (!empty(mmUI.apiurl)) {
					//$.getJSON(mmUI.apiurl+'/BTW/appdata/'+mmUI.account+'?access_token='+mmUI.access_token+'&json_callback=?', function(dataall) {
					JSONPCall('appdata', '', function(dataall) {
						mmUI.setUIObject('appdata', dataall['workflow']);		
						location.href= '#agenda/';
						//mmUI.setupUI(); // SETUP UI
					},null,'loading:application data');
				} else {
					location.href= '#';
					//mmUI.setupUI(); // SETUP UI
						//location.href= '#';
				}
					//mmUI.setupUI();
			} else {
				$('#loginmsg').html('<b>Incorrect username or password.</b>');
			}
		},
		"error": function(d,msg) {
			$('#loginmsg').html('<b style="color:#f11">Error connecting to server</b><br>Please try later.');
		}
	});
	//return true;
	return false;
 }

// session view, request, callback
mmUI.logout = function() {
	mmUI.clearSearchFilters(true);
	mmUI.updateCookie();
	mmUI.deleteCookie();
	
	mmUI.initializeDOM();
	mmUI.initializeUI();
	
	if (!mmUI.isUserLoggedIn()) {
		location.href= '#';
		//mmUI.setupUI();
		return false;
	}

	JSONPCall('api/logout','', function(dataall) {
		//alert('logout'+document.cookie);
		//mmUI.setupUI();
		mmUI.access_token = null;
		mmUI.apiurl = null;
		mmUI.account = null;
		mmUI.username = null;
		location.href= '#';//on hashchange will reload the ui
		//$('#justsubmit').submit();
	}, function() {
		mmUI.access_token = null;
		mmUI.apiurl = null;		
		mmUI.account = null;
		mmUI.username = null;
		location.href= '#';//on hashchange will reload the ui
	});	
	return false;
}

// autocomplete util
mmUI.clearEntryBar = function() {
	$('#new-entry').val('');
	$('#new-entry').autocomplete("close");
}

// autocomplete view callback, shows all entries matching search
mmUI.searchFuzz = function(normal) {
	//event.preventDefault();
	var fuzz = $('#new-entry').val();
	if (!normal) fuzz = fuzz.substr(1);
	//location.href='#agenda/#search='+fuzz;
	mmUI.clearEntryBar();
	
	mmUI._setCookie('searchentries',fuzz);
	mmUI.updateEntries();
}


mmUI.addFuzz = function(fuzz) {
	//$('#new-entry').close();
	$('#new-entry').autocomplete("close");
	var fuzz = $('#new-entry').val();
	if (fuzz == '') return;
	mmUI.clearEntryBar();
	mmUI.clearSearchFilters(true);
	//$.getJSON(this.apiurl+'/BTW/entry/'+this.account+'?access_token='+this.access_token+'&add='+encodeURIComponent(fuzz)+'&json_callback=?', function(dataall) {
	JSONPCall('entry','&add='+encodeURIComponent(fuzz), function(dataall) {
		//mmUI.updateEntries();
		mmUI.requestCache['entries'] = {};
		for(var ei in dataall.entries.items) {
			mmUI.requestCache['entries'][dataall.entries.items[ei].id] = dataall.entries.items[ei];
		}
		mmUI._constructEntries(dataall);
		//var item = $("section.entries>article[id='text']>header");
		//item.click();
		mmUI.updateAims();
		mmUI.updateContacts();
		if (!empty(dataall.client_directives)) {
			if (!empty(dataall.client_directives.new_place)) {
				var new_place = dataall.client_directives.new_place;
				mmUI.messages['ground'] = '<a href="#locations/?define='+new_place.id+'">Ground @'+new_place['name']+'</a>?';
				//$('#filteredby').html($('#filteredby').html()+' <a href="#locations/?define='+dataall.new_place.id+'">Ground @'+dataall.new_place['name']+'</a>?').fadeIn('fast');
			} else {
				mmUI.messages['ground'] = '';
			}
		}
		mmUI.updateCurrentRequestInfo();
	}, null, 'saving:new fuzz');
}

// autocomplete request, persistence callback
mmUI.updateAwesomeBarSource = function () {
	//UI Autocomplete
	//$.getJSON(mmUI.apiurl+'/BTW/suggestions/'+mmUI.account+'?access_token='+mmUI.access_token+'&json_callback=?', function(dataall) {
	JSONPCall('suggestions','', function(dataall) {
		if (mmUI.checkError(dataall)) return;
		//mmUI.updateEntries();
		mmUI.availableTags = new Array();
		mmUI.allTags = dataall;
		mmUI.allTags.none.sort();
		for(var realkey in mmUI.allTags) {
			for(var i in mmUI.allTags[realkey]) {
				var key = realkey;
				if (realkey == 'contacts') {
					key = '>';//ofmg TODOFFS
					if (empty(mmUI.availableTags[key])) mmUI.availableTags[key] = new Array();
					var val = key + mmUI.allTags[realkey][i];
					mmUI.availableTags[key].push(val);
					key = '<';
					if (empty(mmUI.availableTags[key])) mmUI.availableTags[key] = new Array();
					var val = key + mmUI.allTags[realkey][i];
					mmUI.availableTags[key].push(val);
					key = '+';
				}
				// if (realkey == 
				if (empty(mmUI.availableTags[key])) mmUI.availableTags[key] = new Array();
				var val = mmUI.allTags[realkey][i];
				if (key == '(') val += ')';
				if (key!='none') val = key + val;
				mmUI.availableTags[key].push(val);
			}
		}
	}, null, 'loading:suggestions');
}

// autocomplete view, event bindings
mmUI.setupAwesomeBar = function() {
	function split(val) {
		return val.split(/ \s*/);
	}

	function extractLast(term) {
		return split(term).pop();
	}

	$('input#new-entry').autocomplete({
		multiple: true,
		minLength: 0,
		delay: 0,
		maxItemsToShow: 2,
		selectFirst: true,
		autoFocus: true,
		source: function(request,response) {
			// delegate back to autocomplete,but extract the last term
			
			var existingSearch = split(request.term);
			var lastterm = extractLast(request.term);//halo bug, kaj pa ce kliknes na zacetek stringa in zacnes pisaT TODO?
			var returnfrom = null;
			if (empty(mmUI.availableTags)) {
				//handle it... TODO
				return false;
			}
			if (lastterm == '') return false;
			//var returnfrom = availableTags;
			if (lastterm[0] == '#') {
				returnfrom = mmUI.availableTags['#'];
			} else if (lastterm[0] == '@') {
				returnfrom = mmUI.availableTags['@'];
			} else if (lastterm[0] == '>') {
				//lastterm = lastterm.substr(1);
				returnfrom = mmUI.availableTags[">"];
			} else if (lastterm[0] == '<') {
				//lastterm = lastterm.substr(1);
				returnfrom = mmUI.availableTags['<'];
			} else if (lastterm[0] == '$') {
				returnfrom = mmUI.availableTags['$'];
			} else if (lastterm[0] == '(') {
				returnfrom = mmUI.availableTags['('];
			} else if (lastterm[0] == '+') {
				returnfrom = mmUI.availableTags['+'];
			}
			if (returnfrom == null) {
				var norml = 1;
				returnfrom = mmUI.availableTags['none'];
			} else {
			}
			var results = new Array();
			for(i in returnfrom) {
				//var srch = (norml==1?)
				//if (returnfrom[i].search(lastterm)!=-1) {
				//	if (returnfrom[i].search("/"+lastterm+"/i")!=-1) {
				results.push(returnfrom[i]);
				//	if (i>25) break;
				//}
			}

			//var resp = results;
			var resp = new Array();
			var srch = lastterm;
			var nrml = (empty(norml)?'false':'true');
			if (empty(norml) && lastterm.length>1) {
				resp = $.ui.autocomplete.filter(results,lastterm).splice(0,5);
				//resp.push('</a></li><li class="ui-existing">Existing items</li><li><a>');
				srch = lastterm.substr(1);
			}
			//alert(srch);
			var foundsimilar = false;
			if (request.term.length > 2) {
				var icnt = 0;
				var respok = mmUI.availableTags['none'];
				for(var cure in existingSearch) {

					var resp2 = respok.slice();
					respok = [];
					//var resp2 = $.ui.autocomplete.filter(mmUI.availableTags['none'],srch).splice(0,5);			
					//var regexsrch = srch.replace("/[.*+?|()\[\]{}\\]/");
					var regexsrch = existingSearch[cure].replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
					var rx = new RegExp(regexsrch,'gi');
					for(var nonval in resp2) {
						var pp = resp2[nonval];
						if (resp2[nonval].t.search(rx)==-1) {
							//resp2.splice(nonval,1);
							//resp2.push(mmUI.availableTags['none'][nonval]);
							//icnt++;
						} else {
							respok.push(resp2[nonval]);
							foundsimilar = true;
							//if (icnt>4) break;
						}
					}
				}
				resp.push('__srch')
				if (foundsimilar) resp.push('----');
				resp = resp.concat(respok.splice(0,4));
			}
			response(resp);
			//response($.ui.autocomplete.filter(availableTags,lastterm));
			//$('ul.ui-autocomplete').prepend('<li class="ui-existing">Existing items</li>');
			//$('ul.ui-autocomplete').append('<li><a href="" onclick="javascript: mmUI.searchFuzz('+nrml+'); event.returnValue = false; return false;">Show all results</a></li>');
			
			//$('ul.ui-autocomplete').append('<li class="ui-menu-item" role="menuitem"><a href="javascript: return false;" class="ui-corner-all" onclick="javascript: mmUI.searchFuzz('+nrml+'); event.returnValue = false; return false;">poop</a></li>');
			$('ul.ui-autocomplete').append('<li class="ui-all"><a href="javascript: return false;" onclick="javascript: mmUI.searchFuzz('+nrml+'); event.returnValue = false; return false;">Show all search results</a></li>');		
		},
		focus: function() {
			// prevent value inserted on focus
			return false;
		},
		select: function(event,ui) {
			if (!empty(ui.item.url)) location.href = ui.item.url;
			
			var terms = split(this.value);
			// remove the current input
			terms.pop();
			// add the selected item
			terms.push(ui.item.value);
			// add placeholder to get the comma-and-space at the end
			terms.push('');
			this.value = terms.join(' ');
			return false;
		},
		change: function(event,ui) {
			mmUI.awesomeBarUpdate();
		}		
	});

	$('input#new-entry').data("autocomplete")._renderItem = function(ul, item) {
		var poopy = $("<li></li>");		
		var url = (item.label == item.value ? '' : item.value);
		if (item.label=='----') poopy = $("<li>Existing similar items</li>");
		if (item.label=='__srch') return;
		
		if (empty(item.value)) {//this is an url
			//for(var i in item) 
			{
				//if (empty(item[i])) continue;
				url += '#agenda/?entryid='+item.id;
				item.url = url;
				item.label = item.t;
				url += '" class="autocompletelink';
			}
		}
		//if (url == 'trans') poopy.append('<object width="480" height="385"><param name="movie" value="http://www.youtube.com/v/BCgbYnNAbSM?fs=1&amp;hl=en_US"></param><param name="allowFullScreen" value="true"></param><param name="allowscriptaccess" value="always"></param><embed src="http://www.youtube.com/v/BCgbYnNAbSM?fs=1&amp;hl=en_US" type="application/x-shockwave-flash" allowscriptaccess="always" allowfullscreen="true" width="480" height="385"></embed></object>');
		poopy.data("item.autocomplete", item);
		
		if (item.label!='----') {
			poopy.append("<a href=\"#agenda/"+url+"\">" + htmlentities(item.label) + "</a>");
		}
		//.append("<a>" + item.label + "<br>" + item.desc + "</a>")
		//.append('<object width="480" height="385"><param name="movie" value="http://www.youtube.com/v/hMtZfW2z9dw?fs=1&amp;hl=en_US"></param><param name="allowFullScreen" value="true"></param><param name="allowscriptaccess" value="always"></param><embed src="http://www.youtube.com/v/hMtZfW2z9dw?fs=1&amp;hl=en_US" type="application/x-shockwave-flash" allowscriptaccess="always" allowfullscreen="true" width="480" height="385"></embed></object>')
		poopy.appendTo(ul);
		return poopy;
		//<li class="ui-existing">Existing items</li>				
	};
	
	$('input#new-entry').bind("keydown.autocomplete", function(event) {
		//alert('tuki');
		//return;
		/*		
		if (self.options.disabled) {
			return;
		}
		*/
		var keyCode = $.ui.keyCode;
		switch(event.keyCode) {
		case keyCode.DOWN:
			if ($('#new-entry').val() == '') $(this).blur();
			break;
		case keyCode.ENTER:
		case keyCode.NUMPAD_ENTER:
			var autoc = $('input#new-entry').data("autocomplete");
			if (empty(autoc.selectedItem)) {
				mmUI.addFuzz();
				event.preventDefault();
			} else if (!empty(autoc.selectedItem.id)) {
				//event.prevent
				location.href="#agenda/?entryid="+autoc.selectedItem.id;
			}
			
			//$('awesome-bar').submit();
			// when menu is open or has focus
			/*
			if (self.menu.element.is(":visible")) {
			}
			*/
			//passthrough - ENTER and TAB both select the current element
			break;
		}
	});
	
	/*
	$('input#new-entry').focusout(function(e) {
		e.preventDefault();
		var entryText = $('input #new-entry').val();
		if (entryText != "")
			$(this).css('color', '#4b5259');
	});
	*/
	
	$('input#new-entry').focus();
	mmUI.updateAwesomeBarSource();
}

mmUI.awesomeBarUpdate = function(event, ui) {}

// S1E: Probably called from ui event bindings, belongs to relevant views
// util ui
mmUI.toggleLimit = function(which) {
	if (which=='aim') {
		var val = mmUI.toggleUIParameter(which+'_limit'); 
		mmUI.updateAims();
	} else {
		which = 'entry';
		var val = mmUI.toggleUIParameter(which+'_limit'); 
		mmUI.updateEntries();
	}
}

// geo map view and behaviour
mmUI.updateMap = function(lat, lon, zoom, highlight) {
	var cont = "";
	highlight = mmUI.mapDefinePoint;
	
	if (typeof google === 'undefined') {// || mmUI.loaded['mapapi'] != true) {
		if (mmUI.mapLoadingRequested != null) return;
		mmUI.mapLoadingRequested = true;
		if (!empty(lat)) {
			mmUI.clat = lat;
			mmUI.clon = lon;
			mmUI.highlight = highlight;
		}
		var script = document.createElement("script");
		script.type = "text/javascript";
		script.src = "http://maps.google.com/maps/api/js?sensor=false&key=ABQIAAAAAELjjyzaA3hVbTTJMxZ9dRSm8y5sGFi4czMlZk1FjGDzA-wtQhRiVw2tzug_GC86u8k-TpvHoJxShQ&callback=mmUI.initializeMap";
		document.body.appendChild(script);
		return;
	} else mmUI.loaded['mapapi'] = true;
	
	if (empty(lat)) lat = mmUI.clat;
	if (empty(lon)) lon = mmUI.clon;
	if (empty(zoom)) zoom = 12;
	
	var latlng = null;
	if (!empty(lat)) latlng = new google.maps.LatLng(lat, lon);
	
	// S1E: Local varibales defined on the global scope (without var). Check for same mistake elsewhere
	if (empty(mmUI.map)) {
		blueIcon = new google.maps.MarkerImage("http://www.google.com/intl/en_us/mapfiles/ms/micons/blue-dot.png");
		//EX ##dr currentPositionIcon = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter_withshadow&chld=C|af8&ext=.png");
		currentPositionIcon = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=C|af8&ext=.png");
		
		var myOptions = {
			'zoom': 14
		}
		if (!empty(latlng)) myOptions['center'] = latlng;
		myOptions['mapTypeId'] = google.maps.MapTypeId.HYBRID;
		
		mmUI.map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
		
		mmUI.geocoder = new google.maps.Geocoder();
		
		mmUI.infowindow = new google.maps.InfoWindow({ 
			content: '<br/><br/><br/><br/><br/><br/><br/><br/>'
		});
		
		mmUI.currentmarker = new google.maps.Marker({
			position: latlng,
			map: mmUI.map,
			icon: blueIcon,
			title: 'define a location',
			visible: false
		});
		
		var clatlng = latlng;
		if (!empty(mmUI.geo) && !empty(mmUI.geo['lat'])) {
			clatlng = new google.maps.LatLng(mmUI.geo['lat'], mmUI.geo['lon']);
		}
		mmUI.currentpositionmarker = new google.maps.Marker({
			position: clatlng,
			map: mmUI.map,
			icon: currentPositionIcon,
			title: 'Current Position'
		});

		mmUI.loaded['map'] = true;
		
		//mmUI.currentinfowindow.open(map,mmUI.currentmarker);

		/** also triggered when clicking on the map */
		google.maps.event.addListener(mmUI.currentmarker, 'click', function(event) {
			mmUI.infowindow.close();
			var highlocation = null;
			var highlight = mmUI.mapDefinePoint;
			
			//##
			//## pa to je neki sumljivo? ##d
			//## preglej to kodo!
			//##
			var ungrounded = '';
			var aUngrounded = [];
			for (var i in mmUI.locations) {
				if (!empty(highlight) && mmUI.locations[i].id==highlight) highlocation = mmUI.locations[i];
				if (empty(mmUI.locations[i].lat)) {
					if (ungrounded!='') ungrounded += ', ';
					ungrounded += ' '+mmUI.locations[i].name;
					aUngrounded.push(mmUI.locations[i].name);
				}
			}
			
			/*
			 * DEFINE NEW LOCATION
			 */
			/*cont = 'define this location<br/>';
			cont += '<form action="javascript:return false;" onsubmit="' + (empty(highlocation) ? 'return mmUI.saveCurrentMarkerGeoLocationSelected();' : 'return mmUI.saveCurrentMarkerGeoLocationSelected(true);')+' return false;">';
			cont += '<table>';
			cont += '<tr>';
			cont += '<td>name:</td><td><input name="name" id="currentmarkername" type="text" value="'+(empty(highlocation)?'':highlocation.name)+'"></td>';
			cont += '</tr>';
			cont += '<tr>';
			cont += '<td>tags:</td><td><input name="tags" id="currentmarkertags" type="text"></td>';
			cont += '</tr>';
			cont += '<tr>';
			cont += '<td colspan="2"><input type="submit" value="Add location"></td>';
			cont += '</tr>';
			//cont += '<input type="hidden" name="currentmarkerid" value="' + (empty(highlocation) ? '' : highlocation.id) + '">';
			cont += '</form>';
			cont += '<br/>';*/
			
			/*
			* EX##dr OLD CODE FOR DEFINE NEW LOCATION
			*/
			var cont = 'define this location<br/>';
			cont += '<form action="javascript:return false;" onsubmit="return mmUI.saveCurrentMarkerGeoLocationSelected(); return false;">';
			cont += 'name: <input name="name" id="currentmarkername" type="text" value="'+(empty(highlocation)?'':highlocation.name)+'"><br/>';
			cont += 'tags: <input name="tags" id="currentmarkertags" type="text"><br/>';
			cont += '<input type="submit" value="Add location">';
			cont += '</form><br/>';
			
			if (!empty(highlocation)) {
				cont = 'define this location<br/>name: <input name="name" id="currentmarkername" type="text" value="'+(empty(highlocation)?'':highlocation.name)+'"><br/>tags: <input name="tags" id="currentmarkertags" type="text"><br/><input type="button" onclick="mmUI.saveCurrentMarkerGeoLocationSelected(true); return false;" value="Save location"><br/>';
				cont += '<input type="hidden" name="currentmarkerid" value="'+highlocation.id+'">';
				//if (document.documentElement.clientHeight-400 < .offsetTop)) 
						//{
							//alert('scrolling');
							//$('section#'+hr).scroll();
				//window.scrollTo(0,$('#map_canvas').offsetTop-4);
				//$('#map_canvas').scrollTo();
			}	
			
			//if (ungrounded!='') cont += 'ungrounded: '+ungrounded;
			mmUI.infowindow.close();
			mmUI.infowindow.setContent(cont);
			mmUI.infowindow.open(mmUI.map,mmUI.currentmarker);			
			$("#currentmarkername").autocomplete({
				minLength: 0,
				delay: 0,
				source: aUngrounded
			});
			$("#currentmarkertags").autocomplete({
				minLength: 0,
				delay: 0,
				source: mmUI.allTags['#']
			});
			setTimeout("$('input#currentmarkername').trigger('focus')",200);
			//$('#currentmarkername').trigger('focus');
			//$('#currentmarkername').focus();

		});
				
		google.maps.event.addListener(mmUI.currentpositionmarker, 'click', function(event) {
			mmUI.infowindow.close();
			
			//FIX THIS
			var cont = '<i>Your current location</i><br/><br/>Define this location<br/><form action="javascript:return false;" onsubmit="return mmUI.saveCurrentMarkerGeoLocationCurrent(false); return false;">name: <input name="name" id="currentmarkername" type="text" value=""><br/>tags: <input name="tags" id="currentmarkertags" type="text"><br/><input type="submit" value="Add location"></form><br/>';
			
			mmUI.infowindow.setContent(cont);
			mmUI.infowindow.open(mmUI.map,mmUI.currentpositionmarker);
		});
				
		google.maps.event.addListener(mmUI.map, 'click', function(event) {
			mmUI.infowindow.close();
			mmUI.currentmarker.setVisible(true);
			mmUI.currentmarker.setPosition(event.latLng);
			google.maps.event.trigger(mmUI.currentmarker,'click');
		});
	} else {
		if (!empty(mmUI.param.location) && !empty(mmUI.locations)) {
			for (it=0; it<mmUI.locations.length; it++) {
				if (mmUI.locations[it].id == mmUI.param.location) {
					var location = mmUI.locations[it];
					if (!empty(location.lat)) {
						var cont = mmUI._getMarkerInfoHTML(location);
						/*
						mmUI.locations[it].infowindow.setContent(cont);
						mmUI.locations[it].infowindow.open(map,mmUI.locations[it].marker);
						*/
						mmUI.infowindow.close();
						mmUI.infowindow.setContent(cont);
						mmUI.infowindow.open(mmUI.map,location.marker);
						if (mmUI.debug>0) console.log('map.setcenterloc',location.marker.getPosition());
						mmUI.map.setCenter(location.marker.getPosition());
						return;
					}
				}
			}
		}
		if (empty(latlng) || isNaN(latlng.lat())) return;
		if (mmUI.debug>0) console.log('map.setcenter',latlng);
		//window.scrollTo(0,$('#map_canvas').offsetTop-4);
		mmUI.map.setCenter(latlng);
	}

	/* if (mmUI.locations==null) mmUI.getGeo(highlight);//update locations after getting them... in another thread
	else mmUI.updateLocations(highlight); */
	mmUI.getGeo(highlight); //update locations after getting them... in another thread
	mmUI.updateLocations(highlight);
}

// geo helper, map view
mmUI.geoResolveAddress = function() {
	//event.preventDefault();
	mmUI.geocoder.geocode({ 'address': $('#geocode').val()}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			mmUI.map.setCenter(results[0].geometry.location);
			mmUI.currentmarker.setPosition(results[0].geometry.location);
			google.maps.event.trigger(mmUI.currentmarker,'click');
			if (mmUI.mapDefinePoint == null) {
				//$('#currentmarkername').val(results[0].formatted_address);
				$('#currentmarkername').val('');
				//$('#currentmarkername').focus();
			}
			setTimeout("$('input#currentmarkername').trigger('focus')",100);
			//mmUI.
		} else {
			//alert("Geocode was not successful for the following reason: " + status);
		}
	});
	return false;
}

// geo view helper
mmUI.initializeMap = function() {
	var param = mmUI.param;
	if (mmUI.debug>0) console.log('initializing map');

	var zoom = (empty(param.zoom) ? 10 : param.zoom);
	
	//EX##drazen
	//mmUI.updateMap(param.lat,param.lon,zoom,mmUI.mapDefinePoint);
	
	//##drazen: samo če param obstaja - v param se pošiljajo podatki za "future" ali "selected" location
	if (empty(param.lat)) {
		mmUI.getCurrentGeo();
	} else {
		mmUI.updateMap(param.lat,param.lon,zoom,mmUI.mapDefinePoint);
		//mmUI.updateMap(param.lat,param.lon,zoom,param.location);//one time yo TODO
	}

	$('#locationcontent').fadeIn('fast');//oyvey...
	
	//mmUI.updateMap();
	//if (mmUI.loaded['geolocations'] != true) mmUI.getGeo();
}

// S1E: Main 'router' function
// app routing, view ui animation, geolocation - persistence - update request, calendar, view callbacks
mmUI.setupUI = function () {
	if (mmUI.isUserLoggedIn() && window.location.hash=='') // url is empty... what if its plain wrong? handle in } else { case lower
	{
		window.location = '#agenda/';
		return;
	}
	mmUI.loaded['ui'] = true;
	$('#loginform').hide();
	$('#content').fadeOut('fast');
	$('#schedulecontent').fadeOut('fast');
	$('#locationcontent').fadeOut('fast');
	$('#meanxyContent').fadeOut('fast');
	$('#chartsContent').fadeOut('fast');
	$('#manurelContent').fadeOut('fast');
	//$('#importcontent').fadeOut('fast');
	$('#padcontent').fadeOut('fast');
	$('#settingscontent').fadeOut('fast');
	
	//alert(window.location.hash);
	mmUI.param = {};
	var urlall = window.location.hash.split('?');
	var url = window.location.hash;
	if (empty(urlall[0])) {
	} else {
		url = urlall[0];
		if (!empty(urlall[1])) {
			parall = urlall[1].split('#');
			var paramhash = parall[1];
			params = parall[0].split('&');
			for(var i in params) {
				var pr = params[i].split('=');
				mmUI.param[pr[0]] = pr[1];
			}
		}
	}
	var param = mmUI.param;

	if (!empty(param['user']))  {
		$('#form_username').val(param['user']);
		if (!empty(param['pass'])) $('#form_password').val(param['pass']);
		if (!empty(param['server'])) $('#server').val(param['server']);
		setTimeout('$("#loginfrm").submit();',100);
	}
	
	if (url == '#logout/') {
		mmUI.logout();
		return;
	}

	if (!mmUI.isUserLoggedIn()) {
		if (url!='#login/') {
			location.href = '#login/';
			return;
		}
		$('#appfooter').hide();
		$('#usersname').html('');
		$('#navigation').hide();
		$('#content').hide();
		$('#loginform').fadeIn('fast');
		if (document.domain!='peek.middlemachine.com') {
			$('#loginservers').fadeIn('fast');
		} else {
			mmUI.debug = 0;
		}
		$('#form_username').focus();
		//$('#loginform').css('display', '');
		mmUI.checkForUpdate();	
		
	} else {
		var cstamp = new Date().getTime();
		if (	mmUI.lastGeoUpdate == null || mmUI.lastGeoUpdate + 60 < cstamp)  {

			try {
				if (!navigator.geolocation) { 
					//alert('Get Firefox 3.5+ and enable geolocation sharing.'); 
				} else {
					
					navigator.geolocation.getCurrentPosition(function(position) {
						url = "<%=url%>&lat="+position.coords.latitude
							+"&lon="+position.coords.longitude
							+"&acc="+position.coords.accuracy
							+"&hi="+position.coords.altitude
							+"&hia="+position.coords.altitudeAccuracy
							+"&hd="+position.coords.heading
							+"&spd="+position.coords.speed
							+"&t="+position.timestamp
							;
							
						mmUI.geo = new Array();
						mmUI.geo['lat'] = position.coords.latitude;
						mmUI.geo['lon'] = position.coords.longitude;
						mmUI.geo['acc'] = position.coords.accuracy;
						mmUI.geo['hi'] = position.coords.altitude;
						mmUI.geo['hia'] = position.coords.altitudeAccuracy;
						mmUI.geo['hd'] = position.coords.heading;
						mmUI.geo['spd'] = position.coords.speed;
						mmUI.geo['t'] = position.coords.timestamp;

						if (!empty(mmUI.currentpositionmarker)) {
							var clatlng = new google.maps.LatLng(mmUI.geo['lat'], mmUI.geo['lon']);
							mmUI.currentpositionmarker.setPosition(clatlng);
						}
						//alert(url); //redirect
						JSONPCall('geo','&set=&lat='+mmUI.geo['lat']+'&lon='+mmUI.geo['lon'],null,null,'saving:setting geo');
						//$.getJSON(mmUI.apiurl+'/BTW/geo/'+mmUI.account+'?access_token='+mmUI.access_token+'&set=true&lat='+mmUI.geo['lat']+'&lon='+mmUI.geo['lon']+'&json_callback=?', function(dataall) {	});
					});
				}
			} catch (exception) {
				// S1E: Handle exception
			}
		}

		$('#usersname').html(empty(mmUI.username) ? mmUI.account : mmUI.username);
		
		$('#navigation').fadeIn('fast');	

		$('#primary >li').each(function(i,el) {$(el).removeClass("selected")});
		
		$('#appfooter').fadeIn('fast');
		
		if (url == '#meanxy/') {
			$('#meanxyLink').addClass("selected");
			$('#meanxyContent').fadeIn("fast");			
		} else if (url == '#charts/') {
			$('#chartsLink').addClass("selected");
			$('#chartsContent').fadeIn("fast");			
		} else if (url == '#manurel/') {
			$('#manurelLink').addClass("selected");
			$('#manurelContent').fadeIn("fast");
		} else if (url == '#schedule/') {
			$('#schedulelink').addClass("selected");
			$('#schedulecontent').fadeIn('fast');
			
			// S1E: Code wrapped in object. Perhaps a form of temporarilly disabling or "commenting out"?
			//$(document).ready(function() 
			{
				$('#calendar').fullCalendar({
					defaultView:'agendaWeek',
					theme:true,
					editable: true,
					axisFormat:'HH:mm',
					slotMinutes:45,
					allDayDefault:false,
					height:$(window).height()-20,
					timeFormat:'HH:mm',
					firstDay:1,
							
					/*
						<%if (date!=null) {%>//start date from session (see above)
							date:sdate.getDate(),
							month:sdate.getMonth(),
							year:sdate.getFullYear(),
						<%}%>
					*/
					editable: true,
					
					events: "",
					
					eventDrop: function(event, delta) {
						alert(event.title + ' was moved ' + delta + ' days\n' +
							'(should probably update your database)');
					},
					
					loading: function(bool) {
						if (bool) $('#loading').show();
						else $('#loading').hide();
					}
				});
			}			
		} else if (url == '#locations/') {
			$('#locationlink').addClass("selected");
			
			mmUI.mapDefinePoint = param.define;
			if (typeof google === 'undefined') {
				if (mmUI.mapLoadingRequested != null) return;
				mmUI.mapLoadingRequested = true;
				var script = document.createElement("script");
				script.type = "text/javascript";
				script.src = "http://maps.google.com/maps/api/js?sensor=false&callback=mmUI.initializeMap";
				document.body.appendChild(script);
				//return;
			} else {
				mmUI.initializeMap();
			}
		} else if (url == '#pad/') {
			$('#padlink').addClass("selected");
			$('#padcontent').fadeIn('fast');
			mmUI.updatePad();
		} 		
		else if (url == '#settings/') {
			$('#settingscontent').fadeIn('fast');
			
			$('.settings-tabs-navi>li>a').click(function(e) {
				e.preventDefault();
				
				var href = $(this).attr('href');
				$('.settings-tab').hide();
				$(href).show();
				$('.settings-tabs-navi>li').removeClass('main-tabs-active');
					$(this).parent('li').addClass('main-tabs-active');
				
				if (href == "#account-settings")
					mmUI.getAccountSettings();
				else if (href == "#reminders-settings")
					mmUI.getRemindersSettings();
				else if (href == "#services-settings")
					mmUI.getServicesSettings();
				else if (href == "#entities-settings")
					mmUI.getEntitiesSettings();
				else if (href == "#sharing-settings")
					mmUI.getSharingSettings();
				else if (href == "#dataimport-settings")
					mmUI.getImportSettings();
			});
			
			$('.settings-tabs-navi>li>a[href=#account-settings]').click();
		} else if (url == '#agenda/') {
			$('#agendalink').addClass("selected");
			var search = null;
			var entryid = null
			//alert(param['search']);
			if (!empty(param['search'])) search = param['search'];
			
			mmUI.updateEntries(entryid, null, search);
			mmUI.updateAims();
			mmUI.updateContacts();
			mmUI.updateNearLocs();
			//TODO CHECK mmUI.updateCookie();
			$('#content').fadeIn('fast');
		} else {
			location.href='#agenda/';
		}
		if (empty(mmUI.allTags)) {
			setTimeout('mmUI.setupAwesomeBar()',500);
		}
		//$('#appfooter').fadeIn('fast');
		//TODO upper (async) functions check if we are logged in, if we timedout dont run this
		
		// input Placeholder
		if (!isAtributeSupported('input','placeholder')) {
			$('input').each(
				function() {
					if ($(this).val()=='' && $(this).attr('placeholder')!='') {
						$(this).focus(function() {if ($(this).val()==$(this).attr('placeholder')) $(this).val('');});
						$(this).blur(function() {if ($(this).val()=='') $(this).val($(this).attr('placeholder'));});
						$(this).val($(this).attr('placeholder'));
					}
				}
			);
		}
	}
	$('#uiver').html(mmUI.uiver);
}

// app init
mmUI.onLoad = function(event) {
	mmUI.loadCookie();
	//alert(cookie);
	
	// S1E: This forwards auth and config data to all iframes, should be extracted
	$(".embeddable iframe").each(function (index, iframe) {
		if (mmUI.apiurl) {
			var apiurl = mmUI.apiurl.substr(7, mmUI.apiurl.length)
			var port = ""
			if (apiurl.indexOf(":") != -1) {
				port = apiurl.substr(apiurl.indexOf(":") + 1, apiurl.length)
				apiurl = apiurl.substr(0, apiurl.indexOf(":"))
			}
			iframe.src = iframe.getAttribute("data-src") + "?access_token=" + mmUI.access_token + "&user=" + mmUI.account + "&server=" + escape(apiurl) + "&port=" + escape(port)
		}
	})

	$.editableFactory = {
		'text': {
			toEditable: function($this,options) {
				//$this.append('<input value="'+$this.data('editable.current')+'"/> <p style="padding:2px;"><span onclick="" class="editableapply">APPLY</span> <span onclick="" class="editablecancel">CANCEL</span></p>');
				$this.append('<input value="'+$this.data('editable.current')+'" class="editableinput" onclick="javascript:return false;"/>').bind('keydown', function(event) {
					var keyCode = $.ui.keyCode;
					switch(event.keyCode) {
					case keyCode.TAB:
					case keyCode.ENTER:
					case keyCode.NUMPAD_ENTER:
						//alert('ffs');
						var tr = $(this);
						var t = $(this).data('editable.options');
						t.toNonEditable($this,true);
					default:
					}
				});
				//return $this;
			},

			getValue: function($this,options) {
				return $this.children().val();
			}
		},
		'location': {
			
			toEditable: function($this,options) {
				//$this.append('<input value="'+$this.data('editable.current')+'"/> <p style="padding:2px;"><span onclick="" class="editableapply">APPLY</span> <span onclick="" class="editablecancel">CANCEL</span></p>');
				$this.append('<input id="" value="'+$this.data('editable.current')+'" class="editableinput"/>').bind('keydown', function(event) {
					var keyCode = $.ui.keyCode;
					switch(event.keyCode) {
					case keyCode.TAB:
					case keyCode.ENTER:
					case keyCode.NUMPAD_ENTER:
						//alert('ffs');
						var tr = $(this);
						$(this).children('input').data("autocomplete").destroy();
						var t = $(this).data('editable.options');
						t.toNonEditable($this,true);
					default:
					}
				});
				$this.children('input').autocomplete({
					delay:0,
					minLength:0,
					source: mmUI.allTags['@']
				});

				return $this;
			},
			onEdit: function() {
				$this.append('Enter location name or <a href="">find on map</a>');
			},

			getValue: function($this,options) {
				return $this.children().val();
			}
		},
		'title': {
			
			toEditable: function($this,options) {
				//$this.append('<input value="'+$this.data('editable.current')+'"/> <p style="padding:2px;"><span onclick="" class="editableapply">APPLY</span> <span onclick="" class="editablecancel">CANCEL</span></p>');
				//$this.append('<input id=""value="'+$this.data('editable.current')+'" class="editableinput" />');
				//$this.append('<input id="" value="'+$this.data('editable.current')+'" class="editableinputtitle" />')
				//$this.append('<textarea class="editableinputtitle">'+$this.data('editable.current')+'</textarea>')
				$this.append('<textarea rows="7">'+$this.data('editable.current')+'</textarea>')
				.bind('keydown', function(event) {
					var keyCode = $.ui.keyCode;
					switch(event.keyCode) {
						case keyCode.TAB:
						case keyCode.ENTER:
						case keyCode.NUMPAD_ENTER:
							//alert('ffs');
							var t = $(this).data('editable.options');
							t.toNonEditable($this,true);
						default:
					}
					//}).bind('click', function(event) {
					//var t = $(this).data('editable.options');
					//t.toNonEditable($this,true);
					//event.preventDefault();
				});
				//onclick="javascript:$(this).parent().cancel();"
				// 				$this.children('input').autocomplete({
				// 					delay:0,
				// 					minlength:0,
				// 					source: mmui.alltags['none']
				// 				});

				return $this;
			},
				// 			onEdit: function() {
				// 				$this.append('Enter location name or <a href="">find on map</a>');
				// 			},

			getValue: function($this,options) {
				return $this.find('textarea').val();
			},
			submitBy: 'blur',
		},
		'textarea': {
			
			toEditable: function($this,options) {
				var str = new String($this.data('editable.current'));
				var len = str.length;
				var rows = 5;
				if (len>300) rows = 10;
				if (len>600) rows = 15;
				if (len>1000) rows = 25;
				if (len>1500) rows = 35;
				//$this.append('<input value="'+$this.data('editable.current')+'"/> <p style="padding:2px;"><span onclick="" class="editableapply">APPLY</span> <span onclick="" class="editablecancel">CANCEL</span></p>');
				$this.append('<textarea class="editableinput" onclick="javascript:return false;" rows="'+rows+'">'+$this.data('editable.current')+'</textarea>');
				//return $this;
			},

			getValue: function($this,options) {
				return $this.children().val();
			}
		},
	} 
	
	//TODO mmUI.checkForUpdate();
	$("article>img").lazyload({
		//placeholder : "img/grey.gif", 
		//event : "sporty"
		effect : "fadeIn"
	});

	
	window.onhashchange = function() {
		//if (!empty(mmUI.access_token))
		mmUI.setupUI();
	}
	
	/*
	if (!empty(mmUI.apiurl)) {
		$.getJSON(mmUI.apiurl+'/BTW/appdata/'+mmUI.account+'?access_token='+mmUI.access_token+'&json_callback=?', function(dataall) {
			mmUI.setUIObject('appdata', dataall['workflow']);		
			mmUI.setupUI(); // SETUP UI
		});
	} else {
		mmUI.setupUI(); // SETUP UI
	}
	*/
	
	mmUI.setupUI()

	if (!empty(mmUI.apiurl)) {
		// S1E: Geolocation code duplication. Extract to function
		try {
			if (!navigator.geolocation) { 
				//alert('Get Firefox 3.5+ and enable geolocation sharing.'); 
			} else {
				
				navigator.geolocation.getCurrentPosition(function(position) {
					url = "<%=url%>&lat="+position.coords.latitude
						+"&lon="+position.coords.longitude
						+"&acc="+position.coords.accuracy
						+"&hi="+position.coords.altitude
						+"&hia="+position.coords.altitudeAccuracy
						+"&hd="+position.coords.heading
						+"&spd="+position.coords.speed
						+"&t="+position.timestamp
						;
						
					mmUI.geo = new Array();
					mmUI.geo['lat'] = position.coords.latitude;
					mmUI.geo['lon'] = position.coords.longitude;
					mmUI.geo['acc'] = position.coords.accuracy;
					mmUI.geo['hi'] = position.coords.altitude;
					mmUI.geo['hia'] = position.coords.altitudeAccuracy;
					mmUI.geo['hd'] = position.coords.heading;
					mmUI.geo['spd'] = position.coords.speed;
					mmUI.geo['t'] = position.coords.timestamp;

					if (!empty(mmUI.currentpositionmarker)) {
						var clatlng = new google.maps.LatLng(mmUI.geo['lat'], mmUI.geo['lon']);
						mmUI.currentpositionmarker.setPosition(clatlng);
					}
					//alert(url); //redirect
					JSONPCall('geo','&set=&lat='+mmUI.geo['lat']+'&lon='+mmUI.geo['lon'],null,null,'saving:setting geo');
					//$.getJSON(mmUI.apiurl+'/BTW/geo/'+mmUI.account+'?access_token='+mmUI.access_token+'&set=true&lat='+mmUI.geo['lat']+'&lon='+mmUI.geo['lon']+'&json_callback=?', function(dataall) {	});
				});
			}
		} catch (exception) {
			// S1E: Handle exception
		}
	}

	$('body').click(function() {
		var menus = $('menu.respond:visible').each(function(i,m) {
			$(this).fadeOut(20);
			$(this).removeClass('locked');
		});
		enableDnD();
	});

	// S1E: Code that never happens. Staged or obsolete?
	if (0) {
		$('body').mouseup(function() {
			var menus = $('menu.respond:visible').each(function(i,m) {
			
				//if ($(m).is(':visible')) 
				{
						//TODO dont just handle the mouseup, the user has to be able to cancel by clicking somewhere else
						$(m).fadeOut(50);
						//t.removeClass('locked');
						//tell server what happened
				}
			});
			enableDnD();
		});
	}
	
	//mmUI.debug=2;
	//if (empty(mmUI.loaded['ui'])) mmUI.setupUI();
	mmUI.updateCurrentRequestInfo();
}

$(document).ready(mmUI.onLoad)

