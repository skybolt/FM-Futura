//working set version
#include <pebble.h>

#include "weather_layer.h"
#include "network.h"
#include "config.h"
#include "bluetooth.h"
#include "futura.h"

#define TIME_FRAME      (GRect(0, 2, 144, 168-6))
#define DATE_FRAME      (GRect(1, 66, 144, 168-62))

/* Keep a pointer to the current weather data as a global variable */
static WeatherData *weather_data;

/* Global variables to keep track of the UI elements */


static Window *window;
static TextLayer *date_layer;
static TextLayer *time_layer;
WeatherLayer *conditions_layer;
static WeatherLayer *hourly_left_layer;
static WeatherLayer *hourly_right_layer;
static WeatherLayer *forecast_left_layer;
static WeatherLayer *forecast_right_layer;
static Layer *hourly_layer;
static Layer *forecast_layer;
static InverterLayer *day3_inverter_layer;
static InverterLayer *hourly_inverter_layer;
static InverterLayer *white_layer;
static InverterLayer *time_reverser_layer;
Layer* power_bar_layer;

static int window_step = 0;
static int window_time = 0;
static int delay_min = 10;
static int display_init = 3;
int debug_flag = 0;
int debug_return = 0;

static bool night_time = false;
static bool day_time = true;
bool stale = true;
bool big = false;
bool small = true;

static char date_text[] = "XXX 00";
static char time_text[] = "00:00";

/* Preload the fonts */
GFont font_date;
GFont font_time;

void white_layer_update_callback(Layer *layer, GContext* ctx) {
    graphics_context_set_fill_color(ctx, GColorWhite);
    graphics_fill_rect(ctx, layer_get_bounds(layer), 0, GCornerNone);
}

void black_layer_update_callback(Layer *layer, GContext* ctx) {
    graphics_context_set_fill_color(ctx, GColorBlack);
    graphics_fill_rect(ctx, layer_get_bounds(layer), 0, GCornerNone);
}

static void handle_battery(BatteryChargeState charge_state) {

    APP_LOG(APP_LOG_LEVEL_INFO, "battery handler invoked");
    int xPos = charge_state.charge_percent;
    xPos = (144 * xPos) / 100;
    layer_set_frame(power_bar_layer, GRect(xPos, 98, 2, 4));

    if (charge_state.is_charging) {
        APP_LOG(APP_LOG_LEVEL_DEBUG, "charge_state.is_charging, battery %i", charge_state.charge_percent);
        layer_set_hidden(inverter_layer_get_layer(time_reverser_layer), false);
    } else {
        layer_set_hidden(inverter_layer_get_layer(time_reverser_layer), true);
        APP_LOG(APP_LOG_LEVEL_DEBUG, "battery not charging, battery %i", charge_state.charge_percent);
    }
}

void window_switch(void) {
    window_time = 7;
    if (debug_flag > 0) {
        APP_LOG(APP_LOG_LEVEL_DEBUG, "window step was %d, night_time %i, day_time %i", window_step, night_time, day_time);
    }
    if (window_step == 0) {
        layer_set_hidden(conditions_layer, false);
        layer_set_hidden(hourly_layer, true);
        layer_set_hidden(forecast_layer, true);
//        layer_set_hidden(power_bar_layer, false);
        display_counter = display_init;
        window_step = 1;
    } else if (window_step == 1) {
        layer_set_hidden(conditions_layer, true);
        layer_set_hidden(hourly_layer, false);
        layer_set_hidden(forecast_layer, true);
        //      layer_set_hidden(power_bar_layer, false);
        display_counter = display_init;
        window_step = 2;
    } else if (window_step == 2) {
        layer_set_hidden(conditions_layer, true);
        layer_set_hidden(hourly_layer, true);
        layer_set_hidden(forecast_layer, false);
        //    layer_set_hidden(power_bar_layer, false);
        display_counter = display_init;
        window_step = 0;
    }
    //window_step = (window_step + 1) % 6;
    if (debug_flag > 0) {
        APP_LOG(APP_LOG_LEVEL_DEBUG, "window step %d, night_time %i, day_time %i", window_step, night_time, day_time);
    }
}

void accel_tap_handler(AccelAxisType axis, int32_t direction) {
    if (debug_flag > 0) {
        APP_LOG(APP_LOG_LEVEL_INFO, "accl event received");
    }
    window_switch();
}

