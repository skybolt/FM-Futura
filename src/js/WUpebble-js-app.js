/*jshint smarttabs:true*/

var day1_temp, day1_cond, day2_temp, day2_cond, day3_temp, day3_cond, day4_temp, day4_cond, day4_info, day5_temp, day5_cond, day5_info, sunrise, sunset, current_time;

var day1_high, day2_low;


var updateInProgress = false;

var setPebbleToken = 'JUCP'; //    'XPGE'; 'JUCP is FM Forecast, XPGE is WU Forecast

// //mine  //settings Key  http://setpebble.com/api/8BES
//console.log("substance, setpebble token " + setPebbleToken + " for app v. 2.5.1");
//console.log("request.open( http://x.SetPebble.com/api/" + setPebbleToken + '/' + Pebble.getAccountToken());
//Pebble.addEventListener('ready', function(e) {
//});
var debug_flag = 0;
var m = 1;
var n = 0;
var day;
var provider_flag = 1;
//var tempFlag = 7; //0F, 1C, 2K, 3Ra, 4Re, 5Ro, 6N, 7De
var offset = new Date().getTimezoneOffset() / 60;

var icon;  //= iconFromWeatherId(response.weather[0].id);
var temp;  //= tempGetter(response.main.temp) + getTempLabel();
var high;  //= tempGetter(response.main.temp_max) + getTempLabel();
var day1_high = 0;
var day2_low = 0;
var low;  //= tempGetter(response.main.temp_min) + getTempLabel();
var conditions;  //= response.weather[0].main;
var baro;  //= pressureGetter(response.main.pressure * 0.0295301);
var timestamp; //= response.dt - (offset * 3600);

//localStorage.removeItem("tempFlag");
var tempFlag = parseInt(localStorage.getItem("tempFlag"));
if (debug_flag > 1) {
    console.log("tempFlag found, " + tempFlag);
    console.log("tempFlag without parseInt " + localStorage.getItem("tempFlag"));
}
if (tempFlag !== 0) {
    if (!tempFlag) {
        var tempFlag = 0; //0F, 1C, 2K, 3Ra, 4Re, 5Ro, 6N, 7De
        if (debug_flag > 1) {
            console.log("tempFlag not found, set to " + tempFlag);
        }
    }
}
//debug_flag = 4;
if (debug_flag > 1) {
	console.log("resulting tempFlag, " + tempFlag);
}


/*NEXT SECTION IS FOR WEATHER UNDERGROUND*/

function fetchWeatherUndergroundConditions(latitude, longitude) { // gets day 1
	var ownName = arguments.callee.toString();
	ownName = ownName.substr('function '.length);        // trim off "function "
	ownName = ownName.substr(0, ownName.indexOf('('));        // trim off everything after the function name
	if (debug_flag > 1) {
        console.log("FUNCTION NAME = " + ownName);
	}
    
	var tt = new Date();
	if (debug_flag > 3) {
        console.log("new Date =" + tt);
	}
    var req = new XMLHttpRequest();
	req.open("GET", "http://api.wunderground.com/api/d33637904b0a944c/conditions/geolookup/q/" + latitude + "," + longitude + ".json", true);
    if (debug_flag > 2) {
	    console.log("Weather Underground app key request!! d33637904b0a944c");
	    console.log("http://api.wunderground.com/api/d33637904b0a944c/conditions/geolookup/q/" + latitude + "," + longitude + ".json");
        
    }
	
	req.onload = function(e) {
		if (req.readyState == 4) {
			if (req.status == 200) {
				var response = JSON.parse(req.responseText);
				if (debug_flag > 2) {
                    console.log("req.responseText.length = " + req.responseText.length);
				}
                
				if (req.responseText.length > 0) {
                    
                    day = 0;
					
                    if (debug_flag > 1) {
                        console.log("n " + n + " (array), m " + m + " (base), day = " + day);
                    }
					day1_cond = iconFromWeatherString(response.current_observation.icon);
					day1_temp = tempGetter(response.current_observation.temp_c + 273.15);
                    
                    if (debug_flag > 0) {
                        console.log("\n call inside of " + ownName +
                                    "\nday1 temp " + day1_temp + " day1 cond " + day1_cond +
                                    "\nday2 temp " + day2_temp + " day2 cond " + day2_cond +
                                    "\nday3 temp " + day3_temp + " day3 cond " + day3_cond +
                                    "\nday4 temp " + day4_temp + " day4 cond " + day4_cond + " day4_ifno " + day4_info +
                                    "\nday5 temp " + day5_temp + " day5 temp " + day5_cond + " day5_info " + day5_info +
                                    "\nSunrise: " + sunrise +
                                    "\nSunset: " + sunset +
                                    "\ncurrent_time: " + current_time);
                    }
                    
					fetchWeatherUndergroundTodayForecast(latitude, longitude);
                    
                } else {console.log("fail responseText.lenght > 100 -" + ownName);}
            } else {console.log("fail 200: " + ownName);}
        } else {console.log("fail readyState == 4 " + ownName);}
    };
    req.send(null);
}

