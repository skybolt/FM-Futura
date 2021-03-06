//FM FUTURA

var debug_flag = 0;
localStorage.setItem("provider_flag", 1);

var updateInProgress = false;


if (localStorage.getItem("provider_flag") == 0) {
    console.log("provider: openweather.org");
}
if (localStorage.getItem("provider_flag") == 1) {
    console.log("provider: weatherunderground.com");
}

Pebble.addEventListener("ready", function(e) {
    if (debug_flag > 0) {
        console.log("ready, starting ...");
    }
    checkRequestTime();
    //updateWeather();
});

Pebble.addEventListener("appmessage", function(e) {
    if (debug_flag > 0) {
        console.log("AppMessage recieved");
    }
    checkRequestTime();
    //updateWeather();
});

function epochToTime(epoch) {
    var ownName = arguments.callee.toString();
    ownName = ownName.substr('function '.length);        // trim off "function "
    ownName = ownName.substr(0, ownName.indexOf('('));        // trim off everything after the function name
    var offset = new Date().getTimezoneOffset() * 60;
    local_epoch = epoch - offset;
    time_in_seconds = local_epoch % 86400;
    rounded_minutes = time_in_seconds - (time_in_seconds % 60);
    time_hour = Math.round((time_in_seconds - (time_in_seconds % 60)) / 3600);
//    time_hour = time_hour - time_hour;  //uncomment this to test 0:00 or 12:00 AM
    if (time_hour > 11) {
        meridian = " PM";
    }
    else {
        meridian = " AM";
    }
    if (time_hour == 0) {
        pretty_hour = 12 + " AM";
    }
    else if (time_hour == 12) {
        pretty_hour = "12 PM";
    } else {
        pretty_hour = (time_hour % 12) + meridian;
    }
    time = parseInt((time_hour * 100) + rounded_minutes);
    if (debug_flag > 0) {
        console.log("\nFUNCTION NAME = " + ownName +
                    "\ninput value = " + epoch +
                    "\ntime in seconds = " + time_in_seconds +
                    "\ntime_hour = " + time_hour +
                    "\ninput rounded to min = " + rounded_minutes +
                    "\npretty hour = " + pretty_hour +
                    "\ntime = " + time);
    }
    return time;
}

function checkRequestTime() { //check to see if its too soon to request an update. Weather Underground in particular gets quite cross about this
    var oldFlag = debug_flag;
    var ownName = arguments.callee.toString();
    ownName = ownName.substr('function '.length);        // trim off "function "
    ownName = ownName.substr(0, ownName.indexOf('('));        // trim off everything after the function name

    if (debug_flag > 0) {
        console.log("FUNCTION NAME = " + ownName + " debug_flag " + debug_flag);
        console.log("Should I start a request?");
    }
    var lastUpdate;
    var now = new Date().getTime();
    now = Math.round(now / 1e3);
    if (debug_flag > 10) {
        console.log("now time " + now);
    }
    var delay = 590;

    if (localStorage.getItem("provider_flag") == 0) {
        delay = 60;
        console.log("overriding delay flag, set to " + delay);
    }

    if (debug_flag > 0) {
        console.log("lastUpdate: " + localStorage.getItem("lastUpdate"));
    }
    if (!(localStorage.getItem("lastUpdate"))) {
        if (debug_flag > 0) {
            console.log("local storage of lastUpdate not found");
        }
        if (debug_flag > 0) {
            console.log("setting lastupdate to " + lastUpdate + ", " + (now - lastUpdate + " seconds ago"));
        }
        lastUpdate = now - (delay + 1);
        localStorage.setItem("lastUpdate", lastUpdate);
    } else {
        lastUpdate = parseInt(localStorage.getItem("lastUpdate"));
        if (debug_flag > 0) {
            console.log("localStorage.lastUpdate found: " + lastUpdate);
        }
    }


    // lastUpdate = timestamp of last updated
    // delay = how long to wait before declaring stale
    // nextUpdate = lastUpdate + delay (lastUpdate moved into the future by (delay) seconds
    // stale = nextUpdate - now (if NU > now, NU is still in future, hence fresh. NU is larger than now, so NU - now = positive. Fresh = stale is positive integer.
    // if stale is negative, then NU < now, so than NU - now is negative. Stale negative, then it's stale.

    // lastUpdate is when last updated. Now is now, delay is how long to wait before refresh.

    // if stale is positive, it's fresh. If stale is negative. it's stale.
    // schanrio 0): Fresh by 10 seconds. nextUpdate - now = 10; nextUpdate - (now + 10) = 0
    // scnario 1.5):Fresh by 11 seconds. NU - now = 11; nu - (now + 10) = 1.
    // sncart x): Fresh by 5 seconds. NU - now = 5; nu - (now + 10) = -5.
    // schanrio 1): stale by 10 seconds. nextUpdate - now = -10; lastUpdate + delay - (now + 10) = -20
    // schanrio 1): stale by 9 seconds. nextUpdate - now = -9; nextUpdate - (now + 10) = -19
    // scenario 2): stale by 11 seconds. nextUpdate - (now) = -11, nextUpdate - (now + 10) = -21,

    var nextUpdate = lastUpdate + delay;
    var stale = parseInt(nextUpdate - now);
    if (debug_flag > 0) {
        console.log("stale countdown = " + stale);
        console.log("delay - stale = (count up) " + (delay - stale));
    }
    //if ((lastUpdate + delay) < now) {
    //if (nextUpdate < now) {
    if (stale < 0) {
        console.log("yes, start new request, stale < 0");
//all three lines above should be same same
        if (debug_flag > 0) {
            console.log("overdue, stale " + (now - (lastUpdate + delay))    + " seconds!!");
            console.log("overdue, stale " + (now - (nextUpdate))            + " seconds!!");
            //if above lines == same, delete top one
        }
        now = parseInt(Math.round(now));
        localStorage.setItem("lastUpdate", parseInt(now));
        updateInProgress = false;
        console.log("calling updateWeather");
        updateWeather();

//    }  else if (nextUpdate > (now)) {
    }

    else if (delay - stale < 10) {
        if (debug_flag > 0) {
            console.log("NO, do NOT start new request, stale + 10 < 0");
            console.log("stale + 10 = " + (stale + 10));
            console.log("In fact, do NOTHING, becuase you JUST DID SOMETHING " + (delay - stale) + " seconds ago");
        }
    }

    else if (stale > 0) {
        //two above lines same way?
        //don't want to do fresh routine until ripe. Until it's been fresh for at least 10 seconds.
        // this is to avoid collisions on the message send, which may cause crashes.
        if (debug_flag > 0) {
            console.log("NO, do NOT start new request, stale > 0, not stale");
            console.log("instead, just re-send FM FUTURA DATA");
            console.log("stale not larger than now + 10");
            console.log("debug_flag = " + debug_flag);
            console.log("is " + (delay - stale) + " > " + delay + "? No.");
            console.log("checking storage of wu_location " + localStorage.getItem("wu_location"));
            console.log("getting OW location, re-sending locally stored weather info");
        }
        console.log("please wait " + stale + " seconds");
        //sendFMFutura();
        updateLocation();
        //sendFMFutura();
        //            }  else if (nextUpdate > now + 10) {
    }


    else {
        console.log("fails stale < 0");
        console.log("fails stale > 0");
        console.log("fails (stale + 10) < 0");
    }
}


