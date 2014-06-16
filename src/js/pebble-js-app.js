//working set version


var day1_temp, day1_cond, day2_temp, day2_cond, day3_temp, day3_cond, day4_temp, day4_cond, day4_info, day5_temp, day5_cond, day5_info, sunrise, sunset, current_time; 
var debug_flag = 0; 

Pebble.addEventListener("ready", function(e) {
    console.log("Starting ...");
	checkRequestTime(); 
    //updateWeather();
});

Pebble.addEventListener("appmessage", function(e) {
    console.log("Got a message - Starting weather request...");
    checkRequestTime(); 
	//updateWeather();
});


function checkRequestTime() { //check to see if its too soon to request an update. Weather Underground in particular gets quite cross about this
	var ownName = arguments.callee.toString();
	ownName = ownName.substr('function '.length);        // trim off "function "
	ownName = ownName.substr(0, ownName.indexOf('('));        // trim off everything after the function name
	//if (debug_flag > 1) {
        if (debug_flag > 0) {console.log("FUNCTION NAME = " + ownName + " debug_flag " + debug_flag); }
	var lastUpdate; 
	var now = new Date().getTime();
	now = Math.round(now / 1e3);
	if (debug_flag > 0) {console.log("now time " + now); }
	var delay = 31;
	if (debug_flag > 0) {console.log("lastUpdate: " + localStorage.getItem("lastUpdate")); }
	if (!(localStorage.getItem("lastUpdate"))) {
		if (debug_flag > 0) {console.log("local storage of lastUpdate not found"); }
		lastUpdate = now - (delay + 1);
		if (debug_flag > 0) {console.log("setting lastupdate to " + lastUpdate + ", " + (now - lastUpdate + " seconds ago"));}
		localStorage.setItem("lastUpdate", lastUpdate); 
	} else {
	lastUpdate = parseInt(localStorage.getItem("lastUpdate"));
		if (debug_flag > 0) {console.log("localStorage.lastUpdate found: " + lastUpdate); }
	}
	if ((lastUpdate + delay) < now) {
		if (debug_flag > 0) {console.log("overdue " + (now - (lastUpdate + delay)) + " seconds!!");}
		//localStorage.setItem("lastUpdate", now); 
//		locationWatcher = window.navigator.geolocation.watchPosition(locationSuccess, locationError, locationOptions);
		updateWeather(); 

	} else if ((lastUpdate + delay) > now) {
		var stale = parseInt((lastUpdate + delay) - now); 
		console.log("debug_flag = " + debug_flag); 
		if (debug_flag > 0) {console.log("please wait " + parseInt((lastUpdate + delay) - now) + " seconds");
		if (debug_flag > 0) {console.log("please wait " + stale + " seconds")};
		console.log(parseInt((lastUpdate + delay) - now) + ">" + delay);}
		if (stale > delay) {
			console.log("uh oh, please wait " + stale + " is greater than delay time, " + delay +  ", reset lastupdate!!");
			lastUpdate = now - (delay + 1); 
			localStorage.setItem("lastUpdate", lastUpdate);
			stale = (lastUpdate + delay) - now; 
			console.log("Fixed? please wait " + stale + " seconds (in check routine line 56)");
		}
		for (var i = 0; i < 6; i++) {
		}
	}
}



var updateInProgress = false;

function updateWeather() {
	if (debug_flag > 1) {console.log("checking to see if updateInProgress");console.log("debug_flag = " + debug_flag);}
    if (!updateInProgress) {
        updateInProgress = true;
	if (debug_flag > 1) {console.log("nope! No update in progress!");}
        var locationOptions = { "timeout": 15000, "maximumAge": 60000 };
        navigator.geolocation.getCurrentPosition(locationSuccess, locationError, locationOptions);
    }
    else {
        console.log("Not starting a new request. Another one is in progress...");
    }
}

function locationSuccess(pos) {
    var coordinates = pos.coords;
	if (debug_flag > 1) {console.log("Location Success!!\nGot coordinates:\n" + JSON.stringify(coordinates)); }
    fetchWeather(coordinates.latitude, coordinates.longitude);
}

function locationError(err) {
    console.warn('Location error (' + err.code + '): ' + err.message);
    Pebble.sendAppMessage({ "error": "Loc unavailable" });
    updateInProgress = false;
}
var temperature, icon, city, sunrise, sunset, condition, current_time, country;