function fetchWeatherUndergroundTodayForecast(latitude, longitude) { // gets day 1, 2 in section URL hourly
	var ownName = arguments.callee.toString();
	ownName = ownName.substr('function '.length);        // trim off "function "
	ownName = ownName.substr(0, ownName.indexOf('('));        // trim off everything after the function name
    //debug_flag = 4;
	if (debug_flag > 1) {
        console.log("FUNCTION NAME = " + ownName);
	}
	
    var response;
    var req = new XMLHttpRequest();
    req.open("GET", "http://api.wunderground.com/api/25604a92d894df0e/hourly/geolookup/q/" + latitude + "," + longitude + ".json", true);
    if (debug_flag > 1) {
	    console.log("Weather Underground app key request!! 25604a92d894df0e");
	    console.log("http://api.wunderground.com/api/25604a92d894df0e/hourly/geolookup/q/" + latitude + "," + longitude + ".json");
    }
    req.onload = function(e) {
        var offset = new Date().getTimezoneOffset() / 60;
        if (req.readyState == 4) {
            if (req.status == 200) {
                response = JSON.parse(req.responseText);
				if (debug_flag > 2) {
                    console.log("fetchWeatherTodayForecast req.responseText.length = " + req.responseText.length);
				}
                n = 1;
                day = 1;
                console.log("response.response.error.type " + response.response.error.type);
                if (response.response.error.type = "invalidkey"	) {
                    console.log(response.response.error.description); 
                }
                
                //                day2_cond = iconFromWeatherString(response.hourly_forecast[n].icon);
                day2_cond = iconFromWeatherString(response.hourly_forecast[n].icon);
                //day2_temp = day1_high;
                timestamp = response.hourly_forecast[n].FCTTIME.epoch;
                conditions = response.hourly_forecast[n].wx;
                if (debug_flag > 1) {
                    console.log("raw timestamp: " + timestamp);
                }
                timestamp = parseInt(timestamp) - parseInt (offset * 3600);
                if (debug_flag > 1) {
                    console.log("parseInt timestamp: " + timestamp);
                }
                
                
                n = 15;
                day = 2;
                if (debug_flag > 1) {
                    console.log("n " + n + " (array), m " + m + " (base), day = " + day);
                }
                day3_cond = iconFromWeatherString(response.hourly_forecast[n].icon);
                temp = "L: " + day2_low;
                //temp = response.hourly_forecast[n].temp.metric;
                timestamp = response.hourly_forecast[n].FCTTIME.epoch;
                conditions = response.hourly_forecast[n].wx;
                if (debug_flag > 1) {
                    console.log("raw timestamp: " + timestamp);
                }
                timestamp = parseInt(timestamp) - parseInt (offset * 3600);
                if (debug_flag > 1) {
                    console.log("parseInt timestamp: " + timestamp);
                }
                
                if (debug_flag > 0) {
                    console.log("\n call inside of " + ownName +
                                "\nday1 temp " + day1_temp + " day1 cond " + day1_cond +
                                "\nday2 temp " + day2_temp + " day2 cond " + day2_cond +
                                "\nday3 temp " + day3_temp + " day3 cond " + day3_cond +
                                "\nday4 temp " + day4_temp + " day4 cond " + day4_cond + " day4_ifno " + day4_info +
                                "\nday5 temp " + day5_temp + " day5 temp " + day5_cond + " day5_info " + day5_info +
                                "\nSunrise: " + sunrise +
                                "\nSunset: " + sunset +
                                "\ncurrent_time: " + current_time);
                }
                
                fetchWeatherUnderground3DayForecast(latitude, longitude);
                
                
                //                } else {console.log("fail responseText.lenght > 100 -" + ownName);}
            } else {console.log("fail 200: " + ownName);}
        } else {console.log("fail readyState == 4 " + ownName);}
    };
    req.send(null);
}