function updateLocation() {

    if (debug_flag > 0) {
        console.log("(updateLocation) checking to see if updateInProgress");
        console.log("updateInProgress = " + updateInProgress);
    }
    if (!updateInProgress) {
        if (debug_flag > 0) {
            console.log("updateInProgress = " + updateInProgress + ", No update in progress! setting update in progress to TRUE");
            //console.log("checking updateInProgress = " + updateInProgress);
        }
        updateInProgress = true;
        var locationOptions = { "timeout": 15000, "maximumAge": 300000 };
        navigator.geolocation.getCurrentPosition(getLocation_locationSuccess, locationError, locationOptions);
    } else {
        if (debug_flag > 0) {
            console.log("KILLING REQUEST, either in progress or too soon. Not starting a new request");
        }
    }
    if (debug_flag > 0) {
        console.log("updateLocation closing -- updateInProgress = " + updateInProgress);
    }
}

function updateWeather() {

    if (debug_flag > 0) {
        console.log("(updateWeather) checking to see if updateInProgress");
        console.log("updateInProgress = " + updateInProgress);
    }

    if (!updateInProgress) {
        if (debug_flag > 0) {
            console.log("updateInProgress = " + updateInProgress + ", No update in progress! setting update in progress to TRUE");
        }
        updateInProgress = true;
        var locationOptions = { "timeout": 15000, "maximumAge": 300000 };
        navigator.geolocation.getCurrentPosition(locationSuccess, locationError, locationOptions);
    }
    else {
        if (debug_flag > 0) {
            console.log("Not starting a new request. Another one is in progress...");
        }
    }
    console.log("updateWeather closing -- updateInProgress = " + updateInProgress);
}

function getLocation_locationSuccess(pos) {
    var coordinates = pos.coords;
    if (debug_flag > 0) {
        console.log("Location Success!!\nGot coordinates:\n" + JSON.stringify(coordinates));
    }
    fetchOpenweatherLocation(coordinates.latitude, coordinates.longitude);
    if (debug_flag > 0) {
        console.log("getting openweather LCOATION ONLY");
        console.log("new latitude = " + coordinates.latitude + " longitude " + coordinates.longitude);
    }
}

function locationSuccess(pos) {
    var coordinates = pos.coords;
    if (debug_flag > 0) {
        console.log("\nLocation Success!!\nGot coordinates:\n" + JSON.stringify(coordinates));
    }

    if (localStorage.getItem("provider_flag") == 0) {
        fetchOpenweatherConditions(coordinates.latitude, coordinates.longitude);
        console.log("provider_flag = " + localStorage.getItem("provider_flag"));
        console.log("configured for openweathermap.org")
        localStorage.setItem("wu_location", " ");
        console.log("setting wu_location to [space]");

    } else if (localStorage.getItem("provider_flag") == 1) {

        fetchWeatherundergroundConditions(coordinates.latitude, coordinates.longitude);
        //fetchWeatherundergroundConditions(-27.000001, 152.000001); // for testing
        if (debug_flag > 0) {
            console.log("provider_flag = " + localStorage.getItem("provider_flag"));
            console.log("configured for wunderground.com");
            console.log("do we have a wu_location? Checkings storage: " + localStorage.getItem("wu_location"));
            //localStorage.setItem("ow_location", "");
        }
    }
}

function locationError(err) {
    console.warn('Location error (' + err.code + '): ' + err.message);
    Pebble.sendAppMessage({ "error": "Loc unavailable" });
    updateInProgress = false;
}

var temperature, icon, city, sunrise, sunset, condition, current_time, country;

function fetchOpenweatherConditions(latitude, longitude) {

    var ownName = arguments.callee.toString();
    ownName = ownName.substr('function '.length);        // trim off "function "
    ownName = ownName.substr(0, ownName.indexOf('('));        // trim off everything after the function name
    if (debug_flag > 0) {
        console.log("FUNCTION NAME = " + ownName);
    }
    var response;
    var req = new XMLHttpRequest();
    req.open('GET', "http://api.openweathermap.org/data/2.5/weather?" +
             "lat=" + latitude + "&lon=" + longitude + "&cnt=1", true);
    if (debug_flag > 0) {
        console.log("http://api.openweathermap.org/data/2.5/weather?" + "lat=" + latitude + "&lon=" + longitude + "&cnt=2");
    }

    req.onload = function(e) {
        if (req.readyState == 4) {
            if (debug_flag > 0) {
                console.log("passed READYSTATE 4 " + ownName);
            }
            if(req.status == 200) {
//          console.log(req.responseText);

                console.log("passed REQ 200 " + ownName);
                response = JSON.parse(req.responseText);
                var offset = new Date().getTimezoneOffset() * 60;

                timestamp = response.dt - (offset * 3600);
                localStorage.setItem("current_epoch", (response.dt - 0) + (90 * 60) );
                if (debug_flag > 0) {
                    console.log("*** *** ***");
                    console.log("parseInt(((response.dt - offset) + (90 * 60))) )) " + parseInt(((response.dt - (offset * 3600)) + (90 * 60))) );
                    console.log("((response.dt - (offset * 3600)) + (90 * 60)) = " + ((response.dt - (offset * 3600)) + (90 * 60)));
                    console.log("*** *** ***");
                    console.log("iconFromWeatherId(response.weather[0].id " + response.weather[0].id);
                    console.log("localStorage.getItem(current_epoch) " + localStorage.getItem("current_epoch"));
                    console.log("response.main.temp " + response.main.temp);
                    console.log("response.weather[0].main " + response.weather[0].main);
                    console.log("response.dt = " + response.dt);
                    console.log("offset = " + offset);
                    console.log("(offset * 3600) = " + (offset * 3600));
                    console.log("(90 * 60) = " + (90 * 60));
                    console.log("*** *** ***");
                    console.log("*** *** ***");
                }

//                var temperature, icon, city, sunrise, sunset, condition;

                //current_time = ((Date.now()  / 1000)- offset) % 86400;
                var tempResult = response.main.temp;
                country = response.sys.country;
                if (country === "US") {
                    // Convert temperature to Fahrenheit if user is within the US
                    temperature = Math.round(((tempResult - 273.15) * 1.8) + 32);
                }
                else {
                    // Otherwise, convert temperature to Celsius
                    temperature = Math.round(tempResult - 273.15);
                }
                day1_temp = temperature;
                localStorage.setItem("day1_temp", day1_temp);

                tempResult = response.main.temp_max;
                country = response.sys.country;
                if (country === "US") {
                    // Convert temperature to Fahrenheit if user is within the US
                    temperature = Math.round(((tempResult - 273.15) * 1.8) + 32);
                }
                else {
                    // Otherwise, convert temperature to Celsius
                    temperature = Math.round(tempResult - 273.15);
                }
                day2_temp = temperature;

                tempResult = response.main.temp_min;
                country = response.sys.country;
                if (country === "US") {
                    // Convert temperature to Fahrenheit if user is within the US
                    temperature = Math.round(((tempResult - 273.15) * 1.8) + 32);
                }
                else {
                    // Otherwise, convert temperature to Celsius
                    temperature = Math.round(tempResult - 273.15);
                }
                day3_temp = temperature;

                condition = response.weather[0].id;
                day1_cond = condition;
                sunrise = (response.sys.sunrise - (offset));//  % 86400;
                sunset = (response.sys.sunset - (offset)); // % 86400;
                //sunset = 1402627920;

                updateInProgress = false;
                fetchOpenweatherHourlyForecast(latitude, longitude);
                //console.log("calling fetchOpenweatherHourlyForecast(latitude, longitude)");
            } else {
                console.log("Error - FAIL 200 " + ownName);
                updateInProgress = false;
                Pebble.sendAppMessage({ "error": "HTTP Error" });
            }

        } else {
            console.log("Error - FAIL 4 " + ownName);
            updateInProgress = false;
            Pebble.sendAppMessage({ "error": "HTTP Error" });
        }
    };
    req.send(null);
    updateInProgress = false;
}

