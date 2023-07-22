# Recurring Integration

This integration is designed to make habit tracking easier in Notion. A list of tasks present in a given database are recorded. This integration looks for two properties in the database, `Done` and `Last Completed`. Whenever a given page in the databae has a completed (true) `Done` property, the `Last Completed` property will reset to the current day.

In order to use this integration, clone this code onto your own machine (preferably a server). Then, create a JSON file of your program credentials that follows the format below:

```json
{
  "token": "notion_api_secret",
  "database_id": "notion_database_id"
}
```

Then, update the constants listed in `main.go` as follows:

* Change `CREDENTIAL_PATH` to the path to your credentials file explained above.
* Change `CYCLE_DURATION` to how often you want the program to check for completed tasks 
* Change `DAY_OFFSET` to how much delay you want when setting `Last Completed` to the current day (i.e. if you want tasks completed past midnight to count for the previous day)
* Change `TIMEZONE_OFFSET` to the amount of hours your timezone differs from UTC

Finally, run `go run main.go` on your machine to start the integration.