function fetchWeather(latitude, longitude) {
	var ownName = arguments.callee.toString();
	ownName = ownName.substr('function '.length);        // trim off "function "
	ownName = ownName.substr(0, ownName.indexOf('('));        // trim off everything after the function name
	if (debug_flag > 1) {
        console.log("FUNCTION NAME = " + ownName);
	}
    var response;
    var req = new XMLHttpRequest();
    req.open('GET', "http://api.openweathermap.org/data/2.5/weather?" +
        "lat=" + latitude + "&lon=" + longitude + "&cnt=1", true);
    req.onload = function(e) {
        if (req.readyState == 4) {
            if(req.status == 200) {
//                console.log(req.responseText);
                response = JSON.parse(req.responseText);
//                var temperature, icon, city, sunrise, sunset, condition;
                var offset = new Date().getTimezoneOffset() * 60;
                //current_time = ((Date.now()  / 1000)- offset) % 86400;
                    var tempResult = response.main.temp;
                    country = response.sys.country;
                    if (country === "US") {
                        // Convert temperature to Fahrenheit if user is within the US
                        temperature = Math.round(((tempResult - 273.15) * 1.8) + 32);
                        day1_temp = temperature;
                    }
                    else {
                        // Otherwise, convert temperature to Celsius
                        temperature = Math.round(tempResult - 273.15);
                    }		 
                    condition = response.weather[0].id;
                    day1_cond = condition; 
                    sunrise = (response.sys.sunrise - (offset)) % 86400;
                    sunset = (response.sys.sunset - (offset)) % 86400;
                    //sunset = 1402627920;

                    updateInProgress = false;
//                    sendItBaby();
                    fetchHourly(latitude, longitude);

                }
            } else {
                console.log("Error");
                updateInProgress = false;
                Pebble.sendAppMessage({ "error": "HTTP Error" });
        }
    };
    req.send(null);
}


function fetchHourly(latitude, longitude) {
	var ownName = arguments.callee.toString();
	ownName = ownName.substr('function '.length);        // trim off "function "
	ownName = ownName.substr(0, ownName.indexOf('('));        // trim off everything after the function name
	if (debug_flag > 1) {
        console.log("FUNCTION NAME = " + ownName);
	}
    var response;
    var req = new XMLHttpRequest();
    req.open('GET', "http://api.openweathermap.org/data/2.5/forecast?" +
             "lat=" + latitude + "&lon=" + longitude + "&cnt=1", true);
    req.onload = function(e) {
        if (req.readyState == 4) {
            if(req.status == 200) {
                //                console.log(req.responseText);
                response = JSON.parse(req.responseText);
                //                var temperature, icon, city, sunrise, sunset, condition;
                var offset = new Date().getTimezoneOffset() * 60;
                current_time = ((Date.now()  / 1000)- offset) % 86400;
                var n = 4;
                if (response) {
                    var tempResult = response.list[n].main.temp;
                    var country = response.city.country;
                    if (debug_flag > 0) {console.log("day 2 country: " + country);}
                    if (country === "US") {
                        if (debug_flag > 0) {console.log("country US = " + country);}
                        //if (response.sys.country === "US") {
                        // Convert temperature to Fahrenheit if user is within the US
                        temperature = Math.round(((tempResult - 273.15) * 1.8) + 32);
                        //day2_temp = temperature;
                    }
                    else {
                        // Otherwise, convert temperature to Celsius
                        if (debug_flag > 0) {console.log("country US = " + country);}
                        temperature = Math.round(tempResult - 273.15);
                        //day2_temp = temperature;
                    }
                    condition = response.list[n].weather[0].id;
                    day2_cond = condition;
                    
                    /*Pebble.sendAppMessage({
                     "day2_cond": day2_cond,
                     "day2_temp": day2_temp,
                     });*/
                    
                    n = 8;
                    tempResult = response.list[n].main.temp;
                    //country = response.city.country;        
					if (debug_flag > 0) {console.log("day 3 country: " + country);}
                    if (country === "US") {
                        if (debug_flag > 0) {console.log("country US = " + country);}
                        //if (response.sys.country === "US") {
                        // Convert temperature to Fahrenheit if user is within the US
                        temperature = Math.round(((tempResult - 273.15) * 1.8) + 32);
                        //day3_temp = temperature;
                    }
                    else {
                        // Otherwise, convert temperature to Celsius
                        console.log("country US != " + country);
                        temperature = Math.round(tempResult - 273.15);
                        //day3_temp = temperature;
                    }
                    condition = response.list[n].weather[0].id;
                    day3_cond = condition;
                    
                    
                    updateInProgress = false;
                    fetchWeather3DayForecast(latitude, longitude);
                }
            } else {
                console.log("Error");
                updateInProgress = false;
                Pebble.sendAppMessage({ "error": "HTTP Error" });
            }
        }
    };
    req.send(null);
}