function fetchOpenweatherHourlyForecast(latitude, longitude) {

    var ownName = arguments.callee.toString();
    ownName = ownName.substr('function '.length);        // trim off "function "
    ownName = ownName.substr(0, ownName.indexOf('('));        // trim off everything after the function name
    if (debug_flag > 0) {
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
                current_time = ((Date.now()  / 1000) - offset) ; //% 86400;
                console.log("current_time = " + current_time + " line c272");
                var n = 2;
                if (response) {
                    var tempResult = response.list[n].main.temp;
                    var country = response.city.country;
                    if (debug_flag > 0) {
                        console.log("day 2 country: " + country);
                    }
                    if (country === "US") {
                        if (debug_flag > 0) {
                            console.log("country US = " + country);
                        }
                        temperature = Math.round(((tempResult - 273.15) * 1.8) + 32);
                    }
                    else {
                        // Otherwise, convert temperature to Celsius
                        if (debug_flag > 0) {
                            console.log("country US = " + country);
                        }
                        temperature = Math.round(tempResult - 273.15);
                    }
                    timestamp = response.list[n].dt;
                    condition = response.list[n].weather[0].id;
                    day2_cond = condition;
                    day2_info = timestamp;
                    day2_info = epochToTime(day2_info);
                    day2_info = pretty_hour;

                    /*Pebble.sendAppMessage({
                     "day2_cond": day2_cond,
                     "day2_temp": day2_temp,
                     });*/

                    n = 5;
                    tempResult = response.list[n].main.temp;
                    if (debug_flag > 0) {
                        console.log("day 3 country: " + country);
                    }
                    if (country === "US") {
                        if (debug_flag > 0) {
                            console.log("country US = " + country);
                        }
                        temperature = Math.round(((tempResult - 273.15) * 1.8) + 32);
                    }
                    else {
                        // Otherwise, convert temperature to Celsius
                        console.log("country US != " + country);
                        temperature = Math.round(tempResult - 273.15);
                    }
                    condition = response.list[n].weather[0].id;
                    timestamp = response.list[n].dt;
                    day3_cond = condition;
                    epochToTime(timestamp);
                    day3_info = pretty_hour;
//                    day3_info = epochToTime(timestamp);
                    //console.log("day3_info = " + day3_info);

                    updateInProgress = false;
                    //console.log("calling fetchOpenweatherDailyForecast (" + latitude +", " + longitude);
                    fetchOpenweatherDailyForecast(latitude, longitude);
                }
            } else {
                console.log("Error");
                updateInProgress = false;
                Pebble.sendAppMessage({ "error": "HTTP Error"});
                console.log("error, fail == 200 " + ownName);
            }
        } else {
            console.log("fail req.readyState == 4, " + ownName);
        }
    }; //end onlod
    req.send(null);
    updateInProgress = false;
}

function fetchOpenweatherDailyForecast(latitude, longitude) {       // sends days 3, 4, 5
    var ownName = arguments.callee.toString();
    ownName = ownName.substr('function '.length);        // trim off "function "
    ownName = ownName.substr(0, ownName.indexOf('('));        // trim off everything after the function name
    if (debug_flag > 0) {
        console.log("FUNCTION NAME = " + ownName);
    }


    var req = new XMLHttpRequest();
    req.open("GET", "http://api.openweathermap.org/data/2.5/forecast/daily?lat=" + latitude + "&lon=" + longitude + "&cnt=10&APPID=9f001a597927140d919cc512193dadd2", true);

    req.onload = function(e) {
        if (req.readyState == 4) {
            if (req.status == 200) {
                var response = JSON.parse(req.responseText);
                if (debug_flag > 0) {
                    console.log(ownName + ", " + req.responseText.length);
                }
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


                    tempResult = response.list[0].temp.min;
                    if (response.city.country === "US") {
                        // Convert temperature to Fahrenheit if user is within the US
                        temperature = Math.round(((tempResult - 273.15) * 1.8) + 32);
                    }
                    else {
                        // Otherwise, convert temperature to Celsius
                        temperature = Math.round(tempResult - 273.15);
                    }
                    //day3_temp = temperature;

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

                    location = response.city.name;
                    console.log("LOCATION IS " + response.city.name);

                    if (debug_flag > 0) {
                        console.log("\nFUNCTION NAME = " + ownName);
                        console.log("\ndebug flag = " + debug_flag);
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

                    location = response.city.name;

                    console.log("LOCATION IS " + response.city.name);
                    //ow_location = response.city.name;

                    localStorage.setItem("ow_location", response.city.name);
                    //console.log("setting ow_location = " + response.city.name);

                    sendFMFutura();
                    //fetchWeatherundergroundAstronomy(latitude, longitude);
                } else {
                    console.log("fail responseText.lenght > 100 -" + ownName);
                }
            } else {
                console.log("fail 200: " + ownName);
            }
        } else {
            console.log("fail readyState == 4 " + ownName);
        }
    };
    req.send(null);
    updateInProgress = false;
}

