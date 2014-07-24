//working set version


var day1_temp, day1_cond, day2_temp, day2_cond, day3_temp, day3_cond, day4_temp, day4_cond, day4_info, day5_temp, day5_cond, day5_info, sunrise, sunset, current_time, current_hour, current_minute, current_epoch, pretty_hour;
var debug_flag = 0;
var provider_flag = 0;
var updateInProgress = false;

if (provider_flag == 0) {
    console.log("provider: openweather.org");
}
if (provider_flag == 1) {
    console.log("provider: weatherunderground.com");
}

Pebble.addEventListener("ready", function(e) {
    console.log("ready, starting ...");
    checkRequestTime();
    //updateWeather();
});

Pebble.addEventListener("appmessage", function(e) {
    console.log("AppMessage recieved");
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

    if (debug_flag > 4) {
        console.log("FUNCTION NAME = " + ownName + " debug_flag " + debug_flag);
        console.log("Should I start a request?");
    }
    var lastUpdate;
    var now = new Date().getTime();
    now = Math.round(now / 1e3);
    if (debug_flag > 4) {
        console.log("now time " + now);
    }
    var delay = 29;
    if (debug_flag > 4) {
        console.log("lastUpdate: " + localStorage.getItem("lastUpdate"));
    }
    if (!(localStorage.getItem("lastUpdate"))) {
        if (debug_flag > 4) {
            console.log("local storage of lastUpdate not found");
        }
        if (debug_flag > 4) {
            console.log("setting lastupdate to " + lastUpdate + ", " + (now - lastUpdate + " seconds ago"));
        }
        lastUpdate = now - (delay + 1);
        localStorage.setItem("lastUpdate", lastUpdate);
    } else {
        lastUpdate = parseInt(localStorage.getItem("lastUpdate"));
        if (debug_flag > 4) {
            console.log("localStorage.lastUpdate found: " + lastUpdate);
        }
    }
    if ((lastUpdate + delay) < now) {
        if (debug_flag > 4) {
            console.log("overdue " + (now - (lastUpdate + delay)) + " seconds!!");
        }

        now = parseInt(Math.round(now));
        localStorage.setItem("lastUpdate", parseInt(now));
        updateInProgress = false;
        updateWeather();

    } else if ((lastUpdate + delay) > now) {
        var stale = parseInt((lastUpdate + delay) - now);
        if (debug_flag > 4) {
            console.log("debug_flag = " + debug_flag);
            console.log("please wait " + stale + " seconds");
            console.log("is " + (delay - stale) + " > " + delay + "? No.");
        }

    }


}

function updateWeather() {
    if (debug_flag > 0) {
        console.log("checking to see if updateInProgress");
        console.log("debug_flag = " + debug_flag);
    }
    if (!updateInProgress) {
        updateInProgress = true;
        if (debug_flag > 0) {
            console.log("nope! No update in progress!");
        }
        var locationOptions = { "timeout": 15000, "maximumAge": 300000 };
        navigator.geolocation.getCurrentPosition(locationSuccess, locationError, locationOptions);
    }
    else {
        if (debug_flag > 0) {
            console.log("Not starting a new request. Another one is in progress...");
        }
    }
}

function locationSuccess(pos) {
    var coordinates = pos.coords;
    if (debug_flag > 0) {
        console.log("Location Success!!\nGot coordinates:\n" + JSON.stringify(coordinates));
    }
    if (provider_flag == 0) {
        fetchOpenweatherConditions(coordinates.latitude, coordinates.longitude);
        console.log("configured for openweathermap.org")
    } else if (provider_flag == 1) {
        fetchWeatherundergroundConditions(coordinates.latitude, coordinates.longitude);
        //fetchWeatherundergroundConditions(-27.000001, 152.000001); // for testing
        console.log("configured for wunderground.com")

    }
}

function locationError(err) {
    console.warn('Location error (' + err.code + '): ' + err.message);
    Pebble.sendAppMessage({ "error": "Loc unavailable" });
    updateInProgress = false;
}

var temperature, icon, city, sunrise, sunset, condition, current_time, country;

function fetchOpenweatherConditions(latitude, longitude) {
    var debug_flag = 1;
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
//                var temperature, icon, city, sunrise, sunset, condition;
                var offset = new Date().getTimezoneOffset() * 60;
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
                console.log("calling fetchOpenweatherHourlyForecast(latitude, longitude)");
            }
        } else {
            console.log("Error");
            updateInProgress = false;
            Pebble.sendAppMessage({ "error": "HTTP Error" });
        }
    };
    req.send(null);
}

