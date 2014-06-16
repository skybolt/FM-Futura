//working set version
#include <pebble.h>
#include "network.h"
int debug_flag = 0;

char *translate_error(AppMessageResult result) {
    switch (result) {
        case APP_MSG_OK: return "APP_MSG_OK";
        case APP_MSG_SEND_TIMEOUT: return "APP_MSG_SEND_TIMEOUT";
        case APP_MSG_SEND_REJECTED: return "APP_MSG_SEND_REJECTED";
        case APP_MSG_NOT_CONNECTED: return "APP_MSG_NOT_CONNECTED";
        case APP_MSG_APP_NOT_RUNNING: return "APP_MSG_APP_NOT_RUNNING";
        case APP_MSG_INVALID_ARGS: return "APP_MSG_INVALID_ARGS";
        case APP_MSG_BUSY: return "APP_MSG_BUSY";
        case APP_MSG_BUFFER_OVERFLOW: return "APP_MSG_BUFFER_OVERFLOW";
        case APP_MSG_ALREADY_RELEASED: return "APP_MSG_ALREADY_RELEASED";
        case APP_MSG_CALLBACK_ALREADY_REGISTERED: return "APP_MSG_CALLBACK_ALREADY_REGISTERED";
        case APP_MSG_CALLBACK_NOT_REGISTERED: return "APP_MSG_CALLBACK_NOT_REGISTERED";
        case APP_MSG_OUT_OF_MEMORY: return "APP_MSG_OUT_OF_MEMORY";
        case APP_MSG_CLOSED: return "APP_MSG_CLOSED";
        case APP_MSG_INTERNAL_ERROR: return "APP_MSG_INTERNAL_ERROR";
        default: return "UNKNOWN ERROR";
    }
}