function fetchWeatherundergroundConditions(latitude, longitude) { // gets day 1
    var ownName = arguments.callee.toString();
    ownName = ownName.substr('function '.length);        // trim off "function "
    ownName = ownName.substr(0, ownName.indexOf('('));        // trim off everything after the function name
    if (debug_flag > 0) {
        console.log("FUNCTION NAME = " + ownName);
    }

    var tt = new Date();
    if (debug_flag > 0) {
        console.log("new Date =" + tt);
    }
    var key = "25604a92d894df0e";
    var req = new XMLHttpRequest();
    req.open("GET", "http://api.wunderground.com/api/" + key + "/conditions/geolookup/q/" + latitude + "," + longitude + ".json?apiref=c6aca805bd4ad9c2", true);
    if (debug_flag > 0) {
        console.log("Weather Underground app key request!! key: " + key);
        console.log("http://api.wunderground.com/api/" + key + "/conditions/geolookup/q/" + latitude + "," + longitude + ".json?apiref=c6aca805bd4ad9c2");

    }

    req.onload = function(e) {
        if (req.readyState == 4) {
            if (req.status == 200) {
                var response = JSON.parse(req.responseText);
                if (debug_flag > 0) {
                    console.log(ownName + ", " + req.responseText.length);
                }


                if (req.responseText.length > 0) {
                    //if (response.response.error.type != "invalidkey") {

                    day = 0;

                    if (debug_flag > 0) {
                        //console.log("Key not labled invalid! response.response.error.type = " + response.response.error.type);
                        //console.log("n " + n + " (array), m " + m + " (base), day = " + day);
                    }
                    day1_cond = iconFromWeatherString(response.current_observation.icon);
                    localStorage.setItem("day1_cond", day1_cond);

                    if (response.location.country === "US") {
                        day1_temp = parseInt(response.current_observation.temp_f);
                        localStorage.setItem("day1_temp", day1_temp);
                    } else {
                        day1_temp = parseInt(response.current_observation.temp_c);
                        localStorage.setItem("day1_temp" = day1_temp);
                    }

                    if (debug_flag > 0) {
                        console.log("calling fetchWeatherundergroundHourlyForecast(latitude, longitude)");
                    }
                    fetchWeatherundergroundHourlyForecast(latitude, longitude);
                    /*      } else {
                              console.log("response.response.error.type " + response.response.error.type + " in function " + ownName);
                              console.log(response.response.error.description);
                              Pebble.sendAppMessage({ "error": "HTTP Error" }); } */


                } else {
                    console.log("fail responseText.lenght > 100 -" + ownName);
                }
            } else {
                console.log("fail 200: " + ownName);
            }
        } else {
            console.log("fail readyState == 4 " + ownName);
        }
    };
    req.send(null);
    updateInProgress = false;
}

function fetchWeatherundergroundHourlyForecast(latitude, longitude) { // gets day 1, 2 in section URL hourly
    var ownName = arguments.callee.toString();
    ownName = ownName.substr('function '.length);        // trim off "function "
    ownName = ownName.substr(0, ownName.indexOf('('));        // trim off everything after the function name

    if (debug_flag > 0) {
        console.log("FUNCTION NAME = " + ownName);
    }
    var key = "d33637904b0a944c";
    var response;
    var req = new XMLHttpRequest();
    req.open("GET", "http://api.wunderground.com/api/" + key + "/hourly/geolookup/q/" + latitude + "," + longitude + ".json?apiref=e7df32ff6bb6fb0d", true);
    if (debug_flag > 0) {
        console.log("Weather Underground app key request!! key = " + key);
        console.log("http://api.wunderground.com/api/" + key + "/hourly/geolookup/q/" + latitude + "," + longitude + ".json?apiref=e7df32ff6bb6fb0d");
    }
    req.onload = function(e) {
        var offset = new Date().getTimezoneOffset() / 60;
        if (req.readyState == 4) {
            if (req.status == 200) {
                response = JSON.parse(req.responseText);
                //  if (response.response.error.type != "invalidkey") {

                if (debug_flag > 0) {
                    console.log(ownName + ", " + req.responseText.length);
                }
                n = 2;
                day = 2;


                //day2_cond = iconFromWeatherString(response.hourly_forecast[n].icon);
                //day2_temp = day1_high;
                conditions = response.hourly_forecast[n].wx;
                day2_cond = iconFromWeatherString(response.hourly_forecast[n].icon);
                localStorage.setItem("day2_cond", day2_cond);
                //epochToTime
                timestamp = response.hourly_forecast[n].FCTTIME.epoch;
                day2_info = response.hourly_forecast[n].FCTTIME.civil;
                if (debug_flag > 0) {
                    console.log("raw timestamp: " + timestamp);
                }
                if (debug_flag > 0) {
                    console.log("day_" + day + " FCTTIME.epoch[" + n + "]= " + response.hourly_forecast[n].FCTTIME.epoch);
                    console.log("day_" + day + " FCTTIME civil[" + n + "]= " + response.hourly_forecast[n].FCTTIME.civil);
                }
                epochToTime(timestamp);
                day2_info = pretty_hour;
                timestamp = parseInt(timestamp) - parseInt (offset * 3600);

                var day2_low;

                n = 11;
                day = 3;
                if (debug_flag > 0) {
                    //console.log("n " + n + " (array), m " + m + " (base), day = " + day);
                }
                day3_cond = iconFromWeatherString(response.hourly_forecast[n].icon);
                localStorage.setItem("day3_cond", day3_cond);
                temp = "L: " + day2_low;
                //temp = response.hourly_forecast[n].temp.metric;
                timestamp = response.hourly_forecast[n].FCTTIME.epoch;
                day3_info = response.hourly_forecast[n].FCTTIME.civil;
                conditions = response.hourly_forecast[n].wx;
                if (debug_flag > 0) {
                    console.log("raw timestamp: " + timestamp);
                }
                if (debug_flag > 0) {
                    console.log("day_" + day + " FCTTIME.epoch[" + n + "]= " + response.hourly_forecast[n].FCTTIME.epoch);
                    console.log("day_" + day + " FCTTIME civil[" + n + "]= " + response.hourly_forecast[n].FCTTIME.civil);
                }
                epochToTime(timestamp);
                day3_info = pretty_hour;

                fetchWeatherundergroundDailyForecast(latitude, longitude);
                /*   } else {
                       console.log("response.response.error.type " + response.response.error.type + " in function " + ownName);
                       console.log(response.response.error.description);
                       Pebble.sendAppMessage({ "error": "HTTP Error" });}  */


                //                } else {console.log("fail responseText.lenght > 100 -" + ownName);}
            } else {
                console.log("fail 200: " + ownName);
            }
        } else {
            console.log("fail readyState == 4 " + ownName);
        }
    };
    req.send(null);
    updateInProgress = false;
}

