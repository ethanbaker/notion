// Imports
const fs = require("fs")
const { Client } = require("@notionhq/client")

// Types
type Task = {
  notionId: string,
  notionUrl: string

  ticktickId: string,

  title: string,
  dueDate: string,
  priority: string,
  status: boolean,
  content: string,
}

// Globals
let notion: any
let credentials: {[key: string]: {[key: string]: string}} = {}
let tasks: Task[]

// Read in credentials
fs.readFile("./_credentials/credentials.json", "utf8", (err: Error, data: string) => {
  if (err != undefined) {
    console.log(`Error reading notion credential file ${err}`)
    return
  }

  credentials = JSON.parse(data)
  notion = new Client({ auth: credentials.notion.token })
  getNotionTasks()
})


// Get Notion tasks
const getNotionTasks = async (): Promise<Task[]> => {
  // Create a query to get notion task IDs
  const query = await notion.databases.query({
    database_id: credentials.notion.task_database_id,
    filter: {
      or: [
        {property: "Type", select: {"equals": "Short Term"}}
      ]
    },
    sorts: [
      {
        property: "Due Date",
        direction: "descending",
      },
    ],
  })

  // Get the allowed IDs
  let ids: string[] = []
  for (let label in query.results) {
    ids.push(query.results[label].id)
  }

  // Create a response for the tasks
  const response = await notion.databases.retrieve({ database_id: credentials.notion.task_database_id })
  
  // Get the tasks
  let tasks: Task[] = []
  for (let index = 0; index < response.title.length; i++) {
    // TODO Check for ID match and add attributes
    let task: Task = {

    }

  }
  
  return tasks
}

/*
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