static void appmsg_in_received(DictionaryIterator *received, void *context) {
    if (debug_flag > 0) {APP_LOG(APP_LOG_LEVEL_DEBUG, "In received."); }
    WeatherData *weather = (WeatherData*) context;
    
    Tuple *day1_temp_tuple = dict_find(received, KEY_DAY1_TEMP);
    if (debug_flag > 0) {APP_LOG(APP_LOG_LEVEL_DEBUG, "day1_temp "); }
    Tuple *day1_cond_tuple = dict_find(received, KEY_DAY1_COND);
    if (debug_flag > 0) {APP_LOG(APP_LOG_LEVEL_DEBUG, "day1_cond "); }
    Tuple *day2_temp_tuple = dict_find(received, KEY_DAY2_TEMP);
    if (debug_flag > 0) {APP_LOG(APP_LOG_LEVEL_DEBUG, "day2_temp "); }
    Tuple *day2_cond_tuple = dict_find(received, KEY_DAY2_COND);
    if (debug_flag > 0) {APP_LOG(APP_LOG_LEVEL_DEBUG, "day2_cond "); }
    Tuple *day3_temp_tuple = dict_find(received, KEY_DAY3_TEMP);
    if (debug_flag > 0) {APP_LOG(APP_LOG_LEVEL_DEBUG, "day3_temp "); }
    Tuple *day3_cond_tuple = dict_find(received, KEY_DAY3_COND);
    if (debug_flag > 0) {APP_LOG(APP_LOG_LEVEL_DEBUG, "day3_cond "); }
    Tuple *day4_temp_tuple = dict_find(received, KEY_DAY4_TEMP);
    if (debug_flag > 0) {APP_LOG(APP_LOG_LEVEL_DEBUG, "day4_temp "); }
    Tuple *day4_cond_tuple = dict_find(received, KEY_DAY4_COND);
    if (debug_flag > 0) {APP_LOG(APP_LOG_LEVEL_DEBUG, "day4_cond "); }
    Tuple *day4_time_tuple = dict_find(received, KEY_DAY4_TIME);
    if (debug_flag > 0) {APP_LOG(APP_LOG_LEVEL_DEBUG, "day4_time "); }
    Tuple *day5_temp_tuple = dict_find(received, KEY_DAY5_TEMP);
    if (debug_flag > 0) {APP_LOG(APP_LOG_LEVEL_DEBUG, "day5_temp "); }
    Tuple *day5_cond_tuple = dict_find(received, KEY_DAY5_COND);
    if (debug_flag > 0) {APP_LOG(APP_LOG_LEVEL_DEBUG, "day5_cond "); }
    Tuple *day5_time_tuple = dict_find(received, KEY_DAY5_TIME);
    if (debug_flag > 0) {APP_LOG(APP_LOG_LEVEL_DEBUG, "day5_time "); }
    Tuple *sunrise_tuple = dict_find(received, KEY_SUNRISE);
    if (debug_flag > 0) {APP_LOG(APP_LOG_LEVEL_DEBUG, "sunrise_tuple "); }
    Tuple *sunset_tuple = dict_find(received, KEY_SUNSET);
    if (debug_flag > 0) {APP_LOG(APP_LOG_LEVEL_DEBUG, "sunset_tuple "); }
    Tuple *current_time_tuple = dict_find(received, KEY_CURRENT_TIME);
    if (debug_flag > 0) {APP_LOG(APP_LOG_LEVEL_DEBUG, "current_time_tuple "); }
    Tuple *error_tuple = dict_find(received, KEY_ERROR);
    if (debug_flag > 0) {APP_LOG(APP_LOG_LEVEL_DEBUG, "error_tuple "); }
    
    
    //int debug_flag = 1;
    if (debug_flag > 0) {
        APP_LOG(APP_LOG_LEVEL_DEBUG, "dictionary iteration complete");
        APP_LOG(APP_LOG_LEVEL_DEBUG, "Got message with unknown keys... day1_temp=%p day1_cond=%p day2_temp=%p day2_cond=%p day3_temp=%p day3_cond=%p day4_temp=%p day4_cond=%p day4_info=%p day5_temp=%p day5_cond=%p day5_info=%p error=%p", day1_temp_tuple, day1_cond_tuple, day2_temp_tuple, day2_cond_tuple, day3_temp_tuple, day3_cond_tuple, day4_temp_tuple, day4_cond_tuple, day4_time_tuple, day5_temp_tuple, day5_cond_tuple, day5_time_tuple, error_tuple);
        
    }
    //debug_flag = 1;
    if (debug_flag > 0) {
        weather->error = WEATHER_E_PHONE;
        APP_LOG(APP_LOG_LEVEL_DEBUG, "Got message with keys... day1_temp=%p day1_cond%p",
                day1_temp_tuple, day1_cond_tuple);
        APP_LOG(APP_LOG_LEVEL_DEBUG, "Got message with keys... day2_temp=%p day2_cond%p",
                day2_temp_tuple, day2_cond_tuple);
        APP_LOG(APP_LOG_LEVEL_DEBUG, "Got message with keys... day3_temp=%p day3_cond%p",
                day3_temp_tuple, day3_cond_tuple);
        APP_LOG(APP_LOG_LEVEL_DEBUG, "Got message with keys... day4_temp=%p day4_cond%p day4_time=%p",
                day4_temp_tuple, day4_cond_tuple, day4_time_tuple);
        APP_LOG(APP_LOG_LEVEL_DEBUG, "Got message with keys... day5_temp=%p day5_cond%p day5_time=%p",
                day5_temp_tuple, day5_cond_tuple, day5_time_tuple);
        APP_LOG(APP_LOG_LEVEL_DEBUG, "Got message with keys... error=%p", error_tuple);
    }
    
    if (day1_temp_tuple && day1_cond_tuple) {
        //      if (1 == 1) {
        weather->day1_temp = day1_temp_tuple->value->int32;
        weather->day1_cond = day1_cond_tuple->value->int32;
        weather->day2_temp = day2_temp_tuple->value->int32;
        weather->day2_cond = day2_cond_tuple->value->int32;
        weather->day3_temp = day3_temp_tuple->value->int32;
        weather->day3_cond = day3_cond_tuple->value->int32;
        weather->day4_temp = day4_temp_tuple->value->int32;
        weather->day4_cond = day4_cond_tuple->value->int32;
        weather->day4_time = day4_time_tuple->value->int32;
        weather->day5_temp = day5_temp_tuple->value->int32;
        weather->day5_cond = day5_cond_tuple->value->int32;
        weather->day5_time = day5_time_tuple->value->int32;
        weather->sunrise = sunrise_tuple->value->int32;
        weather->sunset = sunset_tuple->value->int32;
        weather->current_time = current_time_tuple->value->int32;
        weather->error = WEATHER_E_OK;
        weather->updated = time(NULL);
        if (debug_flag > 0) {
            APP_LOG(APP_LOG_LEVEL_DEBUG, "before if day 1 temperature %i and condition %i", weather->day1_temp, weather->day1_cond);
            APP_LOG(APP_LOG_LEVEL_DEBUG, "before if day 2 temperature %i and condition %i", weather->day2_temp, weather->day2_cond);
            APP_LOG(APP_LOG_LEVEL_DEBUG, "before if day 3 temperature %i and condition %i", weather->day3_temp, weather->day3_cond);
            APP_LOG(APP_LOG_LEVEL_DEBUG, "before if day 4 temperature %i and condition %i and time %i", weather->day4_temp, weather->day4_cond, weather->day4_time);
            APP_LOG(APP_LOG_LEVEL_DEBUG, "before if day 5 temperature %i and condition %i and time %i", weather->day5_temp, weather->day5_cond, weather->day5_time);
        }
    }
    else if (error_tuple) {
        weather->error = WEATHER_E_NETWORK;
        APP_LOG(APP_LOG_LEVEL_DEBUG, "Got error %s", error_tuple->value->cstring);
    }
    else {
        weather->error = WEATHER_E_PHONE;
        APP_LOG(APP_LOG_LEVEL_DEBUG, "Got message with unknown keys... day1_temp=%p day1_cond%p day2_temp=%p day2_cond%p day3_temp=%p day3_cond%p error=%p",
                day1_temp_tuple, day1_cond_tuple, day2_temp_tuple, day2_cond_tuple, day3_temp_tuple, day3_cond_tuple, error_tuple);
    }
}