function fetchWeatherundergroundDailyForecast(latitude, longitude) { // gets day 3, 4, 5
    var ownName = arguments.callee.toString();
    ownName = ownName.substr('function '.length);        // trim off "function "
    ownName = ownName.substr(0, ownName.indexOf('('));        // trim off everything after the function name
    if (debug_flag > 0) {
        console.log("FUNCTION NAME = " + ownName);
    }
    var key = "6fe6c99a5d7df975";
    var response;
    var req = new XMLHttpRequest();
    req.open("GET", "http://api.wunderground.com/api/" + key + "/forecast/geolookup/q/" + latitude + "," + longitude + ".json?apiref=060d48ec505bb753", true);
    if (debug_flag > 0) {
        console.log("Weather Underground app key request!! key = " + key);
        console.log("http://api.wunderground.com/api/" + key + "/forecast/geolookup/q/" + latitude + "," + longitude + ".json?apiref=060d48ec505bb753");

    }
    req.onload = function(e) {
        if (req.readyState == 4) {
            if (req.status == 200) {
                response = JSON.parse(req.responseText);
                if (req.responseText.length > 100) {
                    //if (response.response.error.type != "invalidkey") {
                    if (debug_flag > 0) {
                        console.log(ownName + ", " + req.responseText.length);
                    }
                    if (response.location.country === "US") {
                        day2_high = parseInt(response.forecast.simpleforecast.forecastday[0].high.fahrenheit);
                        localStorage.setItem("day2_high", day2_high);
                    } else {
                        day2_high = parseInt(response.forecast.simpleforecast.forecastday[0].high.celsius);
                        localStorage.setItem("day2_high", day2_high);
                    }

                    if (response.location.country === "US") {
                        day2_low = parseInt(response.forecast.simpleforecast.forecastday[0].low.fahrenheit);
                        localStorage.setItem("day2_low", day2_low);
                    } else {
                        day2_low = parseInt(response.forecast.simpleforecast.forecastday[0].low.celsius);
                        localStorage.setItem("day2_low", day2_low);
                    }

                    day2_temp = day2_high;
                    localStorage.setItem("day2_temp", day2_high);
                    day3_temp = day2_low;
                    localStorage.setItem("day3_temp", day3_temp);
                    var m = 1
                            n = m -1 ;// array is day and night, in text rollup odd numbers night (contain low in temp), days (even numbers) contain high
                    day = 4;
                    if (debug_flag > 0) {
                        console.log("n " + n + " (array), m " + m + " (base), day = " + day);
                    }
                    //                    icon = iconFromWeatherString(response.forecast.simpleforecast.forecastday[n].icon);
                    day4_cond = iconFromWeatherString(response.forecast.simpleforecast.forecastday[n].icon);
                    localStorage.setItem("day4_cond", day4_cond);
                    day4_info = parseInt(response.forecast.simpleforecast.forecastday[n].date.epoch);
                    localStorage.setItem("day4_info", day4_info);
                    //conditions = stripper(response.forecast.simpleforecast.forecastday[n].conditions);
                    high = parseInt(response.forecast.simpleforecast.forecastday[n].high.celsius);
                    low = parseInt(response.forecast.simpleforecast.forecastday[n].low.celsius);
                    //                    temp = high + "/\n" + low + getTempLabel();
                    //                    var tempResult = response.main.temp;
                    if (response.location.country === "US") {
                        // Convert temperature to Fahrenheit if user is within the US
                        tempResult = parseInt(response.forecast.simpleforecast.forecastday[n].high.fahrenheit);
                        temperature = Math.round(tempResult);
                    }
                    else {
                        // Otherwise, convert temperature to Celsius
                        console.log(response.location.country);
                        tempResult = parseInt(response.forecast.simpleforecast.forecastday[n].high.celsius);
                        temperature = Math.round(tempResult);
                    }
                    day4_temp = temperature;
                    localStorage.setItem("day4_temp", day4_temp);


                    n = m;
                    day = 5;
                    if (debug_flag > 0) {
                        console.log("n " + n + " (array), m " + m + " (base), day = " + day);
                    }
                    day5_cond = iconFromWeatherString(response.forecast.simpleforecast.forecastday[n].icon);
                    localStorage.setItem("day5_cond", day5_cond);
                    day5_info = parseInt(response.forecast.simpleforecast.forecastday[n].date.epoch);
                    localStorage.setItem("day5_info", day5_info);
                    //conditions = stripper(response.forecast.simpleforecast.forecastday[n].conditions);
                    high = parseInt(response.forecast.simpleforecast.forecastday[n].high.celsius);
                    low = parseInt(response.forecast.simpleforecast.forecastday[n].low.celsius);
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
                    localStorage.setItem("day5_temp", day5_temp);


                    fetchWeatherundergroundAstronomy(latitude, longitude);
                    /*  } else {
                        console.log("response.response.error.type " + response.response.error.type + " in function " + ownName);
                        console.log(response.response.error.description);
                        Pebble.sendAppMessage({ "error": "HTTP Error" });   }   */

                } else {
                    console.log("fail responseText.lenght > 100 -" + ownName);
                }
            } else {
                console.log("fail 200: " + ownName);
            }
        } else {
            console.log("fail readyState == 4 " + ownName);
        }
    };
    req.send(null);
    updateInProgress = false;
}

