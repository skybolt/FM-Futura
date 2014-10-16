//working set version
#include <pebble.h>
#include "network.h"
//#include "bluetooth.h"
#include "futura.h"
int requests_queued = 0;
int crash_supressor = 0;

static void appmsg_in_received(DictionaryIterator *received, void *context) {
    if (debug_flag > 0) {APP_LOG(APP_LOG_LEVEL_DEBUG, "static void appmsg_in_received");}

    //if (crash_supressor < -1) {crash_supressor = crash_supressor + 1; APP_LOG(APP_LOG_LEVEL_DEBUG, "crash supressor = %i", crash_supressor);} else {
    int saver = debug_flag;
//    debug_flag = 1;
    requests_queued = 0;
    display_counter = 3;
    //stale = false;
    if (debug_flag > 0) {
        APP_LOG(APP_LOG_LEVEL_DEBUG, "In received.");
    }
    WeatherData *weather_data = (WeatherData*) context;

    Tuple *day1_temp_tuple = dict_find(received, KEY_DAY1_TEMP);
    if (debug_flag > 0) {
        APP_LOG(APP_LOG_LEVEL_DEBUG, "day1_temp ");
    }
    Tuple *day1_cond_tuple = dict_find(received, KEY_DAY1_COND);
    if (debug_flag > 0) {
        APP_LOG(APP_LOG_LEVEL_DEBUG, "day1_cond ");
    }
    Tuple *day2_temp_tuple = dict_find(received, KEY_DAY2_TEMP);
    if (debug_flag > 0) {
        APP_LOG(APP_LOG_LEVEL_DEBUG, "day2_temp ");
    }
    Tuple *day2_cond_tuple = dict_find(received, KEY_DAY2_COND);
    if (debug_flag > 0) {
        APP_LOG(APP_LOG_LEVEL_DEBUG, "day2_cond ");
    }
    Tuple *day2_info_tuple = dict_find(received, KEY_DAY2_INFO);
    if (debug_flag > 0) {
        APP_LOG(APP_LOG_LEVEL_DEBUG, "day2_info ");
    }
    Tuple *day3_temp_tuple = dict_find(received, KEY_DAY3_TEMP);
    if (debug_flag > 0) {
        APP_LOG(APP_LOG_LEVEL_DEBUG, "day3_temp ");
    }
    Tuple *day3_cond_tuple = dict_find(received, KEY_DAY3_COND);
    if (debug_flag > 0) {
        APP_LOG(APP_LOG_LEVEL_DEBUG, "day3_cond ");
    }
    Tuple *day3_info_tuple = dict_find(received, KEY_DAY3_INFO);
    if (debug_flag > 0) {
        APP_LOG(APP_LOG_LEVEL_DEBUG, "day3_info ");
    }
    Tuple *day4_temp_tuple = dict_find(received, KEY_DAY4_TEMP);
    if (debug_flag > 0) {
        APP_LOG(APP_LOG_LEVEL_DEBUG, "day4_temp ");
    }
    Tuple *day4_cond_tuple = dict_find(received, KEY_DAY4_COND);
    if (debug_flag > 0) {
        APP_LOG(APP_LOG_LEVEL_DEBUG, "day4_cond ");
    }
    Tuple *day4_time_tuple = dict_find(received, KEY_DAY4_TIME);
    if (debug_flag > 0) {
        APP_LOG(APP_LOG_LEVEL_DEBUG, "day4_time ");
    }
    Tuple *day5_temp_tuple = dict_find(received, KEY_DAY5_TEMP);
    if (debug_flag > 0) {
        APP_LOG(APP_LOG_LEVEL_DEBUG, "day5_temp ");
    }
    Tuple *day5_cond_tuple = dict_find(received, KEY_DAY5_COND);
    if (debug_flag > 0) {
        APP_LOG(APP_LOG_LEVEL_DEBUG, "day5_cond ");
    }
    Tuple *day5_time_tuple = dict_find(received, KEY_DAY5_TIME);
    if (debug_flag > 0) {
        APP_LOG(APP_LOG_LEVEL_DEBUG, "day5_time ");
    }
    Tuple *sunrise_tuple = dict_find(received, KEY_SUNRISE);
    if (debug_flag > 0) {
        APP_LOG(APP_LOG_LEVEL_DEBUG, "sunrise_tuple ");
    }
    Tuple *sunset_tuple = dict_find(received, KEY_SUNSET);
    if (debug_flag > 0) {
        APP_LOG(APP_LOG_LEVEL_DEBUG, "sunset_tuple ");
    }
    Tuple *current_time_tuple = dict_find(received, KEY_CURRENT_TIME);
    if (debug_flag > 0) {
        APP_LOG(APP_LOG_LEVEL_DEBUG, "current_time_tuple ");
    }
    Tuple *location_tuple = dict_find(received, KEY_LOCATION);
    if (debug_flag > 0) {
        APP_LOG(APP_LOG_LEVEL_DEBUG, "location_tuple ");
    }
    Tuple *error_tuple = dict_find(received, KEY_ERROR);
    if (debug_flag > 0) {
        APP_LOG(APP_LOG_LEVEL_DEBUG, "error_tuple ");
    }
    
    Tuple *current_epoch_tuple = dict_find(received, KEY_CURRENT_EPOCH);
    
    if (debug_flag > 0) {
        APP_LOG(APP_LOG_LEVEL_DEBUG, "dictionary iteration complete");

        APP_LOG(APP_LOG_LEVEL_DEBUG, "Got message with keys... day1_temp%p day1_cond%p",
                day1_temp_tuple, day1_cond_tuple);
        APP_LOG(APP_LOG_LEVEL_DEBUG, "Got message with keys... day2_temp%p day2_cond%p day2_info%p",
                day2_temp_tuple, day2_cond_tuple, day2_info_tuple);
        APP_LOG(APP_LOG_LEVEL_DEBUG, "Got message with keys... day3_temp%p day3_cond%p day3_info%p",
                day3_temp_tuple, day3_cond_tuple, day3_info_tuple);
        APP_LOG(APP_LOG_LEVEL_DEBUG, "Got message with keys... day4_temp%p day4_cond%p day4_time%p",
                day4_temp_tuple, day4_cond_tuple, day4_time_tuple);
        APP_LOG(APP_LOG_LEVEL_DEBUG, "Got message with keys... day5_temp%p day5_cond%p day5_time%p",
                day5_temp_tuple, day5_cond_tuple, day5_time_tuple);
        APP_LOG(APP_LOG_LEVEL_DEBUG, "Got message with keys... sunrise%p sunset%p current_time%p location%p", sunrise_tuple, sunset_tuple, current_time_tuple, location_tuple);
        APP_LOG(APP_LOG_LEVEL_DEBUG, "Got message with keys... location%p", location_tuple);
        APP_LOG(APP_LOG_LEVEL_DEBUG, "Got message with keys... error%p", error_tuple);
    }
    
    //if lastin less than stale, ignore

    if (day1_temp_tuple && day1_cond_tuple && day2_temp_tuple && day3_cond_tuple && day2_info_tuple && day3_temp_tuple && day3_cond_tuple && day3_info_tuple && day4_temp_tuple && day4_cond_tuple && day4_time_tuple && day5_temp_tuple && day5_cond_tuple && day5_time_tuple && sunrise_tuple && sunset_tuple && current_time_tuple && location_tuple) {
        weather_data->day1_temp = day1_temp_tuple->value->int32;
        weather_data->day1_cond = day1_cond_tuple->value->int32;
        weather_data->day2_temp = day2_temp_tuple->value->int32;
        weather_data->day2_cond = day2_cond_tuple->value->int32;
        weather_data->day2_info = day2_info_tuple->value->cstring;
        weather_data->day3_temp = day3_temp_tuple->value->int32;
        weather_data->day3_cond = day3_cond_tuple->value->int32;
        weather_data->day3_info = day3_info_tuple->value->cstring;
        weather_data->day4_temp = day4_temp_tuple->value->int32;
        weather_data->day4_cond = day4_cond_tuple->value->int32;
        weather_data->day4_time = day4_time_tuple->value->int32;
        weather_data->day5_temp = day5_temp_tuple->value->int32;
        weather_data->day5_cond = day5_cond_tuple->value->int32;
        weather_data->day5_time = day5_time_tuple->value->int32;
        weather_data->sunrise = sunrise_tuple->value->int32;
        weather_data->sunset = sunset_tuple->value->int32;
        weather_data->current_time = current_time_tuple->value->int32;
        weather_data->location = location_tuple->value->cstring;
        weather_data->current_epoch = current_epoch_tuple->value->int32; 
        weather_data->error = WEATHER_E_OK;
        weather_data->updated = time(NULL);
        
        //debug_flag = 1;
         if (debug_flag > -0) {
             //(day1_temp_tuple && day1_cond_tuple && day2_temp_tuple && day3_cond_tuple && day2_info_tuple && day3_temp_tuple && day3_cond_tuple && day3_info_tuple && day4_temp_tuple && day4_cond_tuple && day4_time_tuple && day5_temp_tuple && day5_cond_tuple && day5_time_tuple && sunrise_tuple && sunset_tuple && current_time_tuple && location_tuple)
            APP_LOG(APP_LOG_LEVEL_DEBUG, "before if day 1 temperature %i and condition %i", weather_data->day1_temp, weather_data->day1_cond);
            APP_LOG(APP_LOG_LEVEL_DEBUG, "before if day 2 temperature %i and condition %i, info %s", weather_data->day2_temp, weather_data->day2_cond, weather_data->day2_info);
            APP_LOG(APP_LOG_LEVEL_DEBUG, "before if day 3 temperature %i and condition %i, info %s", weather_data->day3_temp, weather_data->day3_cond, weather_data->day3_info);
            APP_LOG(APP_LOG_LEVEL_DEBUG, "before if day 4 temperature %i and condition %i and time %i", weather_data->day4_temp, weather_data->day4_cond, weather_data->day4_time);
            APP_LOG(APP_LOG_LEVEL_DEBUG, "before if day 5 temperature %i and condition %i and time %i", weather_data->day5_temp, weather_data->day5_cond, weather_data->day5_time);
            APP_LOG(APP_LOG_LEVEL_DEBUG, "sunrise %i, current_time %i, sunset %i", weather_data->sunrise, weather_data->current_time, weather_data->sunset);
            APP_LOG(APP_LOG_LEVEL_DEBUG, "current_epoch %i", weather_data->current_epoch); 
            APP_LOG(APP_LOG_LEVEL_DEBUG, "location %s", weather_data->location);
         }
        
    }
    else if (error_tuple) {
        weather_data->error = WEATHER_E_NETWORK;
        APP_LOG(APP_LOG_LEVEL_DEBUG, "Got error %s", error_tuple->value->cstring);
    }
    else {
        weather_data->error = WEATHER_E_PHONE;
        APP_LOG(APP_LOG_LEVEL_DEBUG, "Got message with unknown keys... day1_temp%p day1_cond%p day2_temp%p day2_cond%p day3_temp%p day3_cond%p location_tuple%p error%p",
                day1_temp_tuple, day1_cond_tuple, day2_temp_tuple, day2_cond_tuple, day3_temp_tuple, day3_cond_tuple, location_tuple, error_tuple);
    }    debug_flag = saver;
    //}  //end of crash saver else
}

