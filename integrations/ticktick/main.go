package main

// TODO optimization can be done with finding task's position in ticktick list?

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"regexp"
	"strings"
	"time"

	notionapi "github.com/dstotijn/go-notion"
	ticktickapi "github.com/ethanbaker/notion/integrations/ticktick/ticktickapi"
)

// Credentails type holds json credentials in a json file
type Credentials struct {
	Notion struct {
		Token      string `json:"token"`
		TokenV2    string `json:"token_v2"`
		DatabaseID string `json:"task_database_id"`
		TemplateID string `json:"task_template"`
	} `json:"notion"`

	Ticktick struct {
		Username string `json:"username"`
		Password string `json:"password"`
		ListID   string `json:"list_id"`
	} `json:"ticktick"`
}

/* Constants */
const CREDENTIAL_PATH = "./_credentials/credentials.json"

var SHORT_TERM_QUERY = notionapi.DatabaseQuery{
	Filter: &notionapi.DatabaseQueryFilter{
		Property: "Type",
		Select:   &notionapi.SelectDatabaseQueryFilter{Equals: "Short Term"},
	},
}

var FALSE = false

/*
var NEW_NOTION_PAGE_PARAMS = notionapi.CreatePageParams{
	ParentType: notionapi.ParentTypeDatabase,
	ParentID:   "",
	DatabasePageProperties: &notionapi.DatabasePageProperties{
		"Name": notionapi.DatabasePageProperty{
			Title: []notionapi.RichText{notionapi.RichText{Text: &notionapi.Text{Content: "Default"}}},
		},
		"Type": notionapi.DatabasePageProperty{
			Select: &notionapi.SelectOptions{Name: "Short Term"},
		},
		"Job": notionapi.DatabasePageProperty{
			Select: &notionapi.SelectOptions{Name: "None"},
		},
		"Status": notionapi.DatabasePageProperty{
			Checkbox: &FALSE,
		},
		"Date": notionapi.DatabasePageProperty{
			Date: &notionapi.Date{Start: notionapi.DateTime{Time: time.Now()}},
		},
		"Priority": notionapi.DatabasePageProperty{
			Select: &notionapi.SelectOptions{Name: "None"},
		},
		"Tags": notionapi.DatabasePageProperty{
			MultiSelect: []notionapi.SelectOptions{notionapi.SelectOptions{Name: "None"}},
		},
		"TickTick ID": notionapi.DatabasePageProperty{
			RichText: []notionapi.RichText{notionapi.RichText{Text: &notionapi.Text{Content: "Default"}}},
		},
	},
}
*/

// Globals
var credentials Credentials
var notion *notionapi.Client
var ticktick *ticktickapi.Client

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

// init initializes the task
func (t *Task) Init(notionID string, ticktickID string) error {
	// If the notion ID exists, if so pull values from Notion
	if notionID != "" {
		t.NotionID = notionID

		_, err := t.notionRead()
		if err != nil {
			return err
		}

		// If the task has no corresponding ticktick ID, create a ticktick task
		if t.TicktickID == "" {
			task := ticktickapi.NewTask("")
			task.ProjectID = credentials.Ticktick.ListID
			task, err := ticktick.AddTask(task)
			if err != nil {
				return err
			}

			t.TicktickID = task.ID
			err = t.notionWrite()
			if err != nil {
				return err
			}
			err = t.ticktickWrite()
			if err != nil {
				return err
			}
		}
		return nil
	}
	// Otherwise (no NotionID exists)

	// If a ticktickID exists, pull the values from Ticktick
	if ticktickID != "" {
		t.TicktickID = ticktickID
		t.Type = "Short Term"
		t.Job = "None"
		t.Status = false
		t.Tags = []string{}

		_, err := t.ticktickRead()
		if err != nil {
			return err
		}

		// Get the template page in the database
		template, err := notion.FindPageByID(context.Background(), credentials.Notion.TemplateID)
		if err != nil {
			return err
		}
		properties, ok := template.Properties.(notionapi.DatabasePageProperties)
		if !ok {
			return errors.New("Cannot get template properties from notion")
		}
		for label, _ := range properties {
			if !strings.Contains("Type Job", label) {
				delete(properties, label)
			}
		}

		// Create parameters for the notion page
		params := notionapi.CreatePageParams{
			ParentType:             notionapi.ParentTypeDatabase,
			ParentID:               credentials.Notion.DatabaseID,
			Icon:                   template.Icon,
			Cover:                  template.Cover,
			DatabasePageProperties: &properties,
		}

		// Create the notion page
		page, err := notion.CreatePage(context.Background(), params)
		if err != nil {
			return err
		}

		t.NotionID = page.ID
		err = t.notionWrite()
		if err != nil {
			return err
		}
	}

	return nil
}