function fetchWeatherundergroundAstronomy(latitude, longitude) {
    var debug_Flag = 1;
    //based on http://api.wunderground.com/api/6fe6c99a5d7df975/astronomy/q/Australia/Sydney.json
    var ownName = arguments.callee.toString();
    ownName = ownName.substr('function '.length);        // trim off "function "
    ownName = ownName.substr(0, ownName.indexOf('('));        // trim off everything after the function name
    if (debug_flag > 0) {
        console.log("FUNCTION NAME = " + ownName);
        console.log(" calling http://api.wunderground.com/api/" + key + "/astronomy/geolookup/q/" + latitude + "," + longitude + ".json?apiref=0f727a310f1287b2");
    }
    var key = "7d74aa6fc6691d6c"; //almanac info key for WU
    var response;
    var req = new XMLHttpRequest();
    req.open("GET", "http://api.wunderground.com/api/" + key + "/astronomy/geolookup/q/" + latitude + "," + longitude + ".json?apiref=0f727a310f1287b2", true);
    if (debug_flag > 0) {
        console.log("http://api.wunderground.com/api/" + key + "/astronomy/geolookup/q/" + latitude + "," + longitude + ".json?apiref=0f727a310f1287b2", true);
    }
    req.onload = function(e) {
        var offset = new Date().getTimezoneOffset() / 60;
        if (req.readyState == 4) {
            if (req.status == 200) {
                response = JSON.parse(req.responseText);
                if (debug_flag > 0) {
                    console.log(ownName + ", " + req.responseText.length);
                }
                if (req.responseText.length > 10) {

                    //if (response.response.error.type) {console.log("!response.response.error.type");
                    /*current_time = response.moon_phase.current_time.hour + "" + response.moon_phase.current_time.minute;
                    console.log("current_time = " + current_time);
                    current_time = parseInt(current_time);
                    console.log("current_time = " + current_time);  */

                    var offset_seconds = new Date().getTimezoneOffset() * 60;
                    current_epoch = Math.round(((Date.now()  / 1000)));

                    if (debug_flag > 0) {
                        console.log(current_epoch + " = current_epoch");
                    }
                    var debug_Flag = 1;

                    weather_timestamp = current_epoch;
                    localStorage.setItem("current_epoch", parseInt(current_epoch));
                    if (debug_flag > 0) {
                        console.log(parseInt(localStorage.getItem("current_epoch")) + " = current_epoch.getItem");
                    }

                    if (debug_flag > 0) {
                        console.log("current epoch " + current_epoch + " - (current_epoch % 60) " + (current_epoch % 60) + " equals rounded to min = " + (current_epoch - (current_epoch % 60)));
                    }


                    current_epoch = current_epoch - (current_epoch % 60);
                    if (debug_flag > 0) {
                        console.log("current epoch rounded to min = " + current_epoch);
                    }

                    today_in_seconds = (current_epoch - offset_seconds) % 86400;
                    if (debug_flag > 0) {
                        console.log("today_in_seconds = " + today_in_seconds);
                    }

                    current_minute = Math.round((today_in_seconds % 3600) / 60);
                    if (debug_flag > 0) {
                        console.log(current_minute + " = current_minute");
                    }

                    current_hour = Math.round((   (today_in_seconds - (0))    -  (current_minute * 60))  /   3600);
                    if (debug_flag > 0) {
                        console.log(current_hour + " = current_hour");
                        //console.log("current epoch: " + current_epoch);
                        //consile.log(")
                        console.log((offset_seconds) + " offset_seconds");
//                        console.log((today_in_seconds - (offset_seconds)) + " today_in_seconds - (offset_seconds)");
                    }
                    //console.


                    current_time = parseInt((current_hour * 100) + current_minute);
                    if (debug_flag > 0) {
                        console.log(current_time + " = current_time as set in Astronomy, by " + (current_hour * 100) + " and " + current_minute);
                    }

                    /// get timestamped epoch from WU, or "CURRENT TIME from JS" and send. Don't get time until inside req.response and then it should neever currently send a stale time.
                    localStorage.setItem("current_time", current_time);

                    /*
                    if (debug_flag > 0) {
                        console.log("\nFUNCTION NAME = " + ownName +
                                    "\ncurrent_epoch = " + current_epoch +
                                    "\ntoday_in_seconds = " + today_in_seconds +
                                    "\ncurrent_minute = " + current_minute +
                                    "\ncurrent_epoch - (current minute) = " + (current_epoch - (current_minute)) +
                                    "\ncurrent_hour = " + current_hour);

                    }  */


                    var location;
                    location = response.location.city;
                    localStorage.setItem("wu_location", "/" + response.location.city);
                    console.log("setting wu_location  = /" + response.location.city);

                    sunrise = parseInt(response.sun_phase.sunrise.hour + "" + response.sun_phase.sunrise.minute);
                    localStorage.setItem("sunrise", sunrise);
                    sunset = parseInt(response.sun_phase.sunset.hour + "" + response.sun_phase.sunset.minute);
                    localStorage.setItem("sunset", sunset);

                    localStorage.setItem("wu_weather_timestamp", weather_timestamp);

                    fetchOpenweatherLocation(latitude, longitude);





                    /*   } else {
                           console.log("response.response.error.type " + response.response.error.type + " in function " + ownName);
                           console.log(response.response.error.description);
                           Pebble.sendAppMessage({ "error": "HTTP Error" });}   */

                } else {
                    console.log("fail responseText.lenght > 10 -" + ownName);
                }
            } else {
                console.log("fail 200: " + ownName);
            }
        } else {
            console.log("fail readyState == 4 " + ownName);
        }
    };
    req.send(null);
    updateInProgress = false;
}

function fetchOpenweatherLocation(latitude, longitude) {       // sends days 3, 4, 5
    var ownName = arguments.callee.toString();
    ownName = ownName.substr('function '.length);        // trim off "function "
    ownName = ownName.substr(0, ownName.indexOf('('));        // trim off everything after the function name

    if (debug_flag > 0) {
        console.log("FUNCTION NAME = " + ownName);
    }


    var req = new XMLHttpRequest();
    req.open("GET", "http://api.openweathermap.org/data/2.5/forecast/daily?lat=" + latitude + "&lon=" + longitude + "&cnt=10&APPID=9f001a597927140d919cc512193dadd2", true);
    if (debug_flag > 0) {
        console.log("http://api.openweathermap.org/data/2.5/forecast/daily?lat=" + latitude + "&lon=" + longitude + "&cnt=10&APPID=9f001a597927140d919cc512193dadd2");
    }
    req.onload = function(e) {
        if (req.readyState == 4) {
            if (req.status == 200) {
                var response = JSON.parse(req.responseText);
                if (debug_flag > 0) {
                    console.log(ownName + ", " + req.responseText.length);
                }
                if (req.responseText.length > 100) {
                    //location = location + "/" + response.city.name;

                    location = response.city.name;
                    //ow_location = response.city.name;

                    localStorage.setItem("ow_location", response.city.name);

                    if (debug_flag > 0) {
                        console.log("setting ow_location  = " + response.city.name);
                    }

                    sendFMFutura();
                    //fetchWeatherundergroundAstronomy(latitude, longitude);
                } else {
                    console.log("fail responseText.lenght > 100 -" + ownName);
                }
            } else {
                console.log("fail 200: " + ownName);
            }
        } else {
            console.log("fail readyState == 4 " + ownName);
        }
    };
    req.send(null);
    updateInProgress = false;
}