static void appmsg_in_dropped(AppMessageResult reason, void *context) {
    APP_LOG(APP_LOG_LEVEL_DEBUG, "In dropped: %i", reason);
    // Request a new update...
    request_weather();
    APP_LOG(APP_LOG_LEVEL_DEBUG, "App Message Sync Error: %d", reason);
//    APP_LOG(APP_LOG_LEVEL_DEBUG, "Got error: %s", translate_error(reason));
}

static void appmsg_out_sent(DictionaryIterator *sent, void *context) {
    APP_LOG(APP_LOG_LEVEL_DEBUG, "Out sent.");
}

static void appmsg_out_failed(DictionaryIterator *failed, AppMessageResult reason, void *context) {
    WeatherData *weather_data = (WeatherData*) context;

    APP_LOG(APP_LOG_LEVEL_DEBUG, "Out failed: %i", reason);

    switch (reason) {
    case APP_MSG_NOT_CONNECTED:
        weather_data->error = WEATHER_E_DISCONNECTED;
        weather_data->updated = 0;
        request_weather();
        break;
    case APP_MSG_SEND_REJECTED:
                        weather_data->updated = 0;
    case APP_MSG_SEND_TIMEOUT:
        weather_data->error = WEATHER_E_PHONE;
        weather_data->updated = 0;
        request_weather();
        break;
    default:
        weather_data->error = WEATHER_E_PHONE;
        weather_data->updated = 0;
        request_weather();
        break;
    }
}