function fetchWeatherUnderground3DayForecast(latitude, longitude) { // gets day 3, 4, 5
	var ownName = arguments.callee.toString();
	ownName = ownName.substr('function '.length);        // trim off "function "
	ownName = ownName.substr(0, ownName.indexOf('('));        // trim off everything after the function name
	if (debug_flag > 1) {
        console.log("FUNCTION NAME = " + ownName);
	}
    
    var response;
    var req = new XMLHttpRequest();
    req.open("GET", "http://api.wunderground.com/api/6fe6c99a5d7df975/forecast/geolookup/q/" + latitude + "," + longitude + ".json", true);
    if (debug_flag > 2) {
	    console.log("Weather Underground app key request!! 6fe6c99a5d7df975");
	    console.log("http://api.wunderground.com/api/6fe6c99a5d7df975/forecast/geolookup/q/" + latitude + "," + longitude + ".json");
        
    }
    req.onload = function(e) {
        if (req.readyState == 4) {
            if (req.status == 200) {
                response = JSON.parse(req.responseText);
                if (req.responseText.length > 0) {
                    
                    day1_high = tempGetter(parseInt(response.forecast.simpleforecast.forecastday[0].high.celsius) + 273.15);
                    day2_temp = day1_high;
                    day2_low = tempGetter(parseInt(response.forecast.simpleforecast.forecastday[0].low.celsius) + 273.15);
                    day3_temp = day2_low;
                    
                    n = m -1 ;// array is day and night, in text rollup odd numbers night (contain low in temp), days (even numbers) contain high
                    day = 4;
                    if (debug_flag > 1) {
                        console.log("n " + n + " (array), m " + m + " (base), day = " + day);
                    }
                    //                    icon = iconFromWeatherString(response.forecast.simpleforecast.forecastday[n].icon);
                    day4_cond = iconFromWeatherString(response.forecast.simpleforecast.forecastday[n].icon);
                    day4_info = parseInt(response.forecast.simpleforecast.forecastday[n].date.epoch);
                    //conditions = stripper(response.forecast.simpleforecast.forecastday[n].conditions);
                    high = tempGetter(parseInt(response.forecast.simpleforecast.forecastday[n].high.celsius) + 273.15);
                    low = tempGetter(parseInt(response.forecast.simpleforecast.forecastday[n].low.celsius) + 273.15);
                    //                    temp = high + "/\n" + low + getTempLabel();
                    //                    var tempResult = response.main.temp;
                    if (response.location.country === "US") {
                        // Convert temperature to Fahrenheit if user is within the US
                        tempResult = parseInt(response.forecast.simpleforecast.forecastday[n].high.fahrenheit);
                        temperature = Math.round(tempResult);
                    }
                    else {
                        // Otherwise, convert temperature to Celsius
                        tempResult = parseInt(response.forecast.simpleforecast.forecastday[n].high.celsius);
                        temperature = Math.round(tempResult);
                    }
                    day4_temp = temperature;
                    
                    
                    n = m;
                    day = 5;
                    if (debug_flag > 1) {
                        console.log("n " + n + " (array), m " + m + " (base), day = " + day);
                    }
                    day5_cond = iconFromWeatherString(response.forecast.simpleforecast.forecastday[n].icon);
                    day5_info = parseInt(response.forecast.simpleforecast.forecastday[n].date.epoch);
                    //conditions = stripper(response.forecast.simpleforecast.forecastday[n].conditions);
                    high = tempGetter(parseInt(response.forecast.simpleforecast.forecastday[n].high.celsius) + 273.15);
                    low = tempGetter(parseInt(response.forecast.simpleforecast.forecastday[n].low.celsius) + 273.15);
                    //                temp = high + "/\n" + low + getTempLabel();
                    //                    var tempResult = response.main.temp;
                    if (response.location.country === "US") {
                        // Convert temperature to Fahrenheit if user is within the US
                        tempResult = parseInt(response.forecast.simpleforecast.forecastday[n].high.fahrenheit);
                        temperature = Math.round(tempResult);
                    }
                    else {
                        // Otherwise, convert temperature to Celsius
                        tempResult = parseInt(response.forecast.simpleforecast.forecastday[n].high.celsius);
                        temperature = Math.round(tempResult);
                    }
                    day5_temp = temperature;
                    
                    if (debug_flag > 1) {
                        console.log("\n call inside of " + ownName +
                                    "\nday1 temp " + day1_temp + " day1 cond " + day1_cond +
                                    "\nday2 temp " + day2_temp + " day2 cond " + day2_cond +
                                    "\nday3 temp " + day3_temp + " day3 cond " + day3_cond +
                                    "\nday4 temp " + day4_temp + " day4 cond " + day4_cond + " day4_ifno " + day4_info +
                                    "\nday5 temp " + day5_temp + " day5 temp " + day5_cond + " day5_info " + day5_info +
                                    "\nSunrise: " + sunrise +
                                    "\nSunset: " + sunset +
                                    "\ncurrent_time: " + current_time);
                    }
                    
                    fetchSunriseSunset(latitude, longitude);
                    
                } else {console.log("fail responseText.lenght > 100 -" + ownName);}
            } else {console.log("fail 200: " + ownName);}
        } else {console.log("fail readyState == 4 " + ownName);}
    };
    req.send(null);
}

