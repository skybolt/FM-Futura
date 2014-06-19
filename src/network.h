//working set version
#include <pebble.h>

#define KEY_DAY1_TEMP 10
#define KEY_DAY1_COND 11
#define KEY_DAY2_TEMP 20
#define KEY_DAY2_COND 21
#define KEY_DAY3_TEMP 30
#define KEY_DAY3_COND 31
#define KEY_DAY4_TEMP 40
#define KEY_DAY4_COND 41
#define KEY_DAY4_TIME 42
#define KEY_DAY5_TEMP 50
#define KEY_DAY5_COND 51
#define KEY_DAY5_TIME 52
#define KEY_SUNRISE 2
#define KEY_SUNSET 3
#define KEY_CURRENT_TIME 4
#define KEY_ERROR 5
#define KEY_REQUEST_UPDATE 42
typedef enum {
    WEATHER_E_OK = 0,
    WEATHER_E_DISCONNECTED,
    WEATHER_E_PHONE,
    WEATHER_E_NETWORK
} WeatherError;

typedef struct {
    int day1_temp;
    int day1_cond;
    int day2_temp;
    int day2_cond;
    int day3_temp;
    int day3_cond;
    int day4_temp;
    int day4_cond;
    int day4_time;
    int day5_temp;
    int day5_cond;
    int day5_time;
    int sunrise;
    int sunset;
    int current_time;
    time_t updated;
    WeatherError error;
} WeatherData;

void init_network(WeatherData *weather_data);
void close_network();

void request_weather();