int epochToHourMin(int epoch) {
    debug_flag = 0;
    if (debug_flag > 0) {
        APP_LOG(APP_LOG_LEVEL_DEBUG, "epoch = %i", epoch);
    }
    int hourMinInt;
    if (epoch < 2400) {
        if (debug_flag > 0) {
            APP_LOG(APP_LOG_LEVEL_DEBUG, "epoch %i < 2400, return epoch", epoch);
        }
        hourMinInt = epoch;
    } else {
        if (debug_flag > 0) {
            APP_LOG(APP_LOG_LEVEL_DEBUG, "epoch %i (%i) > 2400, return hourMinInt", epoch, epoch % 86400);
        }
        epoch = epoch % 86400;
        int hourInt = ((epoch - (epoch % 3600)) / 3600) * 100;
        if (debug_flag > 0) {
            APP_LOG(APP_LOG_LEVEL_DEBUG, "hourInt = %i", hourInt);
        }
        int minuteInt = (epoch % 3600) / 60;
        if (debug_flag > 0) {
            APP_LOG(APP_LOG_LEVEL_DEBUG, "minuteInt = %i", minuteInt);
        }
        hourMinInt = hourInt + minuteInt;
        if (debug_flag > 0) {
        }
    }
    if (debug_flag > 0) {
        APP_LOG(APP_LOG_LEVEL_DEBUG, "hourMinInt = %i", hourMinInt);
    }
    return hourMinInt;
}