function fetchSunriseSunset(latitude, longitude) {
	var ownName = arguments.callee.toString();
	ownName = ownName.substr('function '.length);        // trim off "function "
	ownName = ownName.substr(0, ownName.indexOf('('));        // trim off everything after the function name
	if (debug_flag > 1) {
        console.log("FUNCTION NAME = " + ownName);
	}
    var response;
    var req = new XMLHttpRequest();
    req.open("GET", "http://api.openweathermap.org/data/2.5/weather?" + "lat=" + latitude + "&lon=" + longitude + "&cnt=2", true);
    if (debug_flag > 1) {
        console.log("http://api.openweathermap.org/data/2.5/weather?" + "lat=" + latitude + "&lon=" + longitude + "&cnt=2");
    }
    req.onload = function(e) {
        var offset = new Date().getTimezoneOffset() / 60;
        if (req.readyState == 4) {
            if (req.status == 200) {
                response = JSON.parse(req.responseText);
                if (debug_flag > 4) {
                    console.log("req.responseText.lenght = " + req.responseText.length);
                    console.log("fetchSunriseSunset response = \n" + req.responseText);
                }
                if (req.responseText.length > 100) {
                    var location = response.name;
                    //location = "Kingdom of Los Angeles America";
                    
                    
                    var offset = new Date().getTimezoneOffset() * 60;
                    current_time = ((Date.now()  / 1000)- offset) % 86400;
                    
                    var sunrise = response.sys.sunrise;
                    sunrise = (parseInt(sunrise) - offset) % 86400;
                    var sunset = response.sys.sunset;
                    sunset = (parseInt(sunset) - offset) % 86400;
                    
                    if (debug_flag > 0) {
                        console.log("\n call inside of " + ownName +
                                    "\nday1 temp " + day1_temp + " day1 cond " + day1_cond +
                                    "\nday2 temp " + day2_temp + " day2 cond " + day2_cond +
                                    "\nday3 temp " + day3_temp + " day3 cond " + day3_cond +
                                    "\nday4 temp " + day4_temp + " day4 cond " + day4_cond + " day4_ifno " + day4_info +
                                    "\nday5 temp " + day5_temp + " day5 temp " + day5_cond + " day5_info " + day5_info +
                                    "\nSunrise: " + sunrise +
                                    "\nSunset: " + sunset +
                                    "\ncurrent_time: " + current_time);
                    }
                    
                    console.log("calling SendItBaby" + day1_temp + day1_cond + day2_temp + day2_cond + day3_temp + day3_cond + day4_temp + day4_cond + day4_info + day5_temp + day5_cond + day5_info + sunrise + sunset + current_time);
                    
                    sendItBaby(day1_temp, day1_cond, day2_temp, day2_cond, day3_temp, day3_cond, day4_temp, day4_cond, day4_info, day5_temp, day5_cond, day5_info, sunrise, sunset, current_time);
                    
                } else {console.log("fail responseText.lenght > 100 -" + ownName);}
            } else {console.log("fail 200: " + ownName);}
        } else {console.log("fail readyState == 4 " + ownName);}
    };
    req.send(null);
    
}

