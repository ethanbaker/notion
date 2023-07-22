# TickTick Integration

This integration is designed to sync tasks between Notion and TickTick. Currently, this is not in a working, tidy version, as I have migrated away from using TickTick entirely. However, the skeleton of previous work here exists if you would want to take it and build off it.

A synced task looks like:

```go
// Task type represents a task synced on Notion and TickTick
type Task struct {
	Name     string   // Name of the task
	Type     string   // The task's type (Short Term, Long Term, Work, Personal)
	Job      string   // The task's job
	Status   bool     // The task's status (true, false)
	Date     string   // The task's due date (ISO string)
	Priority string   // The task's priority (High, Medium, Low)
	Tags     []string // the task's tags

	TicktickID string // The TickTick ID of the task
	NotionID   string // The Notion ID of the task
	NotionURL  string // The URL to the Notion page
}
```

TickTick syncs the `Name`, `Status`, `Date`, `Tags`, and `Priority` fields. Notion syncs all of the fields (given the database contains properties with the same name).