function sendFMFutura() {

    var now = new Date().getTime();
    var offset = new Date().getTimezoneOffset() * 60;
    now = parseInt(Math.round(now / 1e3));
    lastSend = parseInt(localStorage.getItem("lastSend"));
    if (!lastSend) {
        lastSend = parseInt(0);
    }
    if (debug_flag) {
        console.log("(lastSend (" + lastSend + ") + 10) - now (" + now + ") = " + ((lastSend + 10) - now));
        console.log("lastSend + 10 = " + (lastSend + 10) );
    }

    if (((lastSend) + 10) < now) { // then do all the stuff
        if (debug_flag > 0) {
            console.log("(lastSend + 10) - now = " + ((lastSend + 10) - now));
            console.log("doing, becuase lastsend + 10 > now");
        }

        //var debug_flag = 1;
        if (debug_flag > 0) {
            console.log("SEND FM FUTURA FUNCTION");

            console.log("localStorage.getItem day1_temp = " + parseInt(localStorage.getItem("day1_temp")));
            console.log("localStorage.getItem day1_cond = " + parseInt(localStorage.getItem("day1_cond")));
            console.log("localStorage.getItem day2_temp = " + parseInt(localStorage.getItem("day2_temp")));
            //console.log("localStorage.getItem day2_info = "High";
            console.log("localStorage.getItem day2_cond = " + parseInt(localStorage.getItem("day2_cond")));
            console.log("localStorage.getItem day3_temp = " + parseInt(localStorage.getItem("day3_temp")));
            console.log("localStorage.getItem day3_cond = " + parseInt(localStorage.getItem("day3_cond")));
            //console.log("localStorage.getItem day3_info = "Low";
            console.log("localStorage.getItem day4_temp = " + parseInt(localStorage.getItem("day4_temp")));
            console.log("localStorage.getItem day4_cond = " + parseInt(localStorage.getItem("day4_cond")));
            console.log("localStorage.getItem day4_info = " + localStorage.getItem("day4_info"));
            console.log("localStorage.getItem day5_temp = " + parseInt(localStorage.getItem("day5_temp")));
            console.log("localStorage.getItem day5_cond = " + parseInt(localStorage.getItem("day5_cond")));
            console.log("localStorage.getItem day5_info = " + localStorage.getItem("day5_info"));
            console.log("localStorage.getItem sunrise = "   + parseInt(localStorage.getItem("sunrise")));
            console.log("localStorage.getItem sunset = "    + parseInt(localStorage.getItem("sunset")));
            console.log("localStorage.getItem location = "  + localStorage.getItem("ow_location") + localStorage.getItem("wu_location"));
            console.log("localStorage.getItem WU location = " + localStorage.getItem("wu_location"));
            console.log("localStorage.getItem OW location = " + localStorage.getItem("ow_location"));
            console.log("localStorage.getItem current_epoch = " + parseInt(localStorage.getItem("current_epoch")));
        }

        //read all from storage
        var day1_temp = parseInt(localStorage.getItem("day1_temp"));
        var day1_cond = parseInt(localStorage.getItem("day1_cond"));
        var day2_temp = parseInt(localStorage.getItem("day2_temp"));
        var day2_info = "High";
        var day2_cond = parseInt(localStorage.getItem("day2_cond"));
        var day3_temp = parseInt(localStorage.getItem("day3_temp"));
        var day3_cond = parseInt(localStorage.getItem("day3_cond"));
        var day3_info = "Low";
        var day4_temp = parseInt(localStorage.getItem("day4_temp"));
        var day4_cond = parseInt(localStorage.getItem("day4_cond"));
        var day4_info = parseInt(localStorage.getItem("day4_info"));
        var day5_temp = parseInt(localStorage.getItem("day5_temp"));
        var day5_cond = parseInt(localStorage.getItem("day5_cond"));
        var day5_info = parseInt(localStorage.getItem("day5_info"));
        var current_time = parseInt(localStorage.getItem("current_time"));
        var sunrise = parseInt(localStorage.getItem("sunrise"));
        var sunset = parseInt(localStorage.getItem("sunset"));
        var location = localStorage.getItem("ow_location") + localStorage.getItem("wu_location");
        var current_epoch = (localStorage.getItem("current_epoch") - offset);
        var ownName = arguments.callee.toString();

        lastSend = (lastSend - offset);

        ownName = ownName.substr('function '.length);        // trim off "function "
        ownName = ownName.substr(0, ownName.indexOf('('));        // trim off everything after the function name


        if (debug_flag > -1) {
            console.log("\n\n****** FM Futura JS Stored Values send block *******"
                        + "\nDay1: " + parseInt(localStorage.getItem("day1_cond")) + " " + localStorage.getItem("day1_temp") + " " + localStorage.getItem("day1_info")
                        + "\nDay2: " + parseInt(localStorage.getItem("day2_cond")) + " " + localStorage.getItem("day2_temp") + " " + localStorage.getItem("day2_info")
                        + "\nDay3: " + parseInt(localStorage.getItem("day3_cond")) + " " + localStorage.getItem("day3_temp") + " " + localStorage.getItem("day3_info")
                        + "\nDay4: " + parseInt(localStorage.getItem("day4_cond")) + " " + localStorage.getItem("day4_temp") + " " + localStorage.getItem("day4_info")
                        + "\nDay5: " + parseInt(localStorage.getItem("day5_cond")) + " " + localStorage.getItem("day5_temp") + " " + localStorage.getItem("day5_info")
                        + "\n****** END JS Stored Values *******\n\n")
        }

        Pebble.sendAppMessage({
"day1_temp": day1_temp,
"day1_cond": day1_cond,
"day2_temp": day2_temp,
"day2_cond": day2_cond,
"day2_info": "High",
"day3_temp": day3_temp,
"day3_cond": day3_cond,
"day3_info": "Low",
"day4_temp": day4_temp,
"day4_cond": day4_cond,
"day4_time": day4_info,
"day5_temp": day5_temp,
"day5_cond": day5_cond,
"day5_time": day5_info,
"sunrise": sunrise,
"sunset": sunset,
"current_time": current_time,
"location": location,
"current_epoch": current_epoch
        });

        now = new Date().getTime();
        now = parseInt(Math.round(now / 1e3));
        localStorage.setItem("lastSend", parseInt(now));
        lastSend = localStorage.getItem("lastSend");
        updateInProgress = false;
        if (debug_flag > 0) {
            console.log("lastSend updated, set to " + lastSend);
            console.log("lastUpdate updated, set to " + localStorage.getItem("lastUpdate") + ", which was ");
            console.log(parseInt(now) - parseInt(localStorage.getItem("lastUpdate")) + " seconds ago");
            console.log("now = " + parseInt(now));
        }

    }

    else {
        //skip everything becuase two messages on top of each other might be the cause of the crash
        //so wait 10 seconds before sending again
        updateInProgress = false;
        if (debug_flag > 0) {
            console.log("NaN does NOT EQUAL " + (lastSend + 10) );
            console.log("ELSE skipping, sent less than 10 seconds ago, update in progress set to false");
            console.log("(lastSend + 10) - now = " + ((lastSend + 10) - now));
            console.log("(lastSend (" + lastSend + ") + 10) - now (" + now + ") = " + ((lastSend + 10) - now));
            console.log("so lastSend + 10 > now, lastSend " + lastSend + " > now " + now + "lastSend + 10 = " + (lastSend + 10));
        }
    }
    updateInProgress = false;
    //console.log(ownName + " closing ... setting update in progress = " + updateInProgress);
}