// notionRead reads data from Notion and saves it to this task
func (t *Task) notionRead() (bool, error) {
	// Prechecks, make sure the Notion ID exists
	if t.NotionID == "" {
		return false, errors.New("Task's NotionID does not exist")
	}

	// Get the Notion page's properties
	page, err := notion.FindPageByID(context.Background(), t.NotionID)
	if err != nil {
		return false, err
	}
	t.NotionURL = page.URL

	// Get the properties from the notion page
	properties, ok := page.Properties.(notionapi.DatabasePageProperties)
	if !ok {
		return false, errors.New("Could not get properties from page")
	}

	// Loop through the properties and add them to the task
	updated := false
	for label, value := range properties {
		switch label {
		case "Name":
			if len(value.Title) > 0 {
				updated = updated || t.Name != value.Title[0].Text.Content
				t.Name = value.Title[0].Text.Content
			}

		case "Type":
			if value.Select != nil {
				updated = updated || t.Type != value.Select.Name
				t.Type = value.Select.Name
			}

		case "Job":
			if value.Select != nil {
				updated = updated || t.Job != value.Select.Name
				t.Job = value.Select.Name
			}

		case "Status":
			if value.Checkbox != nil {
				updated = updated || t.Status != *value.Checkbox
				t.Status = *value.Checkbox
			}

		case "Date":
			if value.Date != nil {
				updated = updated || t.Date != strings.Replace(value.Date.Start.Time.Format(time.RFC3339), "Z", "-04:00", 1)
				t.Date = strings.Replace(value.Date.Start.Time.Format(time.RFC3339), "Z", "-04:00", 1)
			}

		case "Priority":
			if value.Select != nil {
				updated = updated || t.Priority != value.Select.Name
				t.Priority = value.Select.Name
			}

		case "Tags":
			// NOTE: not checking for updates here
			var tags []string
			for _, option := range value.MultiSelect {
				tags = append(tags, option.Name)
			}
			t.Tags = tags

		case "TickTick ID":
			if len(value.RichText) > 0 {
				updated = updated || t.TicktickID != value.RichText[0].Text.Content
				t.TicktickID = value.RichText[0].Text.Content
			} else {
				t.TicktickID = ""
			}

		default:
			if !strings.Contains("Date Status", label) {
				log.Printf("[WARN]: Invalid property %v\n", label)
			}
		}
	}

	return updated, nil
}