static void appmsg_in_dropped(AppMessageResult reason, void *context) {
    APP_LOG(APP_LOG_LEVEL_DEBUG, "In dropped: %i", reason);
    // Request a new update...
    request_weather();
    APP_LOG(APP_LOG_LEVEL_DEBUG, "App Message Sync Error: %d", reason);
    APP_LOG(APP_LOG_LEVEL_DEBUG, "Got error: %s", translate_error(reason));
}

static void appmsg_out_sent(DictionaryIterator *sent, void *context) {
    APP_LOG(APP_LOG_LEVEL_DEBUG, "Out sent.");
}

static void appmsg_out_failed(DictionaryIterator *failed, AppMessageResult reason, void *context) {
    WeatherData *weather = (WeatherData*) context;
    
    APP_LOG(APP_LOG_LEVEL_DEBUG, "Out failed: %i", reason);
    
    switch (reason) {
        case APP_MSG_NOT_CONNECTED:
        weather->error = WEATHER_E_DISCONNECTED;
        //      request_weather();
        break;
        case APP_MSG_SEND_REJECTED:
        case APP_MSG_SEND_TIMEOUT:
        weather->error = WEATHER_E_PHONE;
        //      request_weather();
        break;
        default:
        weather->error = WEATHER_E_PHONE;
        //      request_weather();
        break;
    }
}

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
}

void init_network(WeatherData *weather_data)
{
    //    app_sync_init(&sync, sync_buffer, sizeof(sync_buffer), initial_values, ARRAY_LENGTH(initial_values), sync_tuple_changed_callback, sync_error_callback, NULL);
    
    
    app_message_register_inbox_received(appmsg_in_received);
//    app_message_register_inbox_received(sync_tuple_changed_callback);
    app_message_register_inbox_dropped(appmsg_in_dropped);
    app_message_register_outbox_sent(appmsg_out_sent);
    app_message_register_outbox_failed(appmsg_out_failed);
    app_message_set_context(weather_data);
    //  app_message_open(124, 256);
    
    app_message_open(1024, 2048);
    
    weather_data->error = WEATHER_E_OK;
    weather_data->updated = 0;
    
}

void close_network()
{
    app_message_deregister_callbacks();
}

void request_weather()
{
    DictionaryIterator *iter;
    app_message_outbox_begin(&iter);
    
    dict_write_uint8(iter, KEY_REQUEST_UPDATE, 42);
    
    app_message_outbox_send();
}
