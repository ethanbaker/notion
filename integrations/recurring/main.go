package main

import (
	"context"
	"encoding/json"
	"errors"
	"io/ioutil"
	"log"
	"time"

	notionapi "github.com/dstotijn/go-notion"
)

// Credentails type holds json credentials in a json file
type Credentials struct {
	Token      string `json:"token"`
	DatabaseID string `json:"database_id"`
}

// Constants
const CREDENTIAL_PATH = "./_credentials/credentials.json"

var TRUE = true
var FALSE = false

var QUERY = notionapi.DatabaseQuery{
	Filter: &notionapi.DatabaseQueryFilter{
		Property: "Active",
		DatabaseQueryPropertyFilter: notionapi.DatabaseQueryPropertyFilter{
			Checkbox: &notionapi.CheckboxDatabaseQueryFilter{Equals: &TRUE},
		},
	},
}

const CYCLE_DURATION = time.Minute

// Globals
var credentials Credentials
var notion *notionapi.Client

// RecurringTask type represents a task synced on Notion and TickTick
type RecurringTask struct {
	LastCompleted time.Time // The date that this task was last completed
	Done          bool      // Whether or not the task has been completed
	Active        bool      // Whether or not the recurring task should be updated

	ID string // The Notion ID of the task
}

// utcToNotion converts a time from UTC (in the task struct) to Notion's formatting
func utcToNotion(t time.Time) string {
	return t.Format(time.RFC3339)
}

// Init initalizes the recurring task
func (t *RecurringTask) Init(id string) error {
	// Prechecks for the ID
	if id == "" {
		return errors.New("ID cannot be empty")
	}
	t.ID = id

	// Read the notion values
	t.readNotion()

	return nil
}

// readNotion pulls information from notion into the struct representing the task
func (t *RecurringTask) readNotion() error {
	// Prechecks for ID
	if t.ID == "" {
		return errors.New("ID cannot be empty")
	}

	// Get the page property IDs from Notion
	page, err := notion.FindPageByID(context.Background(), t.ID)
	if err != nil {
		return err
	}

	// Get the page property values from their IDs
	properties, ok := page.Properties.(notionapi.DatabasePageProperties)
	if !ok {
		return errors.New("Could not get properties from page")
	}

	// Loop through the properties and add the specified ones to the task
	for label, value := range properties {
		switch label {
		case "Done":
			if value.Checkbox != nil {
				t.Done = *value.Checkbox
			}

		case "Last Completed":
			if value.Date != nil {
				/*
					date, err := notionToUtc(value.Date.Start.Time)
					if err != nil {
						return err
					}
				*/
				t.LastCompleted = value.Date.Start.Time
			}

		case "Active":
			if value.Checkbox != nil {
				t.Active = *value.Checkbox
			}
		}
	}

	return nil
}

// writeNotion writes the struct's contents to the notion database
func (t *RecurringTask) writeNotion() error {
	// Prechecks for ID
	if t.ID == "" {
		return errors.New("ID cannot be empty")
	}

	// Get the page property IDs from Notion
	page, err := notion.FindPageByID(context.Background(), t.ID)
	if err != nil {
		return err
	}

	// Get the page property values from their IDs
	properties, ok := page.Properties.(notionapi.DatabasePageProperties)
	if !ok {
		return errors.New("Could not get properties from page")
	}

	// For each property, change the current value of the property to the value in the struct
	for label, value := range properties {
		switch label {
		case "Done":
			properties[label] = notionapi.DatabasePageProperty{Checkbox: &t.Done}

		case "Last Completed":
			value.Date.Start.Time = t.LastCompleted

		default:
			delete(properties, label)
		}
	}

	// Create update parameters from the updated properties and send them to send to Notion
	updateParams := notionapi.UpdatePageParams{DatabasePageProperties: properties}
	_, err = notion.UpdatePage(context.Background(), t.ID, updateParams)

	return err
}

// Sync maintains recurring task functionality by updating the 'Last Completed' field
// whenever 'Done' is checked (and assuming 'Active' is true)
func (t *RecurringTask) Sync() {
	// Don't do anything if the task isn't active
	if !t.Active {
		return
	}

	// Read in the values from Notion
	err := t.readNotion()
	if err != nil {
		log.Printf("[ERROR]: Error reading from notion (err: %v)\n", err)
		return
	}

	// If 'Done' has been checked, update 'Last Completed' to today and reset 'Done' to false
	if t.Done {
		now := time.Now()
		t.LastCompleted = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
		t.Done = false

		// Write the updated values to Notion
		err = t.writeNotion()
		if err != nil {
			log.Printf("[ERROR]: Error writing to notion (err: %v)\n", err)
		}
	}

}

// getTasks gets an initial list of tasks from notion
func getTasks() ([]RecurringTask, error) {
	var tasks []RecurringTask

	// Get all the recurring tasks from the database
	resp, err := notion.QueryDatabase(context.Background(), credentials.DatabaseID, &QUERY)
	if err != nil {
		return tasks, err
	}

	// Loop through each page and assign the ID to the task
	for _, page := range resp.Results {
		t := RecurringTask{}
		t.Init(page.ID)
		tasks = append(tasks, t)
	}

	return tasks, nil
}

func main() {
	// Read in the credentials
	content, err := ioutil.ReadFile(CREDENTIAL_PATH)
	if err != nil {
		log.Fatalf("[ERROR]: Error reading credential file (err: %v)\n", err)
	}
	err = json.Unmarshal(content, &credentials)
	if err != nil {
		log.Fatalf("[ERROR]: Error unmarshalling credential file (err: %v)\n", err)
	}

	// Create a new notion client
	notion = notionapi.NewClient(credentials.Token)

	// Repeatedly sync the tasks
	for {
		tasks, err := getTasks()
		if err != nil {
			log.Fatalf("[ERROR]: Error querying notion task database (err: %v)\n", err)
		}

		for _, t := range tasks {
			t.Sync()
		}

		time.Sleep(CYCLE_DURATION)
	}
}