// notionWrite writes data from the task to Notion
func (t *Task) notionWrite() error {
	// Prechecks, make sure the Notion ID exists
	if t.NotionID == "" {
		return errors.New("Task's NotionID does not exist")
	}

	// Get the current page properties
	page, err := notion.FindPageByID(context.Background(), t.NotionID)
	if err != nil {
		return err
	}

	properties, ok := page.Properties.(notionapi.DatabasePageProperties)
	if !ok {
		return errors.New("Could not get properties from page")
	}

	// For each property, change the current value and append to the list of updated properties
	for label, value := range properties {
		switch label {
		case "Name":
			if len(value.Title) > 0 {
				value.Title[0].Text.Content = t.Name
			} else {
				value.Title = []notionapi.RichText{notionapi.RichText{Text: &notionapi.Text{Content: t.Name}}}
			}

		case "Type":
			value.Select = &notionapi.SelectOptions{Name: t.Type}

		case "Job":
			value.Select = &notionapi.SelectOptions{Name: t.Job}

		case "Status":
			value.Checkbox = &t.Status

		case "Date":
			temp, err := time.Parse(time.RFC3339, t.Date)
			if err != nil {
				log.Printf("[ERROR]: could not parse date (err: %v)\n", err)
				continue
			}
			value.Date = &notionapi.Date{Start: notionapi.DateTime{Time: temp}}

		case "Priority":
			value.Select = &notionapi.SelectOptions{Name: t.Priority}

		case "Tags":
			if len(t.Tags) > 0 {
				tags := []notionapi.SelectOptions{}
				for _, tag := range t.Tags {
					tags = append(tags, notionapi.SelectOptions{Name: tag})
				}
				value.MultiSelect = tags
			} else {
				delete(properties, "Tags")
				continue
			}

		case "TickTick ID":
			value.RichText = []notionapi.RichText{notionapi.RichText{Text: &notionapi.Text{Content: t.TicktickID}}}

		default:
			delete(properties, label)
			continue
		}
		properties[label] = value
	}

	// Create a list of update parameters to send to Notion
	updateParams := notionapi.UpdatePageParams{DatabasePageProperties: properties}
	_, err = notion.UpdatePage(context.Background(), t.NotionID, updateParams)
	return err
}

// ticktickRead reads values from TickTick and assigns them to the task
func (t *Task) ticktickRead() (bool, error) {
	// Prechecks, make sure task has ticktick ID
	if t.TicktickID == "" {
		return false, errors.New("Ticktick ID is needed for the task")
	}

	// Get the ticktick tasks
	todoTasks, err := ticktick.GetTodoTasks()
	if err != nil {
		return false, err
	}
	completedTasks, err := ticktick.GetCompletedTasks(credentials.Ticktick.ListID)
	if err != nil {
		return false, err
	}
	tasks := append(todoTasks, completedTasks...)

	// Search for the one with a corresponding ID
	task := ticktickapi.Task{}
	for _, tk := range tasks {
		if tk.ID == t.TicktickID {
			task = *tk
			break
		}
	}

	// Task could not be found
	if task.ID == "" {
		return false, nil
	}

	// Determine if the task was updated
	updated := t.Name != task.Title

	t.Name = task.Title

	if task.Status == 2 {
		updated = updated || !t.Status
		t.Status = true
	} else {
		updated = updated || t.Status
		t.Status = false
	}
	t.Status = task.Status == 2

	re := regexp.MustCompile("[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}")
	date, err := time.Parse(time.RFC3339, re.FindAllString(task.StartDate, 1)[0]+"-04:00")
	if err != nil {
		return false, err
	}
	updated = updated || t.Date != date.Add(-4*time.Hour).Format(time.RFC3339)
	t.Date = date.Add(-4 * time.Hour).Format(time.RFC3339)

	t.Tags = task.Tags

	switch task.Priority {
	case 1:
		updated = updated || t.Priority != "Low"
		t.Priority = "Low"
	case 3:
		updated = updated || t.Priority != "Medium"
		t.Priority = "Medium"
	case 5:
		updated = updated || t.Priority != "High"
		t.Priority = "High"
	default:
		updated = updated || t.Priority != "None"
		t.Priority = "None"
	}

	return updated, nil
}

// ticktickWrite saves the task's values into TickTick
func (t *Task) ticktickWrite() error {
	// Prechecks, make sure task has ticktick ID
	if t.TicktickID == "" {
		return errors.New("Ticktick ID is needed for the task")
	}

	// Get the ticktick tasks
	todoTasks, err := ticktick.GetTodoTasks()
	if err != nil {
		return err
	}
	completedTasks, err := ticktick.GetCompletedTasks(credentials.Ticktick.ListID)
	if err != nil {
		return err
	}
	tasks := append(todoTasks, completedTasks...)

	// Search for the one with a corresponding ID
	task := ticktickapi.Task{}
	for _, tk := range tasks {
		if tk.ID == t.TicktickID {
			task = *tk
			break
		}
	}

	// Task could not be found, assume task is done
	if task.ID == "" {
		t.Status = true
		return nil
	}

	task.Title = t.Name

	if t.Status == false {
		task.Status = 0
	} else {
		task.Status = 2
	}

	re := regexp.MustCompile("[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}")

	task.StartDate = re.FindAllString(t.Date, 1)[0] + "-0400"
	task.DueDate = task.StartDate

	task.Tags = t.Tags

	switch t.Priority {
	case "Low":
		task.Priority = 1
	case "Medium":
		task.Priority = 3
	case "High":
		task.Priority = 5
	default:
		task.Priority = 0
	}

	return ticktick.UpdateTask(&task)
}

