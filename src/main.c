//working set version
#include <pebble.h>

#include "weather_layer.h"
#include "network.h"
#include "config.h"

#define TIME_FRAME      (GRect(0, 2, 144, 168-6))
#define DATE_FRAME      (GRect(1, 66, 144, 168-62))

/* Keep a pointer to the current weather data as a global variable */
static WeatherData *weather_data;

/* Global variables to keep track of the UI elements */
static Window *window;
static TextLayer *date_layer;
static TextLayer *time_layer;
static WeatherLayer *weather_layer;
static WeatherLayer *hourly_left_layer;
static WeatherLayer *hourly_right_layer;
static WeatherLayer *forecast_left_layer;
static WeatherLayer *forecast_right_layer;
static Layer *hourly_layer;
static Layer *forecast_layer;
static InverterLayer *day3_inverter_layer;
static InverterLayer *hourly_inverter_layer;

int window_step = 0;
int window_time = 0;

static char date_text[] = "XXX 00";
static char time_text[] = "00:00";

/* Preload the fonts */
GFont font_date;
GFont font_time;

void window_switch(void) {
    window_time = 57;
    if (window_step == 2) {
        layer_set_hidden(weather_layer, false);
        layer_set_hidden(hourly_layer, true);
        layer_set_hidden(forecast_layer, true);
        window_step = 0;
    } else if (window_step == 0) {
        layer_set_hidden(weather_layer, true);
        layer_set_hidden(hourly_layer, false);
        layer_set_hidden(forecast_layer, true);
        window_step = 1;
    } else if (window_step == 1) {
        layer_set_hidden(weather_layer, true);
        layer_set_hidden(hourly_layer, true);
        layer_set_hidden(forecast_layer, false);
        window_step = 2;
    }
    //window_step = (window_step + 1) % 6;
    APP_LOG(APP_LOG_LEVEL_DEBUG, "window step %d", window_step);
}

void accel_tap_handler(AccelAxisType axis, int32_t direction) {
    APP_LOG(APP_LOG_LEVEL_INFO, "accl event received");
    window_switch();
}