function locationSuccess(pos) {
    var coordinates = pos.coords;
    //    if (debug_flag > 1) {
    console.log("locationSuccess, " + coordinates.latitude + ", " + coordinates.longitude);
    //    }
    //var latitude = 41.852014;
    //var longitude = 12.577281;
    //fetchWeather(latitude, longitude);
    /*    if (provider_flag === 0) {
     fetchWeatherConditions(coordinates.latitude, coordinates.longitude);
     fetchWeather3DayForecast(coordinates.latitude, coordinates.longitude);
     fetchWeatherTodayForecast(coordinates.latitude, coordinates.longitude);
     fetchSunriseSunset(coordinates.latitude, coordinates.longitude);
     }   */
    
    //    else if (provider_flag == 1) {
    console.log("kicking off Fetch Weather Underground chain of 4 gets");
    fetchWeatherUndergroundConditions(coordinates.latitude, coordinates.longitude);
    //        fetchWeatherUndergroundTodayForecast(coordinates.latitude, coordinates.longitude);
    //        fetchWeatherUnderground3DayForecast(coordinates.latitude, coordinates.longitude);
    //        fetchSunriseSunset(coordinates.latitude, coordinates.longitude);
    //    }
    
}

function locationError(err) {
    console.warn("location lookup error (" + err.code + "): " + err.message);
    MessageQueue.sendAppMessage({
                                city: "Loc Unavailable",
                                });
}
/*
 var locationOptions = {
 timeout: 15e3,
 maximumAge: 6e4
 }; */

var updateInProgress = false;

function updateWeather() {
    if (!updateInProgress) {
        console.log("Starting a new request!!");
        updateInProgress = true;
        var locationOptions = { "timeout": 15000, "maximumAge": 60000 };
        navigator.geolocation.getCurrentPosition(locationSuccess, locationError, locationOptions);
    }
    else {
        console.log("Not starting a new request. Another one is in progress...");
    }
}

function goDoStuff() {
	var lastUpdate;
	var now = new Date().getTime();
	now = Math.round(now / 1e3);
	var delay = 45;
	console.log("lastUpdate: " + localStorage.getItem("lastUpdate"));
	if (!(localStorage.getItem("lastUpdate"))) {
		console.log("local storage of lastUpdate not found");
		lastUpdate = now - (delay + 1);
		console.log("setting lastupdate to " + lastUpdate);
		localStorage.setItem("lastUpdate", lastUpdate);
	} else {
        lastUpdate = parseInt(localStorage.getItem("lastUpdate"));
        console.log("localStorage.lastUpdate found: " + lastUpdate);
        //lastUpdate = lastUpdate - 2000;
	}
	
	if ((lastUpdate + delay) < now) {
		console.log("overdue " + ((lastUpdate + delay) - now) + " seconds");
        if ((parseInt(lastUpdate + delay) - now) > delay) {
            console.log("uh oh, wait time " + (parseInt(lastUpdate + delay) - now) + " is more than delay " + delay);
        }
        
        
        var locationOptions = { "timeout": 15000, "maximumAge": 60000 };
        navigator.geolocation.getCurrentPosition(locationSuccess, locationError, locationOptions);
        //updateWeather();
		//locationWatcher = window.navigator.geolocation.watchPosition(locationSuccess, locationError, locationOptions);
        
	} else if ((lastUpdate + delay) > now) {
		console.log("please wait " + parseInt(lastUpdate + delay) - now + " seconds");
        //		readPersistentAlmanac();
		for (var i = 0; i < 6; i++) {
            //sendDayMessages(i);
            //		readPersistent(i);
		}
	}
}

