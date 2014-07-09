//working set version
#include <pebble.h>
#include "weather_layer.h"
#include "main.h"

static uint8_t WEATHER_ICONS[] = {
    RESOURCE_ID_ICON_CLEAR_DAY,
    RESOURCE_ID_ICON_CLEAR_NIGHT,
    RESOURCE_ID_ICON_RAIN,
    RESOURCE_ID_ICON_SNOW,
    RESOURCE_ID_ICON_SLEET,
    RESOURCE_ID_ICON_WIND,
    RESOURCE_ID_ICON_FOG,
    RESOURCE_ID_ICON_CLOUDY,
    RESOURCE_ID_ICON_PARTLY_CLOUDY_DAY,
    RESOURCE_ID_ICON_PARTLY_CLOUDY_NIGHT,
    RESOURCE_ID_ICON_THUNDER,
    RESOURCE_ID_ICON_RAIN_SNOW,
    RESOURCE_ID_ICON_RAIN_SLEET,
    RESOURCE_ID_ICON_SNOW_SLEET,
    RESOURCE_ID_ICON_COLD,
    RESOURCE_ID_ICON_HOT,
    RESOURCE_ID_ICON_DRIZZLE,
    RESOURCE_ID_ICON_NOT_AVAILABLE,
    RESOURCE_ID_ICON_PHONE_ERROR,
    RESOURCE_ID_ICON_CLOUD_ERROR,
    RESOURCE_ID_ICON_LOADING1,
    RESOURCE_ID_ICON_LOADING2,
    RESOURCE_ID_ICON_LOADING3,
};

// Keep pointers to the two fonts we use.
static GFont large_font, small_font, tiny_font;

WeatherLayer *weather_layer_create(GRect frame, bool is_small) {
    // Create a new layer with some extra space to save our custom Layer infos
    WeatherLayer *weather_layer = layer_create_with_data(frame, sizeof(WeatherLayerData));
    WeatherLayerData *wld = layer_get_data(weather_layer);

    large_font = fonts_load_custom_font(resource_get_handle(RESOURCE_ID_FUTURA_40));
    small_font = fonts_load_custom_font(resource_get_handle(RESOURCE_ID_FUTURA_35));
    tiny_font = fonts_load_custom_font(resource_get_handle(RESOURCE_ID_FUTURA_18));

    // Add background layer



    // Add temperature layer
    if (is_small == false) {

        if (debug_flag > 0) {
            APP_LOG(APP_LOG_LEVEL_DEBUG, "creating BIG temp frame");
        }
        wld->temp_layer_background = text_layer_create(GRect(0, 10, 144, 68));
        text_layer_set_background_color(wld->temp_layer_background, GColorWhite);
        wld->temp_layer = text_layer_create(GRect(70, 19, 72, 80));
        text_layer_set_background_color(wld->temp_layer, GColorClear);
        text_layer_set_text_alignment(wld->temp_layer, GTextAlignmentCenter);
        text_layer_set_font(wld->temp_layer, tiny_font);
    }

    if (is_small == true) {
        APP_LOG(APP_LOG_LEVEL_DEBUG, "creating small temp frame");
        wld->temp_layer_background = text_layer_create(GRect(0, 10, 72, 68));
        text_layer_set_background_color(wld->temp_layer_background, GColorWhite);
        wld->temp_layer = text_layer_create(GRect(3, 11, 60, 60));
        text_layer_set_background_color(wld->temp_layer, GColorClear);
        text_layer_set_text_color(wld->temp_layer, GColorBlack);
        text_layer_set_text_alignment(wld->temp_layer, GTextAlignmentLeft);
        text_layer_set_font(wld->temp_layer, tiny_font);
    }

    layer_add_child(weather_layer, text_layer_get_layer(wld->temp_layer_background));
    wld->icon_layer = bitmap_layer_create(GRect(9, 13, 60, 60));
    layer_add_child(weather_layer, bitmap_layer_get_layer(wld->icon_layer));
    layer_add_child(weather_layer, text_layer_get_layer(wld->temp_layer));
    //info layer, used to show text of any kind
    int tall = 20;
    wld->info_layer = text_layer_create(GRect(2, 78 - tall, 144, tall));
    text_layer_set_background_color(wld->info_layer, GColorClear);
    text_layer_set_text_color(wld->info_layer, GColorBlack);
    text_layer_set_font(wld->info_layer, fonts_get_system_font(FONT_KEY_GOTHIC_18_BOLD));
	text_layer_set_overflow_mode(wld->info_layer, GTextOverflowModeFill);
    //text_layer_set_font(wld->info_layer, tiny_font);
    layer_add_child(weather_layer, text_layer_get_layer(wld->info_layer));

    wld->icon = NULL;
    return weather_layer;
}