static void handle_tick(struct tm *tick_time, TimeUnits units_changed)
{
  if (units_changed & MINUTE_UNIT) {
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
  if (units_changed & DAY_UNIT) {
    // Update the date - Without a leading 0 on the day of the month
    char day_text[4];
    strftime(day_text, sizeof(day_text), "%a", tick_time);
    snprintf(date_text, sizeof(date_text), "%s %i", day_text, tick_time->tm_mday);
    text_layer_set_text(date_layer, date_text);
  }

  // Update the bottom half of the screen: icon and temperature
    bool stale = false;
    static int animation_step = 0;
  if (weather_data->updated == 0 && weather_data->error == WEATHER_E_OK)
  {
    // 'Animate' loading icon until the first successful weather request
    if (animation_step == 0) {
      weather_layer_set_icon(weather_layer, WEATHER_ICON_LOADING1);
    }
    else if (animation_step == 1) {
      weather_layer_set_icon(weather_layer, WEATHER_ICON_LOADING2);
    }
    else if (animation_step >= 2) {
      weather_layer_set_icon(weather_layer, WEATHER_ICON_LOADING3);
        request_weather();
        
        
        /*
        static int retry_counter = 15;
        if (retry_counter < 15) {
            retry_counter = retry_counter + 1;
            APP_LOG(APP_LOG_LEVEL_DEBUG, "retrying request_weather() in %d sec", 45 - (retry_counter * 3));
        } else if (retry_counter == 15) {
            request_weather();
            retry_counter = 0;
        }  */
    }
    animation_step = (animation_step + 1) % 3;
  }
  else {
    // Update the weather icon and temperature
    if (weather_data->error) {
        stale = true;
//      weather_layer_set_icon(weather_layer, WEATHER_ICON_PHONE_ERROR);
    }
    else {
      // Show the temperature as 'stale' if it has not been updated in 30 minutes

      if (weather_data->updated > time(NULL) + 1800) {
        stale = true;
      }
        bool big = false;
        bool small = true;
        int debug_flag = 0;
        if (debug_flag > 0) {
            weather_layer_set_temperature(weather_layer, (rand() % 180) - 50, rand() % 2, big);
            weather_layer_set_temperature(hourly_left_layer, (rand() % 180) - 50, rand() % 2, small);
            weather_layer_set_temperature(hourly_right_layer, (rand() % 180) - 50, rand() % 2, small);
        }
        else {
            weather_layer_set_temperature(weather_layer, weather_data->day1_temp, stale, big);
            weather_layer_set_temperature(hourly_left_layer, weather_data->day2_temp, stale, small);
            weather_layer_set_temperature(hourly_right_layer, weather_data->day3_temp, stale, small);
            weather_layer_set_temperature(forecast_left_layer, weather_data->day4_temp, stale, small);
            weather_layer_set_temperature(forecast_right_layer, weather_data->day5_temp, stale, small);
            
        }

      // Day/night check
        bool night_time = false;
        bool day_time = true;
        if (weather_data->current_time < weather_data->sunrise || weather_data->current_time > weather_data->sunset) {
            night_time = true;
            day_time = false;
        }
        layer_set_hidden(inverter_layer_get_layer(hourly_inverter_layer), day_time);        
        if (debug_flag > 0) {
            weather_layer_set_icon(weather_layer, rand() % 23);
            weather_layer_set_icon(hourly_left_layer, rand() % 23);
            weather_layer_set_icon(hourly_right_layer, rand() % 23);
        }
        else {
            weather_layer_set_icon(weather_layer, weather_icon_for_condition(weather_data->day1_cond, night_time));
            weather_layer_set_icon(hourly_left_layer, weather_icon_for_condition(weather_data->day2_cond, night_time));
            weather_layer_set_icon(hourly_right_layer, weather_icon_for_condition(weather_data->day3_cond, day_time));
            weather_layer_set_icon(forecast_left_layer, weather_icon_for_condition(weather_data->day4_cond, night_time));
            weather_layer_set_icon(forecast_right_layer, weather_icon_for_condition(weather_data->day5_cond, night_time));
        }
        
        //APP_LOG(APP_LOG_LEVEL_INFO, "setting day indicator with %i %i", weather_data->day4_time, weather_data->day5_time);
        if (debug_flag > -1) {
        weather_layer_set_time(forecast_right_layer, weather_data->day5_time);
        weather_layer_set_time(forecast_left_layer, weather_data->day4_time);
        }
    }
  }
    
  // Refresh the weather info every 15 minutes
    //window_switch();
//    layer_set_hidden(hourly_layer, rand() % 2);
    if (window_time > 1) {
        window_time = window_time - 1;
    } else if (window_time > 0) {
        layer_set_hidden(weather_layer, false);
        layer_set_hidden(hourly_layer, true);
        layer_set_hidden(forecast_layer, true);
        window_step = 0;
        window_time = 0;
    }
    
  if (units_changed & MINUTE_UNIT && (tick_time->tm_min % 2) == 0)
  {
    request_weather();
  }
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
  weather_layer = weather_layer_create(GRect(0, 90, 144, 80), big);
  layer_add_child(window_get_root_layer(window), weather_layer);

    hourly_left_layer = weather_layer_create(GRect(0, 90, 144, 80), small);
//    layer_add_child(window_get_root_layer(window), hourly_left_layer);
    
    hourly_right_layer = weather_layer_create(GRect(72, 90, 144, 80), small);
//    layer_add_child(window_get_root_layer(window), hourly_right_layer);
    
    hourly_layer = layer_create(GRect(0, 0, 144, 168));
    layer_add_child(hourly_layer, hourly_left_layer);
    layer_add_child(hourly_layer, hourly_right_layer);
    layer_set_hidden(hourly_layer, true);
    layer_add_child(window_get_root_layer(window), hourly_layer);
    
    forecast_left_layer = weather_layer_create(GRect(0, 90, 144, 80), small);
    forecast_right_layer = weather_layer_create(GRect(72, 90, 144, 80), small);
    forecast_layer = layer_create(GRect(0, 0, 144, 168));
    day3_inverter_layer = inverter_layer_create(GRect(0, 10, 72, 70));
    layer_add_child(forecast_layer, forecast_left_layer);
    layer_add_child(forecast_layer, forecast_right_layer);
    layer_add_child(hourly_right_layer, inverter_layer_get_layer(day3_inverter_layer));
    layer_set_hidden(inverter_layer_get_layer(day3_inverter_layer), false);
    hourly_inverter_layer = inverter_layer_create(GRect(0, 100, 144, 80));
    layer_set_hidden(forecast_layer, true);
    layer_add_child(window_get_root_layer(window), forecast_layer);

    hourly_inverter_layer = inverter_layer_create(GRect(0, 100, 144, 80));
    layer_set_hidden(inverter_layer_get_layer(hourly_inverter_layer), true);
    //layer_add_child(hourly_layer, inverter_layer_get_layer(hourly_inverter_layer));	
    layer_add_child(window_get_root_layer(window), inverter_layer_get_layer(hourly_inverter_layer));
	
  // Update the screen right away
  time_t now = time(NULL);
  handle_tick(localtime(&now), SECOND_UNIT | MINUTE_UNIT | HOUR_UNIT | DAY_UNIT );
  // And then every second
  tick_timer_service_subscribe(SECOND_UNIT, handle_tick);
    accel_tap_service_subscribe(accel_tap_handler);
}

static void deinit(void) {
  window_destroy(window);
  tick_timer_service_unsubscribe();

  text_layer_destroy(time_layer);
    text_layer_destroy(date_layer);
    weather_layer_destroy(weather_layer);
    weather_layer_destroy(hourly_left_layer);
    weather_layer_destroy(hourly_right_layer);

  fonts_unload_custom_font(font_date);
  fonts_unload_custom_font(font_time);

  free(weather_data);
}

int main(void) {
  init();
  app_event_loop();
  deinit();
}