Pebble.addEventListener("ready", function(e) {
                        console.log("addEventListener ready ");
                        //locationWatcher = window.navigator.geolocation.watchPosition(locationSuccess, locationError, locationOptions);
                        goDoStuff();
                        });

Pebble.addEventListener("appmessage", function(e) {
                        console.log("addEventListener appmessage");
                        //window.navigator.geolocation.getCurrentPosition(locationSuccess, locationError, locationOptions);
                        goDoStuff();
                        });

Pebble.addEventListener("showConfiguration", function() {
                        Pebble.openURL('http://x.SetPebble.com/' + setPebbleToken + '/' + Pebble.getAccountToken());
                        });

Pebble.addEventListener("webviewclosed", function(e) {
                        if ((typeof(e.response) == 'string') && (e.response.length > 0)) {
                        //set local value tempFlag to return value
                        //Pebble.sendAppMessage(JSON.parse(e.response));se);
                        var responseText		= e.response;
					    //var item = "1";
                        
                        if (debug_flag > 1) {
                        console.log("raw e.response (no JSON.parse) = " + e.response);
                        console.log("responseText.replace = " + responseText);
                        console.log("tempFlag = " + tempFlag);
                        }
                        responseText = responseText.replace("\"1\"", "\"tempUnits\"");
                        responseText = responseText.replace("\"2\"", "\"pressUnits\"");
                        responseText = responseText.replace("\"3\"", "\"location\"");
                        responseText = responseText.replace("\"4\"", "\"provider\"");
					    
                        if (debug_flag > 1) {
                        console.log("responseText.replace = " + responseText);
                        }
                        var config = JSON.parse(responseText);
                        tempFlag = config.tempUnits;
                        localStorage.setItem("tempFlag", tempFlag);
                        pressureFlag = config.pressUnits;
                        localStorage.setItem("pressureFlag", pressureFlag);
                        provider_flag = config.provider;
                        //var location = config.location;
                        MessageQueue.sendAppMessage({
                                                    location: config.location,
                                                    });
                        
                        //localStorage.setItem("tempFlag", JSON.parse(e.response));
                        //console.log("e.response " + e.response);
                        //console.log("JSON.parse(e.response)" + JSON.parse(e.response));
                        //	pseudoFunction();
                        //	locationSuccess(pos);
                        window.navigator.geolocation.getCurrentPosition(locationSuccess, locationError, locationOptions);
                        
                        }
                        });

function sendItBaby(day1_temp, day1_cond, day2_temp, day2_cond, day3_temp, day3_cond, day4_temp, day4_cond, day4_info, day5_temp, day5_cond, day5_info, sunrise, sunset, current_time) {
    
    if (debug_flag > 0) {
        console.log("debug flag = " + debug_flag);
        console.log("\noutside call " +
                    "\nday1 temp " + day1_temp + " day1 cond " + day1_cond +
                    "\nday2 temp " + day2_temp + " day2 cond " + day2_cond +
                    "\nday3 temp " + day3_temp + " day3 cond " + day3_cond +
                    "\nday4 temp " + day4_temp + " day4 cond " + day4_cond + " day4_ifno " + day4_info +
                    "\nday5 temp " + day5_temp + " day5 temp " + day5_cond + " day5_info " + day5_info +
                    "\nSunrise: " + sunrise +
                    "\nSunset: " + sunset +
                    "\ncurrent_time: " + current_time);
    }
    Pebble.sendAppMessage({
                          "day1_temp": day1_temp,
                          "day1_cond": day1_cond,
                          "day2_temp": day2_temp,
                          "day2_cond": day2_cond,
                          "day3_temp": day3_temp,
                          "day3_cond": day3_cond,
                          "day4_temp": day4_temp,
                          "day4_cond": day4_cond,
                          "day4_time": day4_info,
                          "day5_temp": day5_temp,
                          "day5_cond": day5_cond,
                          "day5_time": day5_info,
                          "sunrise": sunrise,
                          "sunset": sunset,
                          "current_time": current_time
                          });
	var now = new Date().getTime();
	now = Math.round(now / 1e3);
    localStorage.setItem("lastUpdate", now);
    console.log("last update set to " + localStorage.getItem("lastUpdate"));
}