/*
static void sync_tuple_changed_callback(const uint32_t key, const Tuple* new_tuple, const Tuple* old_tuple, void* context) {

    //GFont custom_font_tinytemp 	= fonts_get_system_font(FONT_KEY_GOTHIC_18);
    //GFont custom_font_temp 		= fonts_get_system_font(FONT_KEY_GOTHIC_18_BOLD);
    //GFont custom_font_large_location = fonts_load_custom_font(resource_get_handle(RESOURCE_ID_FONT_TAHOMA_BOLD_28));
    //	debug_flag = 6;


    switch (key) {
    //        static char day_text[]      = "aaa aaa aaa";
    //        static char night_text[]    = "aaa aaa aaa";
    //        static char current_text[]  = "aaa aaa aaa";
    //        struct tm *timer_tm;

    case KEY_DAY1_TEMP:

        break;

    case KEY_DAY1_COND:

        break;
    }
}  */

void init_network(WeatherData *weather_data)
{
    //    app_sync_init(&sync, sync_buffer, sizeof(sync_buffer), initial_values, ARRAY_LENGTH(initial_values), sync_tuple_changed_callback, sync_error_callback, NULL);
    //    app_message_register_inbox_received(sync_tuple_changed_callback);

    app_message_register_inbox_received(appmsg_in_received);
    app_message_register_inbox_dropped(appmsg_in_dropped);
    app_message_register_outbox_sent(appmsg_out_sent);
    app_message_register_outbox_failed(appmsg_out_failed);
    app_message_set_context(weather_data);
    //  app_message_open(124, 256);

    app_message_open(2048, 256);

    weather_data->error = WEATHER_E_OK;
    weather_data->updated = 0;

}

void close_network()
{
    app_message_deregister_callbacks();
}

void request_weather()
{
    if (requests_queued < 20) {
        DictionaryIterator *iter;
        app_message_outbox_begin(&iter);
        dict_write_uint8(iter, KEY_REQUEST_UPDATE, 92);
        app_message_outbox_send();
        requests_queued = requests_queued + 1;
        APP_LOG(APP_LOG_LEVEL_DEBUG, "requests_queued = %i", requests_queued);
    }
    else {
    if (debug_flag > 0) {APP_LOG(APP_LOG_LEVEL_DEBUG, "requests_queued = %i, too high, stop making requests", requests_queued); }
    } 
}