function fetchWeather3DayForecast(latitude, longitude) {       // sends days 3, 4, 5
	var ownName = arguments.callee.toString();
	ownName = ownName.substr('function '.length);        // trim off "function "
	ownName = ownName.substr(0, ownName.indexOf('('));        // trim off everything after the function name
	if (debug_flag > 1) {
        console.log("FUNCTION NAME = " + ownName);
	}
	
	
    var req = new XMLHttpRequest();
    req.open("GET", "http://api.openweathermap.org/data/2.5/forecast/daily?lat=" + latitude + "&lon=" + longitude + "&cnt=10&APPID=9f001a597927140d919cc512193dadd2", true);
	
    req.onload = function(e) {
        if (req.readyState == 4) {
            if (req.status == 200) {
                var response = JSON.parse(req.responseText);
                if (req.responseText.length > 100) {
                    var offset = new Date().getTimezoneOffset() * 60;
                    
                    tempResult = response.list[0].temp.max;
                    if (response.city.country === "US") {
                        // Convert temperature to Fahrenheit if user is within the US
                        temperature = Math.round(((tempResult - 273.15) * 1.8) + 32);
                    }
                    else {
                        // Otherwise, convert temperature to Celsius
                        temperature = Math.round(tempResult - 273.15);
                    }
                    day2_temp = temperature;
                    
                    tempResult = response.list[0].temp.min;
                    if (response.city.country === "US") {
                        // Convert temperature to Fahrenheit if user is within the US
                        temperature = Math.round(((tempResult - 273.15) * 1.8) + 32);
                    }
                    else {
                        // Otherwise, convert temperature to Celsius
                        temperature = Math.round(tempResult - 273.15);
                    }
                    day3_temp = temperature;
                    
                    var m = 1;
                    var n = m + 0;
                    tempResult = response.list[n].temp.max;
                    
                    if (response.city.country === "US") {
                        // Convert temperature to Fahrenheit if user is within the US
                        temperature = Math.round(((tempResult - 273.15) * 1.8) + 32);
                    }
                    else {
                        // Otherwise, convert temperature to Celsius
                        temperature = Math.round(tempResult - 273.15);
                    }
                    day4_temp = temperature;
//                    low = response.list[n].temp.min;
//                    day4_temp = high + "/\n" + low;
                    day4_cond = response.list[n].weather[0].id;
                    day4_time = response.list[n].dt - (offset);
                    
                    n = m + 1;
                    tempResult = response.list[n].temp.max;
                    if (response.city.country === "US") {
                        // Convert temperature to Fahrenheit if user is within the US
                        temperature = Math.round(((tempResult - 273.15) * 1.8) + 32);
                    }
                    else {
                        // Otherwise, convert temperature to Celsius
                        temperature = Math.round(tempResult - 273.15);
                    }
                    day5_temp = temperature;
//                    high = response.list[n].temp.max;
//                    day5_temp = high + "/\n" + low;
                    day5_cond = response.list[n].weather[0].id;
                    day5_time = response.list[n].dt - (offset);
                    
					if (debug_flag > 1) {console.log("FUNCTION NAME = " + ownName); 
			        console.log("debug flag = " + debug_flag);
			        console.log("\noutside call " + ownName +
                                "\nday1 temp " + day1_temp + " day1 cond " + day1_cond +
                                "\nday2 temp " + day2_temp + " day2 cond " + day2_cond +
                                "\nday3 temp " + day3_temp + " day3 cond " + day3_cond +
                                "\nday4 temp " + day4_temp + " day4 cond " + day4_cond + " day4_time " + day4_time +
                                "\nday5 temp " + day5_temp + " day5 temp " + day5_cond + " day5_time " + day5_time +
                                "\nSunrise: " + sunrise +
                                "\nSunset: " + sunset + " Now: " + ((Date.now() - (offset)) / 1000) % 86400 +
                                "\ncurrent_time: " + current_time);
							}
                    day4_info = parseInt(day4_time);
                    day5_info = parseInt(day5_time);
					
					sendItBaby(day1_temp, day1_cond, day2_temp, day2_cond, day3_temp, day3_cond, day4_temp, day4_cond, day4_info, day5_temp, day5_cond, day5_info, sunrise, sunset, current_time); 
                    
                } else {console.log("fail responseText.lenght > 100 -" + ownName);}
            } else {console.log("fail 200: " + ownName);}
        } else {console.log("fail readyState == 4 " + ownName);}
    };
    req.send(null);
}


function sendItBaby(day1_temp, day1_cond, day2_temp, day2_cond, day3_temp, day3_cond, day4_temp, day4_cond, day4_info, day5_temp, day5_cond, day5_info, sunrise, sunset, current_time) {
    
    if (debug_flag > 0) {
		var ownName = arguments.callee.toString();
		ownName = ownName.substr('function '.length);        // trim off "function "
		ownName = ownName.substr(0, ownName.indexOf('('));        // trim off everything after the function name
		if (debug_flag > 1) {
	        console.log("FUNCTION NAME = " + ownName);
		}
        console.log("debug flag = " + debug_flag);
        console.log("\noutside call " + ownName +
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
	now = parseInt(Math.round(now / 1e3));
    localStorage.setItem("lastUpdate", parseInt(now));
            if (debug_flag > 0) {
				console.log("last update set to " + localStorage.getItem("lastUpdate") + ", "); 
				console.log(parseInt(now) - parseInt(localStorage.getItem("lastUpdate")) + " seconds ago");
				console.log("now = " + parseInt(now));  }
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