function tempShower(inTemp) {
	//debug_flag = 2;
	if (debug_flag > 1) {
		temp = (inTemp * (9/5)) - 459.67;
		temp = Math.round(temp);
		if (debug_flag > 1) {
            console.log("temp is " + temp + "°F" );
        }
		temp = inTemp - 273.15;
		temp = Math.round(temp);
        if (debug_flag > 1) {
			console.log("temp is " + temp + "\u00B0C" );
        }
		temp = Math.round(inTemp);
		if (debug_flag > 1) {
            console.log("temp is " + temp + "K" );
			console.log("base calc unit is K");
        }
		temp = inTemp * (9/5);
		temp = Math.round(temp);
		if (debug_flag > 1) {
            console.log("temp is " + temp + "°Ra" );
        }
		temp = (inTemp - 273.15) * (4/5);
		temp = Math.round(temp);
		if (debug_flag > 1) {
            console.log("temp is " + temp + "°Ré" );
        }
		temp = ((inTemp - 273.15) * (21/40)) + 7.5;
		temp = Math.round(temp);
		if (debug_flag > 1) {
            console.log("temp is " + temp + "°Rø" );
        }
		temp = (inTemp - 273.15) * (33/100);
		temp = Math.round(temp);
		if (debug_flag > 1) {
            console.log("temp is " + temp + "°N" );
        }
		temp = (373.15 - inTemp) * (3/2);
		temp = Math.round(temp);
		if (debug_flag > 1) {
            console.log("temp is " + temp + "°De" );
        }
	} // end of if debug_flag > 1 condition
}



function tempGetter(temp) {
	if (tempFlag === 0 ) {
		//Fahrenheit °F
		//[°F] = [K] × 9/5 − 459.67
		temp = (temp * (9/5)) - 459.67;
		temp = Math.round(temp);
		if (debug_flag > 1) {
            console.log("temp is " + temp + "°F" );
		}
		return temp;
	} else if (tempFlag == 1) {
		//Celsius °C
		// [°C] = [K] − 273.15
		temp = temp - 273.15;
		temp = Math.round(temp);
		if (debug_flag > 1) {
			console.log("temp is " + temp + "°C" );
		}
		return temp;
	} else if (tempFlag == 2) {
		//Kelvin K
		// base scale
		temp = Math.round(temp);
		if (debug_flag > 1) {
			console.log("temp is " + temp + "K" );
		}
		return temp;
	} else if (tempFlag == 3) {
		//Rankine °Ra
		// [°R] = [K] × 9/5
		temp = temp * (9/5);
		temp = Math.round(temp);
		if (debug_flag > 1) {
            console.log("temp is " + temp + "°Ra" );
		}
		return temp;
	} else if (tempFlag == 4) {
		//Réaumur °Ré
		// [°Ré] = ([K] − 273.15) × 4/5
		temp = (temp - 273.15) * (4/5);
		temp = Math.round(temp);
		if (debug_flag > 1) {
            console.log("temp is " + temp + "°Ré" );
		}
		return temp;
	} else if (tempFlag == 5) {
		//Rømer °Rø
		// [°Rø] = ([K] − 273.15) × 21/40 + 7.5
		temp = ((temp - 273.15) * (21/40)) + 7.5;
		temp = Math.round(temp);
		if (debug_flag > 1) {
            console.log("temp is " + temp + "°Rø" );
		}
		return temp;
	} else if (tempFlag == 6) {
		//Newton °N
		//[°N] = ([K] − 273.15) × 33/100
		temp = (temp - 273.15) * (33/100);
		temp = Math.round(temp);
		if (debug_flag > 1) {
            console.log("temp is " + temp + "°N" );
		}
		return temp;
	} else if (tempFlag == 7) {
		//Delisle °D
		// [°De] = (373.15 − [K]) × 3/2
		temp = (373.15 - temp) * (3/2);
		temp = Math.round(temp);
		if (debug_flag > 1) {
            console.log("temp is " + temp + "°De" );
		}
		return temp;
	}
}