function fetchOpenweatherHourlyForecast(latitude, longitude) {
    var debug_flag = 1;
    var ownName = arguments.callee.toString();
    ownName = ownName.substr('function '.length);        // trim off "function "
    ownName = ownName.substr(0, ownName.indexOf('('));        // trim off everything after the function name
    console.log("FUNCTION NAME = " + ownName);
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
                current_time = ((Date.now()  / 1000)- offset) ; //% 86400;
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
                        //if (response.sys.country === "US") {
                        // Convert temperature to Fahrenheit if user is within the US
                        temperature = Math.round(((tempResult - 273.15) * 1.8) + 32);
                        //day2_temp = temperature;
                    }
                    else {
                        // Otherwise, convert temperature to Celsius
                        if (debug_flag > 0) {
                            console.log("country US = " + country);
                        }
                        temperature = Math.round(tempResult - 273.15);
                        //day2_temp = temperature;
                    }
                    timestamp = response.list[n].dt;
                    condition = response.list[n].weather[0].id;
                    day2_cond = condition;
                    day2_info = timestamp;
                    console.log("day2_info = " + day2_info);
                    day2_info = epochToTime(day2_info);
                    day2_info = pretty_hour;
                    console.log("day2_info = " + day2_info);

                    /*Pebble.sendAppMessage({
                     "day2_cond": day2_cond,
                     "day2_temp": day2_temp,
                     });*/

                    n = 5;
                    tempResult = response.list[n].main.temp;
                    //country = response.city.country;
                    if (debug_flag > 0) {
                        console.log("day 3 country: " + country);
                    }
                    if (country === "US") {
                        if (debug_flag > 0) {
                            console.log("country US = " + country);
                        }
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
                    timestamp = response.list[n].dt;
                    day3_cond = condition;
                    epochToTime(timestamp);
                    day3_info = pretty_hour;
//                    day3_info = epochToTime(timestamp);
                    console.log("day3_info = " + day3_info);

                    updateInProgress = false;
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
                    //day2_temp = temperature;

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

                    sendFMFutura(day1_temp, day1_cond, day2_temp, day2_cond, day2_info, day3_temp, day3_cond, day3_info, day4_temp, day4_cond, day4_info, day5_temp, day5_cond, day5_info, sunrise, sunset, current_time, location);
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
    req.open("GET", "http://api.wunderground.com/api/" + key + "/conditions/geolookup/q/" + latitude + "," + longitude + ".json", true);
    if (debug_flag > 0) {
        console.log("Weather Underground app key request!! key: " + key);
        console.log("http://api.wunderground.com/api/" + key + "/conditions/geolookup/q/" + latitude + "," + longitude + ".json");

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

                    if (response.location.country === "US") {
                        day1_temp = parseInt(response.current_observation.temp_f);
                    } else {
                        day1_temp = parseInt(response.current_observation.temp_c);
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
    req.open("GET", "http://api.wunderground.com/api/" + key + "/hourly/geolookup/q/" + latitude + "," + longitude + ".json", true);
    if (debug_flag > 0) {
        console.log("Weather Underground app key request!! key = " + key);
        console.log("http://api.wunderground.com/api/" + key + "/hourly/geolookup/q/" + latitude + "," + longitude + ".json");
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
                epochToTime
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

                if (debug_flag > 0) {
                    console.log("\n call inside of " + ownName +
                                "\nday1 temp " + day1_temp + " day1 cond " + day1_cond +
                                "\nday2 temp " + day2_temp + " day2 cond " + day2_cond + " day2_info " + day2_info +
                                "\nday3 temp " + day3_temp + " day3 cond " + day3_cond + " day3_info " + day3_info +
                                "\nday4 temp " + day4_temp + " day4 cond " + day4_cond + " day4_ifno " + day4_info +
                                "\nday5 temp " + day5_temp + " day5 temp " + day5_cond + " day5_info " + day5_info +
                                "\nSunrise: " + sunrise +
                                "\nSunset: " + sunset +
                                "\ncurrent_time: " + current_time);
                }

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
    req.open("GET", "http://api.wunderground.com/api/" + key + "/forecast/geolookup/q/" + latitude + "," + longitude + ".json", true);
    if (debug_flag > 0) {
        console.log("Weather Underground app key request!! key = " + key);
        console.log("http://api.wunderground.com/api/" + key + "/forecast/geolookup/q/" + latitude + "," + longitude + ".json");

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
                    } else {
                        day2_high = parseInt(response.forecast.simpleforecast.forecastday[0].high.celsius);
                    }

                    if (response.location.country === "US") {
                        day2_low = parseInt(response.forecast.simpleforecast.forecastday[0].low.fahrenheit);
                    } else {
                        day2_low = parseInt(response.forecast.simpleforecast.forecastday[0].low.celsius);
                    }

                    day2_temp = day2_high;
                    day3_temp = day2_low;
                    var m = 1
                            n = m -1 ;// array is day and night, in text rollup odd numbers night (contain low in temp), days (even numbers) contain high
                    day = 4;
                    if (debug_flag > 0) {
                        console.log("n " + n + " (array), m " + m + " (base), day = " + day);
                    }
                    //                    icon = iconFromWeatherString(response.forecast.simpleforecast.forecastday[n].icon);
                    day4_cond = iconFromWeatherString(response.forecast.simpleforecast.forecastday[n].icon);
                    day4_info = parseInt(response.forecast.simpleforecast.forecastday[n].date.epoch);
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


                    n = m;
                    day = 5;
                    if (debug_flag > 0) {
                        console.log("n " + n + " (array), m " + m + " (base), day = " + day);
                    }
                    day5_cond = iconFromWeatherString(response.forecast.simpleforecast.forecastday[n].icon);
                    day5_info = parseInt(response.forecast.simpleforecast.forecastday[n].date.epoch);
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

                    if (debug_flag > 0) {
                        console.log("\n call inside of " + ownName +
                                    "\nday1 temp " + day1_temp + " day1 cond " + day1_cond +
                                    "\nday2 temp " + day2_temp + " day2 cond " + day2_cond + " day2_info " + day2_info +
                                    "\nday3 temp " + day3_temp + " day3 cond " + day3_cond + " day3_info " + day3_info +
                                    "\nday4 temp " + day4_temp + " day4 cond " + day4_cond + " day4_ifno " + day4_info +
                                    "\nday5 temp " + day5_temp + " day5 temp " + day5_cond + " day5_info " + day5_info +
                                    "\nSunrise: " + sunrise +
                                    "\nSunset: " + sunset +
                                    "\ncurrent_time: " + current_time);
                    }

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
}

function fetchWeatherundergroundAstronomy(latitude, longitude) {
    //based on http://api.wunderground.com/api/6fe6c99a5d7df975/astronomy/q/Australia/Sydney.json
    var ownName = arguments.callee.toString();
    ownName = ownName.substr('function '.length);        // trim off "function "
    ownName = ownName.substr(0, ownName.indexOf('('));        // trim off everything after the function name
    if (debug_flag > 0) {
        console.log("FUNCTION NAME = " + ownName);
    }
    var key = "7d74aa6fc6691d6c"; //almanac info key for WU
    var response;
    var req = new XMLHttpRequest();
    req.open("GET", "http://api.wunderground.com/api/" + key + "/astronomy/geolookup/q/" + latitude + "," + longitude + ".json", true);
    if (debug_flag > 0) {
        console.log("http://api.wunderground.com/api/" + key + "/astronomy/geolookup/q/" + latitude + "," + longitude + ".json", true);
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

                    var offset = new Date().getTimezoneOffset() * 60;
                    current_epoch = Math.round(((Date.now()  / 1000) - offset));
                    console.log("((Date.now()  / 1000) - offset) = " + current_epoch);
                    current_epoch = current_epoch - (current_epoch % 60);
                    console.log("current epoch rounded to min = " + current_epoch);
                    today_in_seconds = current_epoch % 86400;
                    console.log("today_in_seconds = " + today_in_seconds);
                    current_minute = Math.round((today_in_seconds % 3600) / 60);
                    current_hour = Math.round((today_in_seconds - (current_minute * 60))/3600);
                    current_time = parseInt((current_hour * 100) + current_minute);
                    if (debug_flag > 0) {
                        console.log("\nFUNCTION NAME = " + ownName +
                                    "\ncurrent_epoch = " + current_epoch +
                                    "\ntoday_in_seconds = " + today_in_seconds +
                                    "\ncurrent_minute = " + current_minute +
                                    "\ncurrent_epoch - (current minutes) = " +
                                    "\ncurrent_hour = " + current_hour);

                    }


                    var location;
                    location = response.location.city;

                    sunrise = parseInt(response.sun_phase.sunrise.hour + "" + response.sun_phase.sunrise.minute);
                    sunset = parseInt(response.sun_phase.sunset.hour + "" + response.sun_phase.sunset.minute);

                    if (debug_flag > 0) {
                        //console.log("current_epoch = " + current_epoch + " current hour = " + current_hour + " current_minute = " + current_minute + " current_time " + current_time);

                        console.log("\nFUNCTION NAME = " + ownName +
                                    "\nday1 temp " + day1_temp + " day1 cond " + day1_cond +
                                    "\nday2 temp " + day2_temp + " day2 cond " + day2_cond + " day2_info " + day2_info +
                                    "\nday3 temp " + day3_temp + " day3 cond " + day3_cond + " day3_info " + day3_info +
                                    "\nday4 temp " + day4_temp + " day4 cond " + day4_cond + " day4_ifno " + day4_info +
                                    "\nday5 temp " + day5_temp + " day5 temp " + day5_cond + " day5_info " + day5_info +
                                    "\nSunrise: " + sunrise +
                                    "\nSunset: " + sunset +
                                    "\ncurrent_time: " + current_time +
                                    "\nlocation " + location);

                        console.log("calling sendFMFutura, message payload:\n" + day1_temp + day1_cond + day2_temp + day2_cond + day3_temp + day3_cond + day4_temp + day4_cond + day4_info + day5_temp + day5_cond + day5_info + sunrise + sunset + current_time + location);
                    }



                    sendFMFutura(day1_temp, day1_cond, day2_temp, day2_cond, day2_info, day3_temp, day3_cond, day3_info, day4_temp, day4_cond, day4_info, day5_temp, day5_cond, day5_info, sunrise, sunset, current_time, location);

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
}

function sendFMFutura(day1_temp, day1_cond, day2_temp, day2_cond, day2_info, day3_temp, day3_cond, day3_info, day4_temp, day4_cond, day4_info, day5_temp, day5_cond, day5_info, sunrise, sunset, current_time, location) {

    var ownName = arguments.callee.toString();
    ownName = ownName.substr('function '.length);        // trim off "function "
    ownName = ownName.substr(0, ownName.indexOf('('));        // trim off everything after the function name
    if (debug_flag > 0) {
        console.log("\nFUNCTION NAME = " + ownName +
                    "\ndebug flag = " + debug_flag +
                    "\nday1 temp " + day1_temp + " day1 cond " + day1_cond +
                    "\nday2 temp " + day2_temp + " day2 cond " + day2_cond + " day2 info " + day2_info +
                    "\nday3 temp " + day3_temp + " day3 cond " + day3_cond + " day3 info " + day3_info +
                    "\nday4 temp " + day4_temp + " day4 cond " + day4_cond + " day4_ifno " + day4_info +
                    "\nday5 temp " + day5_temp + " day5 temp " + day5_cond + " day5_info " + day5_info +
                    "\nSunrise: " + sunrise +
                    "\nSunset: " + sunset +
                    "\ncurrent_time: " + current_time +
                    "\nlocation: " + location);
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
"location": location
    });
    var now = new Date().getTime();
    now = parseInt(Math.round(now / 1e3));
    localStorage.setItem("lastUpdate", parseInt(now));
    updateInProgress = false;
    if (debug_flag > 0) {
        console.log("last update set to " + localStorage.getItem("lastUpdate") + ", ");
        console.log(parseInt(now) - parseInt(localStorage.getItem("lastUpdate")) + " seconds ago");
        console.log("now = " + parseInt(now));
    }
    console.log(ownName + " message sent to phone, update in progress = false");
}


function iconFromWeatherString(weatherId) {

    if (weatherId == "tstorms") {
        console.log("weatherId = " + weatherId + ", return 6, 211"); // 200 series - thunderstorms, // 300 to 321 defined as rain, 400-499 not defined, 500-599 is rain
        return 211;
    } else if (weatherId == "rain") {
        console.log("weatherId = " + weatherId + ", return 6, 501"); // 200 series - thunderstorms, // 300 to 321 defined as rain, 400-499 not defined, 500-599 is rain
        return 501;
    } else if (weatherId == "chancetstorms") {
        console.log("weatherId = " + weatherId + ", return 12, 211"); // 200 series - thunderstorms, // 300 to 321 defined as rain, 400-499 not defined, 500-599 is rain
        return 211;
    } else if (weatherId == "chancerain") {
        console.log("weatherId = " + weatherId + ", return 6, 501"); // 200 series - thunderstorms, // 300 to 321 defined as rain, 400-499 not defined, 500-599 is rain
        return 501;
    } else if (weatherId == "sleet") { 	// 600-699 defined as snow
        console.log("weatherId = " + weatherId + ", return 8, 611");
        return 611;
    } else if (weatherId == "snow") { 	// 600-699 defined as snow
        console.log("weatherId = " + weatherId + ", return 8, 601");
        return 601;
    } else if (weatherId == "flurries") { 	// 600-699 defined as snow
        console.log("weatherId = " + weatherId + ", return 8, 600");
        return 600;
    } else if (weatherId == "chancesnow") { 	// 600-699 defined as snow
        console.log("weatherId = " + weatherId + ", return 8, 601");
        return 601;
    } else if (weatherId == "chancesleet") { 	// 600-699 defined as snow
        console.log("weatherId = " + weatherId + ", return 8, 611");
        return 611;
    } else if (weatherId == "chanceflurries") { 	// 600-699 defined as snow
        console.log("weatherId = " + weatherId + ", return 8, 600");
        return 600;
    } else if (weatherId == "mostlycloudy" ) {		// 700-799 is mist, smoke, fog, etc. Return lines
        console.log("weatherId = " + weatherId + ", return 4, 804 (overcast clouds)");
        return 804;						// 900-99 is crazy atmospheric shit,
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