function iconFromWeatherId(weatherId) {
    var ownName = arguments.callee.toString();
    ownName = ownName.substr('function '.length);        // trim off "function "
    ownName = ownName.substr(0, ownName.indexOf('('));        // trim off everything after the function name
    if (debug_flag > 0) {
        console.log("FUNCTION NAME = " + ownName);
    }

    console.log("weatherID passed in, " + weatherId);
    if (weatherId < 200) {		    // 0-199 undefined, return lines?
        console.log("0-199 undefined, return lines, return 10 (fog lines)");
        return 10;
    } else if (weatherId < 300) {     // 200 series - thunderstorms,
        console.log("200 series - thunderstorms,, return 12 (thunderstorm)");
        return 12;
    } else if (weatherId < 600) {      // 300 to 321 defined as rain, 400-499 not defined, 500-599 is rain
        console.log("300 to 321 defined as rain, 400-499 not defined, 500-599 is rain, return 6 (rain)");
        return 6;
    } else if (weatherId < 700) { // 600-699 defined as snow
        console.log("600-699 defined as snow, return 8 (snow)");
        return 8;
    } else if (weatherId < 800) {		// 700-799 is mist, smoke, fog, etc. Return lines
        console.log("700-799 is mist, smoke, fog, etc.  return 10 (fog lines)");
        return 10;						// 900-99 is crazy atmospheric shit,
    } else  if (weatherId == 800 ) {		// 800 is clear
        console.log("800 is clear, return 0");
        return 0;
    } else if (weatherId < 804 ) {	// 801, 802, 803 are all partly cloudy
        console.log("801, 802, 803 are all partly cloudy, return 2");
        return 2;
    } else if (weatherId == 804 ) {
        // 804 = overcast. Should it be clouds, or lines? I love lines. So, lines. But it shoudl probably be clouds
        console.log("804 = overcast. Should it be clouds, or lines? I love lines. So, lines. But it shoudl probably be clouds, return 10");
        return 10;
    } else {
        console.log("900-99 is crazy atmospheric shit,900 to 962 ranges from tornado to calm. Most strange. Return 10");
        return 10;
    }
}


function iconFromWeatherString(weatherId) {
    var ownName = arguments.callee.toString();
    ownName = ownName.substr('function '.length);        // trim off "function "
    ownName = ownName.substr(0, ownName.indexOf('('));        // trim off everything after the function name
    if (debug_flag > 0) {
        console.log("FUNCTION NAME = " + ownName);
    }
    if (weatherId == "tstorms") {
        console.log("weatherId = " + weatherId + ", return 6, 211 (200 series - thunderstorms)"); // 200 series - thunderstorms, // 300 to 321 defined as rain, 400-499 not defined, 500-599 is rain
        return 211;
    } else if (weatherId == "rain") {
        console.log("weatherId = " + weatherId + ", return 6, 501 (300 to 321 defined as rain, 400-499 not defined, 500-599 is rain, return 6 (rain)"); // 200 series - thunderstorms, // 300 to 321 defined as rain, 400-499 not defined, 500-599 is rain
        return 501;
    } else if (weatherId == "chancetstorms") {
        console.log("weatherId = " + weatherId + ", return 12, 211 (200 series - thunderstorms)"); // 200 series - thunderstorms, // 300 to 321 defined as rain, 400-499 not defined, 500-599 is rain
        return 211;
    } else if (weatherId == "chancerain") {
        console.log("weatherId = " + weatherId + ", return 6, 501"); // 200 series - thunderstorms, // 300 to 321 defined as rain, 400-499 not defined, 500-599 is rain
        return 501;
    } else if (weatherId == "sleet") { 	// 600-699 defined as snow
        console.log("weatherId = " + weatherId + ", return 8, 611 (600-699 defined as snow, return 8 (snow)");
        return 611;
    } else if (weatherId == "snow") { 	// 600-699 defined as snow
        console.log("weatherId = " + weatherId + ", return 8, 601 (600-699 defined as snow, return 8 (snow)");
        return 601;
    } else if (weatherId == "flurries") { 	// 600-699 defined as snow
        console.log("weatherId = " + weatherId + ", return 8, 600 (600-699 defined as snow, return 8 (snow)");
        return 600;
    } else if (weatherId == "chancesnow") { 	// 600-699 defined as snow
        console.log("weatherId = " + weatherId + ", return 8, 601 (600-699 defined as snow, return 8 (snow)");
        return 601;
    } else if (weatherId == "chancesleet") { 	// 600-699 defined as snow
        console.log("weatherId = " + weatherId + ", return 8, 611 (600-699 defined as snow, return 8 (snow)");
        return 611;
    } else if (weatherId == "chanceflurries") { 	// 600-699 defined as snow
        console.log("weatherId = " + weatherId + ", return 8, 600 (600-699 defined as snow, return 8 (snow)");
        return 600;
    } else if (weatherId == "mostlycloudy" ) {		// 700-799 is mist, smoke, fog, etc. Return lines
        console.log("weatherId = " + weatherId + ", return 4, 711 (fog, for overcast clouds)");
        return 711;						// 900-99 is crazy atmospheric shit,
    } else if (weatherId == "cloudy" ) {		// 700-799 is mist, smoke, fog, etc. Return lines
        console.log("weatherId = " + weatherId + ", return 4, 804 (overcast clouds)");
        return 804;						// 900-99 is crazy atmospheric shit,
    } else if (weatherId == "clear") {		// 800 is clear
        console.log("weatherId = " + weatherId + ", return 0, 800 (sky is clear)");
        return 800;
    } else if (weatherId == "sunny") {		// 800 is clear
        console.log("weatherId = " + weatherId + ", return 0, 800 (sky is clear)");
        return 800;
    } else if (weatherId == "partlysunny") {	// 801, 802, 803 are all partly cloudy
        console.log("weatherId = " + weatherId + ", return 2, 801 (few clouds)");
        return 801;
    } else if (weatherId == "mostlysunny") {	// 801, 802, 803 are all partly cloudy
        console.log("weatherId = " + weatherId + ", return 2, 801 (few clouds)");
        return 801;
    } else if (weatherId == "partlycloudy") {	// 801, 802, 803 are all partly cloudy
        console.log("weatherId = " + weatherId + ", return 2, 801 (few clouds)");
        return 801;
    } else if (weatherId == "hazy" ) {   // 804 = overcast. Should it be clouds, or lines? I love lines. So, lines. But it shoudl probably be clouds
        console.log("weatherId = " + weatherId + ", return 10, 711 (smoke)");
        return 711;
    } else if (weatherId == "fog" ) {   // 804 = overcast. Should it be clouds, or lines? I love lines. So, lines. But it shoudl probably be clouds
        console.log("weatherId = " + weatherId + ", return 10, 741 (fog)");
        return 741;
    } else {							// 900 to 962 ranges from tornado to calm. Most strange.
        console.log("else return 10, 900 (900 is tornado, 700s and 900s are severe and descriptive, currently assigned to ICON_WIND");
        return 900;
    }
}