static void handle_tick(struct tm *tick_time, TimeUnits units_changed) {

    int weather_timestamp = weather_data->current_time;
    time_t currentTime = time(0);
    int currentInt = time(NULL);
    //int delay = (delay_min * 60 * 2) + 0;
    int delay = (delay_min + 1) * 60;

//	debug_flag = 1;

    if (units_changed & MINUTE_UNIT) {

        request_weather();
//	    if (weather_timestamp - (currentInt - (delay * 10)) > 0)  {stale = false;} else {stale = true;}
        //APP_LOG(APP_LOG_LEVEL_DEBUG, "%i", (weather_timestamp - (currentInt - (delay * 10))));

        debug_flag = debug_return;
        // Update the time - Fix to deal with 12 / 24 centering bug
        time_t currentTime = time(0);
        struct tm *currentLocalTime = localtime(&currentTime);

        // Manually format the time as 12 / 24 hour, as specified
        strftime(   time_text,
                    sizeof(time_text),
                    clock_is_24h_style() ? "%R" : "%I:%M",
                    currentLocalTime);

        // Drop the first char of time_text if needed
        if (!clock_is_24h_style() && (time_text[0] == '0')) {
            memmove(time_text, &time_text[1], sizeof(time_text) - 1);
        }
        text_layer_set_text(time_layer, time_text);
    }

//    debug_flag = 1;
    if (debug_flag > 0) {
        APP_LOG(APP_LOG_LEVEL_DEBUG, "%i = current_epoch tuple", weather_data->current_epoch);
        //APP_LOG(APP_LOG_LEVEL_DEBUG, "%i int weather_timestamp", weather_timestamp);
        APP_LOG(APP_LOG_LEVEL_DEBUG, "%i int currentInt", currentInt);
        //APP_LOG(APP_LOG_LEVEL_DEBUG, "%i int delay", delay);
        APP_LOG(APP_LOG_LEVEL_DEBUG, "%i stale countdown (if neg, it's stale)", weather_data->current_epoch - (currentInt - delay)   );
        APP_LOG(APP_LOG_LEVEL_DEBUG, "%i stale (1 = stale, 0 = not stale", stale);
    }
    if (weather_data->current_epoch - (currentInt - delay) > 0)  {
        stale = false;
    }
    else {
        stale = true;
    }


    if (units_changed & DAY_UNIT) {
        // Update the date - Without a leading 0 on the day of the month
        char day_text[4];
        strftime(day_text, sizeof(day_text), "%a", tick_time);
        snprintf(date_text, sizeof(date_text), "%s %i", day_text, tick_time->tm_mday);
        text_layer_set_text(date_layer, date_text);
    }

    int sunrise = epochToHourMin(weather_data->sunrise);
    int sunset = epochToHourMin(weather_data->sunset);
    int current_time = epochToHourMin(currentInt);
    //if (weather_data->current_time < weather_data->sunrise || weather_data->current_time > weather_data->sunset) {
    //if (currentInt < weather_data->sunrise || currentInt > weather_data->sunset) {
    //debug_flag = 4;

    if (debug_flag > 3) {
        if (currentInt % 3 == 0) {
            night_time = rand() % 2;
            day_time = night_time + 1;
            layer_set_hidden(conditions_layer, false);  //bottom one?
            layer_set_hidden(hourly_layer, rand() % 2);  //over conditions
            layer_set_hidden(forecast_layer, rand() % 2); //over hourly
        }
    } else {
        //if (currentInt < sunrise || current_time > sunset) {

        if (debug_flag > 0) {
            APP_LOG(APP_LOG_LEVEL_DEBUG, "sunrise %i current time %i sunset %i", sunrise, current_time, sunset);
        }
        if (current_time < sunrise || current_time > sunset) {
            night_time = true;
            day_time = false;
            if (debug_flag > 0) {
                //    APP_LOG(APP_LOG_LEVEL_DEBUG, "sunrise %i current time %i sunset %i", weather_data->sunrise, weather_data->current_time, weather_data->sunset);
                APP_LOG(APP_LOG_LEVEL_DEBUG, "sunrise %i current time %i sunset %i", sunrise, current_time, sunset);
                APP_LOG(APP_LOG_LEVEL_DEBUG, "night_time = %i, day_time = %i", night_time, day_time);
            }

        } else {
            night_time = false;
            day_time = true;
            if (debug_flag > 0) {
                APP_LOG(APP_LOG_LEVEL_DEBUG, "sunrise %i current time %i sunset %i", sunrise, current_time, sunset);
                APP_LOG(APP_LOG_LEVEL_DEBUG, "night_time = %i, day_time = %i", night_time, day_time);
            }
        }
    }

    // Animate "loading" icon dots until the first successful weather request
    static int animation_step = 0;
    if (weather_data->updated == 0 && weather_data->error == WEATHER_E_OK) {
        if (animation_step == 0) {
            weather_layer_set_icon(conditions_layer, WEATHER_ICON_LOADING1);
            weather_layer_set_icon(hourly_left_layer, WEATHER_ICON_LOADING1);
            weather_layer_set_icon(forecast_left_layer, WEATHER_ICON_LOADING1);
        }
        else if (animation_step == 1) {
            weather_layer_set_icon(conditions_layer, WEATHER_ICON_LOADING2);
            weather_layer_set_icon(hourly_left_layer, WEATHER_ICON_LOADING2);
            weather_layer_set_icon(forecast_left_layer, WEATHER_ICON_LOADING2);
        }
        else if (animation_step >= 2) {
            weather_layer_set_icon(conditions_layer, WEATHER_ICON_LOADING3);
            weather_layer_set_icon(hourly_left_layer, WEATHER_ICON_LOADING3);
            weather_layer_set_icon(forecast_left_layer, WEATHER_ICON_LOADING3);
            request_weather();
        }
        animation_step = (animation_step + 1) % 3;
    }

    else {

        // Update the weather icon and temperature
        if (weather_data->updated == 0) {
            //stale = true;
            night_time = false;
            day_time = true;
        }

        //if stale flag sent from pebble.js == true, then set stale == true. This means that we can hand back saved values from local.saved but mark it stale. Nice!

        if (weather_data->error) {
            //stale = true;
            weather_layer_set_icon(conditions_layer, WEATHER_ICON_CLOUD_ERROR);
            weather_layer_set_temperature(conditions_layer, 99, stale, big);
        }

        else {
            //stuff goes here if there's not a weather error.
            weather_layer_set_temperature(conditions_layer, 88, stale, big);

        }

        // Show the temperature as 'stale' if it has not been updated within DELAY variable seconds
        //if (weather_data->updated < time(NULL) - delay) {stale = true;}


        //below commented out 1:27PM 8/11
        //int updated = weather_data->updated;
        //int stale_time = time(NULL) - delay;
        //int current_time = time(NULL);

        if (debug_flag > 0) {

            //  APP_LOG(APP_LOG_LEVEL_DEBUG, "current time = %i, updated = %i, stale_time = %i, delay = %i", current_time, updated, stale_time, delay);
            //APP_LOG(APP_LOG_LEVEL_DEBUG, "stale = %i", stale);
            //APP_LOG(APP_LOG_LEVEL_DEBUG, "update - stale_time = %i, stale_time - update = %i, stale = %i", updated - stale_time, stale_time - updated, stale);
            //APP_LOG(APP_LOG_LEVEL_DEBUG, "delay %i > curr_tm - %i %i, stale should false, diff %i", delay, updated, stale_time, stale_time - updated);
        }
        if (debug_flag > 3) {
            if (currentInt % 3 == 0) {
                weather_layer_set_temperature(conditions_layer,     (rand() % 180) - 50, rand() % 2, big);
                weather_layer_set_temperature(hourly_left_layer,    (rand() % 180) - 50, rand() % 2, small);
                weather_layer_set_temperature(hourly_right_layer,   (rand() % 180) - 50, rand() % 2, small);
                weather_layer_set_temperature(forecast_left_layer,  (rand() % 180) - 50, rand() % 2, small);
                weather_layer_set_temperature(forecast_right_layer, (rand() % 180) - 50, rand() % 2, small);
            }
        } else {
            weather_layer_set_temperature(conditions_layer, weather_data->day1_temp, stale, big);
            weather_layer_set_temperature(forecast_left_layer, weather_data->day4_temp, stale, small);
            weather_layer_set_temperature(forecast_right_layer, weather_data->day5_temp, stale, small);

            //layer_set_hidden(inverter_layer_get_layer(time_reverser_layer), (currentInt % 2));

            if (night_time == true) {
                weather_layer_set_temperature(hourly_left_layer, weather_data->day3_temp, stale, small);
                weather_layer_set_temperature(hourly_right_layer, weather_data->day2_temp, stale, small);

            } else if (night_time == false) {
                weather_layer_set_temperature(hourly_left_layer, weather_data->day2_temp, stale, small);
                weather_layer_set_temperature(hourly_right_layer, weather_data->day3_temp, stale, small);
            }

        }

        layer_set_hidden(inverter_layer_get_layer(hourly_inverter_layer), day_time);
        if (debug_flag > 0) {
            APP_LOG(APP_LOG_LEVEL_DEBUG, "set hourly inverter layer hidden = day_time = %i " + day_time);
        }

        if (debug_flag > 3) {
            if (currentInt % 3 == 0) {
                weather_layer_set_icon(conditions_layer, rand() % 17);
                weather_layer_set_icon(hourly_left_layer, rand() % 17);
                weather_layer_set_icon(hourly_right_layer, rand() % 17);
                weather_layer_set_icon(forecast_left_layer, rand() % 17);
                weather_layer_set_icon(forecast_right_layer, rand() % 17);
            }

        } else {

            if (bluetooth_connection_service_peek() == false) {
                if (debug_flag > 2) {
                    APP_LOG(APP_LOG_LEVEL_DEBUG, "bluetooth_connection_service_peek = %i", bluetooth_connection_service_peek());
                }
//                weather_layer_set_icon(conditions_layer, WEATHER_ICON_PHONE_ERROR);
//                weather_layer_set_icon(hourly_left_layer, WEATHER_ICON_PHONE_ERROR);
//                weather_layer_set_icon(forecast_left_layer, WEATHER_ICON_PHONE_ERROR);
                //layer_set_hidden(conditions_layer, false);
                //layer_set_hidden(hourly_layer, true);
                //layer_set_hidden(forecast_layer, true);
                weather_layer_set_info(conditions_layer, "BT disc");
                weather_layer_set_info(hourly_left_layer, "BT disc");
                weather_layer_set_info(hourly_right_layer, "");
                weather_layer_set_info(forecast_left_layer, "BT disc");
                weather_layer_set_info(forecast_right_layer, "");

            }

            else if (bluetooth_connection_service_peek() == true) {
                if (debug_flag > 2) {
                    APP_LOG(APP_LOG_LEVEL_DEBUG, "bluetooth_connection_service_peek = %i", bluetooth_connection_service_peek());
                }

                if (weather_data->location) {

                    if (display_counter > 1) {


                        layer_set_hidden(power_bar_layer, false);
                        weather_layer_set_info(conditions_layer, weather_data->location);

                        weather_layer_set_time(forecast_right_layer, weather_data->day5_time);
                        weather_layer_set_time(forecast_left_layer, weather_data->day4_time);
                        if (night_time == false) {
                            weather_layer_set_info(hourly_left_layer, weather_data->day2_info);
                            weather_layer_set_info(hourly_right_layer, weather_data->day3_info);
                        } else if (night_time == true) {
                            weather_layer_set_info(hourly_left_layer, weather_data->day3_info);
                            weather_layer_set_info(hourly_right_layer, weather_data->day2_info);
                        }
                        display_counter = display_counter - 1;
                    } else if (display_counter == 1) {
                        weather_layer_set_info(conditions_layer, "");
                        layer_set_hidden(power_bar_layer, true);
                        //weather_layer_set_info(conditions_layer, weather_data->location);
                        weather_layer_set_info(hourly_left_layer, "");
                        weather_layer_set_info(hourly_right_layer, "");
                        weather_layer_set_info(forecast_right_layer, "");
                        weather_layer_set_info(forecast_left_layer, "");
                    }
                    if (debug_flag > 1) {
                        APP_LOG(APP_LOG_LEVEL_INFO, "setting day indicator with %i %i", weather_data->day4_time, weather_data->day5_time);
                        weather_layer_set_time(forecast_right_layer, weather_data->day5_time);
                        weather_layer_set_time(forecast_left_layer, weather_data->day4_time);
                    }

                } else {
                    //this is what happens if there is no such thing as weather data location
                }

            }
            weather_layer_set_icon(conditions_layer, weather_icon_for_condition(weather_data->day1_cond, night_time));
            weather_layer_set_icon(hourly_left_layer, weather_icon_for_condition(weather_data->day2_cond, night_time));
            weather_layer_set_icon(hourly_right_layer, weather_icon_for_condition(weather_data->day3_cond, day_time));
            weather_layer_set_icon(forecast_left_layer, weather_icon_for_condition(weather_data->day4_cond, 0));
            weather_layer_set_icon(forecast_right_layer, weather_icon_for_condition(weather_data->day5_cond, 0));
        }

    }


    //set window times. Why?
    if (window_time > 1) {
        window_time = window_time - 1;
        APP_LOG(APP_LOG_LEVEL_DEBUG, "window_time = %i", window_time);
    } else if (window_time > 0) {
        layer_set_hidden(conditions_layer, false);
        layer_set_hidden(hourly_layer, true);
        layer_set_hidden(forecast_layer, true);
        //layer_set_hidden(power_bar_layer, true);
        window_step = 0;
        window_time = 0;
    }

    if (units_changed & MINUTE_UNIT && (tick_time->tm_min % delay_min) == 0)
    {
        //Refresh the weather info every 1 * delay_min minutes
        requests_queued = 0;
        request_weather();
    }

//    bool stale = false;

    //int delay = (delay_min * 60 * 2);
    //delay = (delay_min * 60) -1;
    //delay = 50;
    //if (weather_data->updated < time(NULL) - delay) {stale = true;}

    int debug_return = debug_flag;
    //if (weather_data->updated < stale_time) {
    /*    if (debug_flag > 0) {
            APP_LOG(APP_LOG_LEVEL_DEBUG, "current time = %i, updated = %i, stale_time = %i", current_time, updated, stale_time);
            APP_LOG(APP_LOG_LEVEL_DEBUG, "stale = %i", stale);
            APP_LOG(APP_LOG_LEVEL_DEBUG, "upd_t %i > curr_tm - %i %i, stale should false, diff %i", delay, updated, stale_time, stale_time - updated);
            // maybe change above line curr_tm - updated, (cuz upd is zero) to sompething plus update? I know, updated minus curr time? If update is 0, result -14029409403
            //and then stale = true. If UPD is now, then result 0. Then how to incorporate delay of 120? trigger time is curr_time - delay. (now - 120). Does that need to be positive?
            // if so, then updated minus now = ?? don't know try later.
        }  */
    debug_flag = debug_return;

}