void weather_layer_set_temperature(WeatherLayer* weather_layer, int16_t t, bool is_stale, bool is_small) {
    
    WeatherLayerData *wld = layer_get_data(weather_layer);
    
    if (is_small == true) {
        //APP_LOG(APP_LOG_LEVEL_DEBUG, "small");
        snprintf(wld->temp_str, sizeof(wld->temp_str), "%i%s", t, is_stale ? "" : "°");
        text_layer_set_font(wld->temp_layer, tiny_font);
    }
    if (is_small == false) {
        //APP_LOG(APP_LOG_LEVEL_DEBUG, "not small");
        snprintf(wld->temp_str, sizeof(wld->temp_str), "%i%s", t, is_stale ? " " : "°");
        
        // Temperature between -9° -> 9° or 20° -> 99°
        if ((t >= -9 && t <= 9) || (t >= 20 && t < 100)) {
            text_layer_set_font(wld->temp_layer, large_font);
            text_layer_set_text_alignment(wld->temp_layer, GTextAlignmentCenter);
            
            // Is the temperature below zero?
            if (wld->temp_str[0] == '-') {
                memmove(
                        wld->temp_str + 1 + 1,
                        wld->temp_str + 1,
                        5 - (1 + 1)
                        );
                memcpy(&wld->temp_str[1], " ", 1);
            }
        }
        // Temperature between 10° -> 19°
        else if (t >= 10 && t < 20) {
            text_layer_set_font(wld->temp_layer, large_font);
            text_layer_set_text_alignment(wld->temp_layer, GTextAlignmentLeft);
        }
        // Temperature above 99° or below -9°
        else {
            text_layer_set_font(wld->temp_layer, small_font);
            text_layer_set_text_alignment(wld->temp_layer, GTextAlignmentCenter);
        }
    }

    text_layer_set_text(wld->temp_layer, wld->temp_str);
}

void weather_layer_set_info(WeatherLayer *weather_layer, const char *string) {
    WeatherLayerData *wld = layer_get_data(weather_layer);
    snprintf(wld->info_str, sizeof(wld->info_str), "%s", string);
    text_layer_set_text(wld->info_layer, wld->info_str);
    
    //APP_LOG(APP_LOG_LEVEL_DEBUG, "string accepted %s", string);
    //APP_LOG(APP_LOG_LEVEL_DEBUG, "wld->info_str %s", wld->info_str);
    

}

void weather_layer_set_time(WeatherLayer *weather_layer, uint32_t timestamp) {
    WeatherLayerData *wld = layer_get_data(weather_layer);
    
    char time_text[] = "Day 00:00";
    time_t weekday_t = timestamp;
    struct tm *weekday_tm = localtime(&weekday_t);
    
    strftime(   time_text,
             sizeof(time_text),
             clock_is_24h_style() ? "%a" : "%a",
             weekday_tm);
    
    if (time_text[0] == '0') {
        memmove(time_text, &time_text[1], sizeof(time_text) - 1);
    }
    
    snprintf(wld->info_str, sizeof(wld->info_str), "%s", time_text);
    text_layer_set_text(wld->info_layer, wld->info_str);
    
    if (debug_flag > 0) {
        APP_LOG(APP_LOG_LEVEL_DEBUG, "passed timestamp %lu ", timestamp);
        APP_LOG(APP_LOG_LEVEL_DEBUG, "set text to %s ", time_text);
    }
}

void weather_layer_set_icon(WeatherLayer* weather_layer, WeatherIcon icon) {
    WeatherLayerData *wld = layer_get_data(weather_layer);
    
    GBitmap *new_icon =  gbitmap_create_with_resource(WEATHER_ICONS[icon]);
    // Display the new bitmap
    bitmap_layer_set_bitmap(wld->icon_layer, new_icon);
    
    // Destroy the ex-current icon if it existed
    if (wld->icon != NULL) {
        // A cast is needed here to get rid of the const-ness
        gbitmap_destroy(wld->icon);
    }
    wld->icon = new_icon;
}

void weather_layer_cleanup(void) {
    fonts_unload_custom_font(large_font);
    fonts_unload_custom_font(small_font);
    
}

void weather_layer_destroy(WeatherLayer* weather_layer) {
    WeatherLayerData *wld = layer_get_data(weather_layer);

    text_layer_destroy(wld->temp_layer);
    text_layer_destroy(wld->temp_layer_background);
    bitmap_layer_destroy(wld->icon_layer);

    // Destroy the previous bitmap if we have one
    if (wld->icon != NULL) {
        gbitmap_destroy(wld->icon);
    }
    layer_destroy(weather_layer);

//  fonts_unload_custom_font(large_font);
//  fonts_unload_custom_font(small_font);
}

