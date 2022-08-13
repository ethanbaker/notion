/* Imports */
const fs = require("fs")
const { Client } = require("@notionhq/client")

/* Constants */

// The path of the credentials file
const CREDENTIAL_PATH: string = "./_credentials/credentials.json"

// A map to access different values inside of properties
const ACCESSOR_MAP: {[key: string]: (e: any)=>any} = {
  "Name": e => e.results?.filter((f: any) => f.id == "title")[0]?.title.plain_text,
  "Type": e => e.select?.name,
  "Job": e => e.select?.name,
  "Status": e => e.checkbox,
  "Date": e => e.date?.start,
  "Priority": e => e.select?.name,
  "Tags": e => e.multi_select?.map((e: any) => e.name),
  "TickTick ID": e => e.results[0]?.rich_text.plain_text,
}

// A map to access different notion types of properties
const ENCODER_MAP: {[key: string]: (id: string, e: any)=>any} = {
  "Type": (id: string, e: any) => { return {"select": {"name": e}}},
  "Job": (id: string, e: any) => { return {"select": {"name": e}}},
  "Status": (id: string, e: any) => { return {"checkbox": e}},
  "Date": (id: string, e: any) => { return {"date": {"start": e}}},
  "Priority": (id: string, e: any) => { return {"select": {"name": e}}},
  "Tags": (id: string, e: any) => { return {"multi_select": e.map((f: any) => { return {"name": f}})}},
  "TickTick ID": (id: string, e: any) => { return {"rich_text": [{"content": e}]}},
}

const TYPE_MAP: {[key: string]: string} = {
  "Type": "select",
  "Job": "select",
  "Status": "checkbox",
  "Date": "date",
  "Priority": "select",
  "Tags": "multi_select",
  "TickTick ID": "rich_text",
}

/* Globals */

// The notion client
let notion: any
// The ticktick client
let ticktick: any = require("ticktick-wrapper")
// The read credentials
let credentials: {[key: string]: {[key: string]: string}} = {}
// The list of tasks
let tasks: Task[]

/* Task */

class Task {
  public name: string = ""                     // The name of the task
  public properties: {[key: string]: any} = {} // The notion properties of the task

  public notion_id: string = ""  // The ID of the page from notion
  public notion_url: string = "" // The URL to the notion task
  public property_ids: {[key: string]: any} = {} // A list of property IDs for notion

  public ticktick_id: string = "" // The ID of the task from ticktick

  // Default constructor of a Task, takes a notion ID and initializes properties
  constructor(notion_id: string) {
    this.notion_id = notion_id
  }

  async init() {
    // Get the notion page's property IDs
    const response = await notion.pages.retrieve({ page_id: this.notion_id })
    this.property_ids = response.properties
    this.notion_url = response.url

    // Constantly sync
    setInterval(() => {
      this.sync()
    }, 20000)
  }

  // Write attributes to notion and ticktick
  async update(): Promise<void> {
    // Prechecks
    if (this.notion_id == undefined ||
        this.notion_id === "" ||
        this.ticktick_id == undefined ||
        this.ticktick_id === "" ||
        Object.keys(this.properties).length == 0) return

    // Generate the updated properties for notion
    let properties: {[key: string]: any} = {"Name": {"title": [{"text": {"content": this.name}}]}}
    for (let property in this.properties) {
      properties[property] = ENCODER_MAP[property](this.property_ids[property], this.properties[property])
    }

    // Update the properties for notion
    await notion.pages.update({ page_id: this.notion_id, properties: properties })

    // Find the correct ticktick task
    const list: any = await ticktick.lists.getByName(credentials.ticktick.main_list)
    const completed: any = await list.getCompletedTasks()
    const todo: any = await list.getTodoTasks()

    for (let task of todo.concat(completed)) {
      if (task.id === this.ticktick_id) {
        task.title = this.name
        task.status = notionToTicktick("Status", this.properties["Status"])
        task.startDate = notionToTicktick("Date", this.properties["Date"]) // TODO may have to format
        task.dueDate = notionToTicktick("Date", new Date(this.properties["Date"]).setUTCMinutes(new Date(this.properties["Date"]).getUTCMinutes() + 60*24))
        task.priority = notionToTicktick("Priority", this.properties["Priority"])

        task.save()
        task.update()
        break
      }
    }
  }

  // Get a task's properties from Ticktick
  async getTicktick(): Promise<boolean> {
    const list: any = await ticktick.lists.getByName(credentials.ticktick.main_list)
    const completed: any = await list.getCompletedTasks()
    const todo: any = await list.getTodoTasks()

    for (let task of completed.concat(todo)) {
      if (task.id === this.ticktick_id) {
        let updated: boolean = false

        if (task.title !== this.name) {
          this.name = task.title
          updated = true
        }
        if (ticktickToNotion("Status", task.status) !== this.properties["Status"]) {
          this.properties["Status"] = ticktickToNotion("Status", task.status)
          updated = true
        }
        if (new Date(ticktickToNotion("Date", task.startDate)).toISOString() !== new Date(this.properties["Date"]).toISOString()) {
          this.properties["Date"] = ticktickToNotion("Date", task.startDate)
          updated = true
        }
        if (ticktickToNotion("Priority", task.priority) !== this.properties["Priority"]) {
          this.properties["Priority"] = ticktickToNotion("Priority", task.priority)
          updated = true
        }

        return updated
      }
    }
    return false
  }