static void init(void) {

    window = window_create();
    window_stack_push(window, true /* Animated */);
    window_set_background_color(window, GColorBlack);

    weather_data = malloc(sizeof(WeatherData));
    init_network(weather_data);

    font_date = fonts_load_custom_font(resource_get_handle(RESOURCE_ID_FUTURA_18));
    font_time = fonts_load_custom_font(resource_get_handle(RESOURCE_ID_FUTURA_CONDENSED_53));

    time_layer = text_layer_create(TIME_FRAME);
    text_layer_set_text_color(time_layer, GColorWhite);
    text_layer_set_background_color(time_layer, GColorClear);
    text_layer_set_font(time_layer, font_time);
    text_layer_set_text_alignment(time_layer, GTextAlignmentCenter);
    layer_add_child(window_get_root_layer(window), text_layer_get_layer(time_layer));

    date_layer = text_layer_create(DATE_FRAME);
    text_layer_set_text_color(date_layer, GColorWhite);
    text_layer_set_background_color(date_layer, GColorClear);
    text_layer_set_font(date_layer, font_date);
    text_layer_set_text_alignment(date_layer, GTextAlignmentCenter);
    layer_add_child(window_get_root_layer(window), text_layer_get_layer(date_layer));

    // Add weather layers
    bool big = false;
    bool small = true;
    conditions_layer = weather_layer_create(GRect(0, 90, 144, 80), big);
    layer_add_child(window_get_root_layer(window), conditions_layer);

    hourly_left_layer = weather_layer_create(GRect(0, 90, 144, 80), small);
//    layer_add_child(window_get_root_layer(window), hourly_left_layer);

    hourly_right_layer = weather_layer_create(GRect(72, 90, 144, 80), small);
//    layer_add_child(window_get_root_layer(window), hourly_right_layer);

    hourly_layer = layer_create(GRect(0, 0, 144, 168));
    layer_add_child(hourly_layer, hourly_right_layer);
    layer_add_child(hourly_layer, hourly_left_layer);
    layer_set_hidden(hourly_layer, true);
    layer_add_child(window_get_root_layer(window), hourly_layer);

    forecast_left_layer = weather_layer_create(GRect(0, 90, 144, 80), small);
    forecast_right_layer = weather_layer_create(GRect(72, 90, 144, 80), small);
    forecast_layer = layer_create(GRect(0, 0, 144, 168));
    day3_inverter_layer = inverter_layer_create(GRect(0, 10, 72, 70));
    layer_add_child(forecast_layer, forecast_right_layer);
    layer_add_child(forecast_layer, forecast_left_layer);
    layer_add_child(hourly_right_layer, inverter_layer_get_layer(day3_inverter_layer));
    layer_set_hidden(inverter_layer_get_layer(day3_inverter_layer), false);
    hourly_inverter_layer = inverter_layer_create(GRect(0, 100, 144, 80));
    layer_set_hidden(forecast_layer, true);

    hourly_inverter_layer = inverter_layer_create(GRect(0, 100, 144, 80));
    layer_set_hidden(inverter_layer_get_layer(hourly_inverter_layer), true);
    //layer_add_child(hourly_layer, inverter_layer_get_layer(hourly_inverter_layer));
    layer_add_child(window_get_root_layer(window), inverter_layer_get_layer(hourly_inverter_layer));
    layer_add_child(window_get_root_layer(window), forecast_layer);

    white_layer = inverter_layer_create(GRect(0,0,144,98));
    layer_add_child(window_get_root_layer(window), inverter_layer_get_layer(white_layer));

    // Update the screen right away
    time_t now = time(NULL);
    handle_tick(localtime(&now), SECOND_UNIT | MINUTE_UNIT | HOUR_UNIT | DAY_UNIT );
    // And then every second

    power_bar_layer = layer_create(GRect(-1, -1, 0, 0));
    layer_set_update_proc(power_bar_layer, white_layer_update_callback);
    layer_add_child(window_get_root_layer(window), power_bar_layer);

//    time_reverser_layer = inverter_layer_create(GRect(0, 0, 144, 98));
    time_reverser_layer = inverter_layer_create(GRect(0, 0, 144, 168));
    layer_add_child(window_get_root_layer(window), inverter_layer_get_layer(time_reverser_layer));
    layer_set_hidden(inverter_layer_get_layer(time_reverser_layer), true);

    tick_timer_service_subscribe(SECOND_UNIT, handle_tick);
    bluetooth_connection_service_subscribe(&handle_bluetooth);
    accel_tap_service_subscribe(accel_tap_handler);
    battery_state_service_subscribe(handle_battery);
    handle_battery(battery_state_service_peek());
}

static void deinit(void) {
    window_destroy(window);
    tick_timer_service_unsubscribe();

    text_layer_destroy(time_layer);
    text_layer_destroy(date_layer);
    weather_layer_destroy(conditions_layer);
    weather_layer_destroy(hourly_right_layer);
    weather_layer_destroy(hourly_left_layer);
    weather_layer_destroy(forecast_right_layer);
    weather_layer_destroy(forecast_left_layer);
    weather_layer_cleanup();

    fonts_unload_custom_font(font_date);
    fonts_unload_custom_font(font_time);

    free(weather_data);
}

int main(void) {
    init();
    app_event_loop();
    deinit();
}