// Have the task sync data between Ticktick and Notion, with preference for Notion
func (t *Task) Sync() {
	// Read from notion first. If the task changed, push chages to ticktick
	changed, err := t.notionRead()
	fmt.Println("notion changed:", changed)
	if err != nil {
		log.Printf("[ERROR]: Error reading from notion (err: %v)\n", err)
	}
	if changed {
		err = t.ticktickWrite()
		if err != nil {
			log.Printf("[ERROR]: Error writing to ticktick (err: %v)\n", err)
		}
	}
	fmt.Printf("after notion %#v\n", t)

	// Read from ticktick second. If the task changed, push changes to notion
	changed, err = t.ticktickRead()
	fmt.Println("ticktick changed:", changed)
	if err != nil {
		log.Printf("[ERROR]: Error reading from ticktick (err: %v)\n", err)
	}
	if changed {
		err = t.notionWrite()
		if err != nil {
			log.Printf("[ERROR]: Error writing to notion (err: %v)\n", err)
		}
	}
	fmt.Printf("after ticktick %#v\n", t)
}

// Setup function initalizes a list of tasks
func setup() []Task {
	// Query Notion pages in the task database
	resp, err := notion.QueryDatabase(context.Background(), credentials.Notion.DatabaseID, &SHORT_TERM_QUERY)
	if err != nil {
		log.Fatalf("[ERROR]: Error querying notion task database (err: %v)\n", err)
	}

	// Loop through each page and assign the ID to a task
	tasks := []Task{}
	for _, page := range resp.Results {
		t := Task{}
		t.Init(page.ID, "")

		tasks = append(tasks, t)
	}

	// Find ticktick tasks that have no Notion page assigned to them, and create tasks based on that
	ticktickTasks, err := ticktick.GetTodoTasks()
	if err != nil {
		log.Fatal("[ERROR]: Error getting ticktick tasks (err: %v)\n", err)
	}

	for _, ticktickTask := range ticktickTasks {
		// Do we already have this task synced?
		related := false
		for _, task := range tasks {
			if task.TicktickID == ticktickTask.ID {
				related = true
				break
			}
		}
		if related {
			continue
		}

		// Add the task
		t := Task{}
		t.Init("", ticktickTask.ID)
		tasks = append(tasks, t)
	}

	return tasks
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
	notion = notionapi.NewClient(credentials.Notion.Token)

	// Create a new ticktick client
	ticktick, err = ticktickapi.NewClient()
	if err != nil {
		log.Fatalf("[ERROR]: Error creating new ticktick client (err: %v)\n", err)
	}
	if err = ticktick.Login(credentials.Ticktick.Username, credentials.Ticktick.Password); err != nil {
		log.Fatalf("[ERROR]: Error logging into ticktick (err: %v)\n", err)
	}

	// Keep syncing and updating tasks
	var tasks []Task
	for {
		tasks = setup()

		for _, task := range tasks {
			task.Sync()
		}

		time.Sleep(5 * time.Minute)
	}

	/* TESTING */
	/* Notion only
	t := Task{}
	fmt.Println("error in init:", t.Init("a5dfdf4cf78c4c63a38a3a76752d3417", ""))
	for {
		t.Sync()
		time.Sleep(10 * time.Second)
	}
	*/

	/* Ticktick only
	fmt.Println("error in init:", t.Init("", "63010c2239ef2c4b2ba496cd"))
	*/

	/* Notion (with ticktick)
	fmt.Println("error in init:", t.Init("e3caf53c0c134aab8a9e62aabeac0eaf", ""))
	*/
}