  // Get a task's properties from Notion
  async getNotion(): Promise<boolean> {
    // Update the properties
    let updated: boolean = false
    for (let label in this.property_ids) {
      const response = await notion.pages.properties.retrieve({ page_id: this.notion_id, property_id: this.property_ids[label]?.id })

      //if (ACCESSOR_MAP[label]) console.log(`notion ${label}`, ACCESSOR_MAP[label](response))
      switch (label) {
        case "Name":
          if (this.name !== ACCESSOR_MAP["Name"](response)) {
            this.name = ACCESSOR_MAP["Name"](response)
            updated = true
          }
          break;

        case "TickTick ID":
          if (this.ticktick_id !== ACCESSOR_MAP["TickTick ID"](response)) {
            this.ticktick_id = ACCESSOR_MAP["TickTick ID"](response)
            updated = true
          }
          break;

        case "Date":
        case "Type":
        case "Job":
        case "Status":
        case "Priority":
          if (this.properties[label] !== ACCESSOR_MAP[label](response)) {
            this.properties[label] = ACCESSOR_MAP[label](response)
            updated = true
          }
          break;

        case "Tags":
          let respTags = ACCESSOR_MAP[label](response)
          if (this.properties[label]?.length === respTags?.length) {
            for (let i = 0; i < respTags.length; i++) {
              if (this.properties[label][i] !== respTags[i]) {
                updated = true
                break
              }
            }

            if (updated) {
              this.properties[label] = respTags
            }
          }
      }
    }
    return updated
  }

  // Sync makes sure the notion and ticktick task have the same properties
  async sync() {
    await this.getNotion().then((updated: boolean) => {
      console.log("notion updated?", updated)
      if (updated) {
        console.log("updating first")
        this.update().then(() => {
          this.getTicktick().then((updated: boolean) => {
            console.log("ticktick updated?", updated)
            if (updated) {
              console.log("updating after first (shouldn't happen)")
              this.update()
            }
          })
        })
      } else {
        this.getTicktick().then((updated: boolean) => {
          console.log("ticktick updated?", updated)
          if (updated) {
            this.update()
            console.log("updating second")
          }
        })
      }
    })
  }
}


// Helper functions to convert notion data to ticktick data
const notionToTicktick = (label: string, val: any): any => {
  if (label === "Status") {
    return val ? 2 : 0
  } else if (label === "Priority") {
    switch (val) {
      case "High":
        return 5
      break

      case "Medium":
        return 3
      break

      case "Low":
        return 1
      break
    }
    return 0
  } else if (label === "Date") {
    return new Date(val).toISOString()
  } else {
    return val
  }
}

const ticktickToNotion = (label: string, val: any): any => {
  if (label === "Status") {
    return val === 2 ? true : false
  } else if (label === "Priority") {
    switch (val) {
      case 5:
        return "High"
      case 3:
        return "Medium"
      case 1:
        return "Low"
    }
    return "None"
  } else if (label === "Date") {
    return new Date(val).toISOString().split("T")[0]
  } else {
    return val
  }
}

/* Main */

// Read in credentials
fs.readFile(CREDENTIAL_PATH, "utf8", async (err: Error, data: string) => {
  if (err != undefined) {
    console.log(`Error reading notion credential file ${err}`)
    return
  }

  // Initialize the notion and ticktick clients
  credentials = JSON.parse(data)
  notion = new Client({ auth: credentials.notion.token })
  await ticktick.login({ email: { username: credentials.ticktick.username, password: credentials.ticktick.password }})

  let t: Task = new Task("e3caf53c0c134aab8a9e62aabeac0eaf")
  await t.init()
})

/* NOTES
 *
 * Notion ID
 {
object: 'page',
id: '4f210729-6f04-4522-8f41-ce0a046374d0',
created_time: '2022-08-03T00:00:00.000Z',
last_edited_time: '2022-08-03T00:41:00.000Z',
created_by: [Object],
last_edited_by: [Object],
cover: null,
icon: null,
parent: [Object],
archived: false,
properties: [Object],
url: 'https://www.notion.so/Example-task-3-4f2107296f0445228f41ce0a046374d0'
},

 */

/*
// Convert a notion response to a value
static notionToValue(property: string, resp: any): any {
// Standardize the property
property = property.toLowerCase().replace(" ", "_")

return ACCESSOR_MAP[property](resp)
}

// Convert a value to a notion response
valueToNotion(property: string): any {
// Standardize the property
property = property.toLowerCase().replace(" ", "_")

let obj: any = {}
obj[property] = {}
obj[property][TYPE_MAP[property]] = this.properties[property]

return obj
}
 */