/*
 * Converts an API Weather Condition into one of our icons.
 * Refer to: http://bugs.openweathermap.org/projects/api/wiki/Weather_Condition_Codes
 */

uint8_t weather_icon_for_condition(int c, bool night_time) {
    // Thunderstorm

    if (c < 1) {
        if (debug_flag > 0) {
            APP_LOG(APP_LOG_LEVEL_DEBUG, "WEATHER_ICON_CLOUD_ERROR");
        }
        return WEATHER_ICON_CLOUD_ERROR;
    }
    if (c < 300) {
        if (debug_flag > 0) {
            APP_LOG(APP_LOG_LEVEL_DEBUG, "WEATHER_ICON_THUNDER");
        }
        return WEATHER_ICON_THUNDER;
    }
    // Drizzle
    else if (c < 500) {
        if (debug_flag > 0) {
            APP_LOG(APP_LOG_LEVEL_DEBUG, "WEATHER_ICON_DRIZZLE");
        }
        return WEATHER_ICON_DRIZZLE;
    }
    // Rain / Freezing rain / Shower rain
    else if (c < 600) {
        if (debug_flag > 0) {
            APP_LOG(APP_LOG_LEVEL_DEBUG, "WEATHER_ICON_RAIN");
        }
        return WEATHER_ICON_RAIN;
    }
    // Snow
    else if (c < 700) {
        if (debug_flag > 0) {
            APP_LOG(APP_LOG_LEVEL_DEBUG, "WEATHER_ICON_SNOW");
        }
        return WEATHER_ICON_SNOW;
    }
    // Fog / Mist / Haze / etc.
    else if (c < 771) {
        if (debug_flag > 0) {
            APP_LOG(APP_LOG_LEVEL_DEBUG, "WEATHER_ICON_FOG");
        }
        return WEATHER_ICON_FOG;
    }
    // Tornado / Squalls
    else if (c < 800) {
        if (debug_flag > 0) {
            APP_LOG(APP_LOG_LEVEL_DEBUG, "WEATHER_ICON_WIND");
        }
        return WEATHER_ICON_WIND;
    }
    // Sky is clear
    else if (c == 800) {
        if (night_time) {
            if (debug_flag > 0) {
                APP_LOG(APP_LOG_LEVEL_DEBUG, "WEATHER_ICON_CLEAR_NIGHT");
            }
            return WEATHER_ICON_CLEAR_NIGHT;
        }
        else {
            if (debug_flag > 0) {
                APP_LOG(APP_LOG_LEVEL_DEBUG, "WEATHER_ICON_CLEAR_DAY");
            }
            return WEATHER_ICON_CLEAR_DAY;
        }
    }
    else if (c < 804) {
        if (night_time) {
            if (debug_flag > 0) {
                APP_LOG(APP_LOG_LEVEL_DEBUG, "WEATHER_ICON_PARTLY_CLOUDY_NIGHT");
            }
            return WEATHER_ICON_PARTLY_CLOUDY_NIGHT;
        } else {
            if (debug_flag > 0) {
                APP_LOG(APP_LOG_LEVEL_DEBUG, "WEATHER_ICON_PARTLY_CLOUDY_DAY");
            }
            return WEATHER_ICON_PARTLY_CLOUDY_DAY;
        }
    }

    else if (c == 804) {
        if (debug_flag > 0) {
            APP_LOG(APP_LOG_LEVEL_DEBUG, "WEATHER_ICON_CLOUDY");
        }
        return WEATHER_ICON_CLOUDY;
        //return WEATHER_ICON_FOG;
    }
    // Extreme
    else if ((c >= 900 && c < 903) || (c > 904 && c < 1000)) {
        if (debug_flag > 0) {
            APP_LOG(APP_LOG_LEVEL_DEBUG, "WEATHER_ICON_WIND");
        }
        return WEATHER_ICON_WIND;
    }
    // Cold
    else if (c == 903) {
        if (debug_flag > 0) {
            APP_LOG(APP_LOG_LEVEL_DEBUG, "WEATHER_ICON_COLD");
        }
        return WEATHER_ICON_COLD;
    }
    // Hot
    else if (c == 904) {
        if (debug_flag > 0) {
            APP_LOG(APP_LOG_LEVEL_DEBUG, "WEATHER_ICON_HOT");
        }
        return WEATHER_ICON_HOT;
    }
    else {
        // Weather condition not available
        if (debug_flag > 0) {
            APP_LOG(APP_LOG_LEVEL_DEBUG, "WEATHER_ICON_NOT_AVAILABLE");
        }
        return WEATHER_ICON_NOT_AVAILABLE;
    }
}