function iconFromWeatherString(weatherId) {
	
	if (weatherId == "tstorms") {
		console.log("weatherId = " + weatherId + ", return 6"); // 200 series - thunderstorms, // 300 to 321 defined as rain, 400-499 not defined, 500-599 is rain
        return 211;
    } else if (weatherId == "rain") {
		console.log("weatherId = " + weatherId + ", return 6"); // 200 series - thunderstorms, // 300 to 321 defined as rain, 400-499 not defined, 500-599 is rain
        return 501;
    } else if (weatherId == "chancetstorms") {
        console.log("weatherId = " + weatherId + ", return 12"); // 200 series - thunderstorms, // 300 to 321 defined as rain, 400-499 not defined, 500-599 is rain
        return 211;
    } else if (weatherId == "chancerain") {
        console.log("weatherId = " + weatherId + ", return 6"); // 200 series - thunderstorms, // 300 to 321 defined as rain, 400-499 not defined, 500-599 is rain
        return 501;
    } else if (weatherId == "sleet") { 	// 600-699 defined as snow
		console.log("weatherId = " + weatherId + ", return 8");
        return 611;
    } else if (weatherId == "snow") { 	// 600-699 defined as snow
		console.log("weatherId = " + weatherId + ", return 8");
        return 601;
    } else if (weatherId == "flurries") { 	// 600-699 defined as snow
		console.log("weatherId = " + weatherId + ", return 8");
        return 600;
    } else if (weatherId == "chancesnow") { 	// 600-699 defined as snow
		console.log("weatherId = " + weatherId + ", return 8");
        return 601;
    } else if (weatherId == "chancesleet") { 	// 600-699 defined as snow
		console.log("weatherId = " + weatherId + ", return 8");
        return 611;
    } else if (weatherId == "chanceflurries") { 	// 600-699 defined as snow
		console.log("weatherId = " + weatherId + ", return 8");
        return 600;
    } else if (weatherId == "mostlycloudy" ) {		// 700-799 is mist, smoke, fog, etc. Return lines
        console.log("weatherId = " + weatherId + ", return 4");
        return 804;						// 900-99 is crazy atmospheric shit,
    } else if (weatherId == "cloudy" ) {		// 700-799 is mist, smoke, fog, etc. Return lines
        console.log("weatherId = " + weatherId + ", return 4");
        return 804;						// 900-99 is crazy atmospheric shit,
    } else if (weatherId == "clear") {		// 800 is clear
        console.log("weatherId = " + weatherId + ", return 0");
        return 800;
    } else if (weatherId == "sunny") {		// 800 is clear
        console.log("weatherId = " + weatherId + ", return 0");
        return 800;
    } else if (weatherId == "partlysunny") {	// 801, 802, 803 are all partly cloudy
        console.log("weatherId = " + weatherId + ", return 2");
        return 801;
    } else if (weatherId == "mostlysunny") {	// 801, 802, 803 are all partly cloudy
        console.log("weatherId = " + weatherId + ", return 2");
        return 801;
    } else if (weatherId == "partlycloudy") {	// 801, 802, 803 are all partly cloudy
        console.log("weatherId = " + weatherId + ", return 2");
        return 801;
    } else if (weatherId == "hazy" ) {   // 804 = overcast. Should it be clouds, or lines? I love lines. So, lines. But it shoudl probably be clouds
        console.log("weatherId = " + weatherId + ", return 10");
        return 711;
    } else if (weatherId == "fog" ) {   // 804 = overcast. Should it be clouds, or lines? I love lines. So, lines. But it shoudl probably be clouds
        console.log("weatherId = " + weatherId + ", return 10");
        return 741;
    } else {							// 900 to 962 ranges from tornado to calm. Most strange.
        console.log("else return 10");
        return 900;
    }
}

