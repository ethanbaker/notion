"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
/* Imports */
var fs = require("fs");
var Client = require("@notionhq/client").Client;
/* Constants */
// The path of the credentials file
var CREDENTIAL_PATH = "./_credentials/credentials.json";
// A map to access different values inside of properties
var ACCESSOR_MAP = {
    "Name": function (e) { var _a, _b; return (_b = (_a = e.results) === null || _a === void 0 ? void 0 : _a.filter(function (f) { return f.id == "title"; })[0]) === null || _b === void 0 ? void 0 : _b.title.plain_text; },
    "Type": function (e) { var _a; return (_a = e.select) === null || _a === void 0 ? void 0 : _a.name; },
    "Job": function (e) { var _a; return (_a = e.select) === null || _a === void 0 ? void 0 : _a.name; },
    "Status": function (e) { return e.checkbox; },
    "Date": function (e) { var _a; return (_a = e.date) === null || _a === void 0 ? void 0 : _a.start; },
    "Priority": function (e) { var _a; return (_a = e.select) === null || _a === void 0 ? void 0 : _a.name; },
    "Tags": function (e) { var _a; return (_a = e.multi_select) === null || _a === void 0 ? void 0 : _a.map(function (e) { return e.name; }); },
    "TickTick ID": function (e) { var _a; return (_a = e.results[0]) === null || _a === void 0 ? void 0 : _a.rich_text.plain_text; }
};
// A map to access different notion types of properties
var ENCODER_MAP = {
    "Type": function (id, e) { return { "select": { "name": e } }; },
    "Job": function (id, e) { return { "select": { "name": e } }; },
    "Status": function (id, e) { return { "checkbox": e }; },
    "Date": function (id, e) { return { "date": { "start": e } }; },
    "Priority": function (id, e) { return { "select": { "name": e } }; },
    "Tags": function (id, e) { return { "multi_select": e.map(function (f) { return { "name": f }; }) }; },
    "TickTick ID": function (id, e) { return { "rich_text": [{ "content": e }] }; }
};
var TYPE_MAP = {
    "Type": "select",
    "Job": "select",
    "Status": "checkbox",
    "Date": "date",
    "Priority": "select",
    "Tags": "multi_select",
    "TickTick ID": "rich_text"
};
/* Globals */
// The notion client
var notion;
// The ticktick client
var ticktick = require("ticktick-wrapper");
// The read credentials
var credentials = {};
// The list of tasks
var tasks;
/* Task */
var Task = /** @class */ (function () {
    // Default constructor of a Task, takes a notion ID and initializes properties
    function Task(notion_id) {
        this.name = ""; // The name of the task
        this.properties = {}; // The notion properties of the task
        this.notion_id = ""; // The ID of the page from notion
        this.notion_url = ""; // The URL to the notion task
        this.property_ids = {}; // A list of property IDs for notion
        this.ticktick_id = ""; // The ID of the task from ticktick
        this.notion_id = notion_id;
    }
    Task.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, notion.pages.retrieve({ page_id: this.notion_id })];
                    case 1:
                        response = _a.sent();
                        this.property_ids = response.properties;
                        this.notion_url = response.url;
                        // Constantly sync
                        setInterval(function () {
                            _this.sync();
                        }, 20000);
                        return [2 /*return*/];
                }
            });
        });
    };
    // Write attributes to notion and ticktick
    Task.prototype.update = function () {
        return __awaiter(this, void 0, void 0, function () {
            var properties, property, list, completed, todo, _i, _a, task;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // Prechecks
                        if (this.notion_id == undefined ||
                            this.notion_id === "" ||
                            this.ticktick_id == undefined ||
                            this.ticktick_id === "" ||
                            Object.keys(this.properties).length == 0)
                            return [2 /*return*/];
                        properties = { "Name": { "title": [{ "text": { "content": this.name } }] } };
                        for (property in this.properties) {
                            properties[property] = ENCODER_MAP[property](this.property_ids[property], this.properties[property]);
                        }
                        // Update the properties for notion
                        return [4 /*yield*/, notion.pages.update({ page_id: this.notion_id, properties: properties })
                            // Find the correct ticktick task
                        ];
                    case 1:
                        // Update the properties for notion
                        _b.sent();
                        return [4 /*yield*/, ticktick.lists.getByName(credentials.ticktick.main_list)];
                    case 2:
                        list = _b.sent();
                        return [4 /*yield*/, list.getCompletedTasks()];
                    case 3:
                        completed = _b.sent();
                        return [4 /*yield*/, list.getTodoTasks()];
                    case 4:
                        todo = _b.sent();
                        for (_i = 0, _a = todo.concat(completed); _i < _a.length; _i++) {
                            task = _a[_i];
                            if (task.id === this.ticktick_id) {
                                task.title = this.name;
                                task.status = notionToTicktick("Status", this.properties["Status"]);
                                task.startDate = notionToTicktick("Date", this.properties["Date"]); // TODO may have to format
                                task.dueDate = notionToTicktick("Date", new Date(this.properties["Date"]).setUTCMinutes(new Date(this.properties["Date"]).getUTCMinutes() + 60 * 24));
                                task.priority = notionToTicktick("Priority", this.properties["Priority"]);
                                task.save();
                                task.update();
                                break;
                            }
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    // Get a task's properties from Ticktick
    Task.prototype.getTicktick = function () {
        return __awaiter(this, void 0, void 0, function () {
            var list, completed, todo, _i, _a, task, updated;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, ticktick.lists.getByName(credentials.ticktick.main_list)];
                    case 1:
                        list = _b.sent();
                        return [4 /*yield*/, list.getCompletedTasks()];
                    case 2:
                        completed = _b.sent();
                        return [4 /*yield*/, list.getTodoTasks()];
                    case 3:
                        todo = _b.sent();
                        for (_i = 0, _a = completed.concat(todo); _i < _a.length; _i++) {
                            task = _a[_i];
                            if (task.id === this.ticktick_id) {
                                updated = false;
                                if (task.title !== this.name) {
                                    this.name = task.title;
                                    updated = true;
                                }
                                if (ticktickToNotion("Status", task.status) !== this.properties["Status"]) {
                                    this.properties["Status"] = ticktickToNotion("Status", task.status);
                                    updated = true;
                                }
                                if (new Date(ticktickToNotion("Date", task.startDate)).toISOString() !== new Date(this.properties["Date"]).toISOString()) {
                                    this.properties["Date"] = ticktickToNotion("Date", task.startDate);
                                    updated = true;
                                }
                                if (ticktickToNotion("Priority", task.priority) !== this.properties["Priority"]) {
                                    this.properties["Priority"] = ticktickToNotion("Priority", task.priority);
                                    updated = true;
                                }
                                return [2 /*return*/, updated];
                            }
                        }
                        return [2 /*return*/, false];
                }
            });
        });
    };
    // Get a task's properties from Notion
    Task.prototype.getNotion = function () {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var updated, _c, _d, _i, label, response, respTags, i;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        updated = false;
                        _c = [];
                        for (_d in this.property_ids)
                            _c.push(_d);
                        _i = 0;
                        _e.label = 1;
                    case 1:
                        if (!(_i < _c.length)) return [3 /*break*/, 4];
                        label = _c[_i];
                        return [4 /*yield*/, notion.pages.properties.retrieve({ page_id: this.notion_id, property_id: (_a = this.property_ids[label]) === null || _a === void 0 ? void 0 : _a.id })
                            //if (ACCESSOR_MAP[label]) console.log(`notion ${label}`, ACCESSOR_MAP[label](response))
                        ];
                    case 2:
                        response = _e.sent();
                        //if (ACCESSOR_MAP[label]) console.log(`notion ${label}`, ACCESSOR_MAP[label](response))
                        switch (label) {
                            case "Name":
                                if (this.name !== ACCESSOR_MAP["Name"](response)) {
                                    this.name = ACCESSOR_MAP["Name"](response);
                                    updated = true;
                                }
                                break;
                            case "TickTick ID":
                                if (this.ticktick_id !== ACCESSOR_MAP["TickTick ID"](response)) {
                                    this.ticktick_id = ACCESSOR_MAP["TickTick ID"](response);
                                    updated = true;
                                }
                                break;
                            case "Date":
                            case "Type":
                            case "Job":
                            case "Status":
                            case "Priority":
                                if (this.properties[label] !== ACCESSOR_MAP[label](response)) {
                                    this.properties[label] = ACCESSOR_MAP[label](response);
                                    updated = true;
                                }
                                break;
                            case "Tags":
                                respTags = ACCESSOR_MAP[label](response);
                                if (((_b = this.properties[label]) === null || _b === void 0 ? void 0 : _b.length) === (respTags === null || respTags === void 0 ? void 0 : respTags.length)) {
                                    for (i = 0; i < respTags.length; i++) {
                                        if (this.properties[label][i] !== respTags[i]) {
                                            updated = true;
                                            break;
                                        }
                                    }
                                    if (updated) {
                                        this.properties[label] = respTags;
                                    }
                                }
                        }
                        _e.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, updated];
                }
            });
        });
    };
    // Sync makes sure the notion and ticktick task have the same properties
    Task.prototype.sync = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getNotion().then(function (updated) {
                            console.log("notion updated?", updated);
                            if (updated) {
                                console.log("updating first");
                                _this.update().then(function () {
                                    _this.getTicktick().then(function (updated) {
                                        console.log("ticktick updated?", updated);
                                        if (updated) {
                                            console.log("updating after first (shouldn't happen)");
                                            _this.update();
                                        }
                                    });
                                });
                            }
                            else {
                                _this.getTicktick().then(function (updated) {
                                    console.log("ticktick updated?", updated);
                                    if (updated) {
                                        _this.update();
                                        console.log("updating second");
                                    }
                                });
                            }
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return Task;
}());
// Helper functions to convert notion data to ticktick data
var notionToTicktick = function (label, val) {
    if (label === "Status") {
        return val ? 2 : 0;
    }
    else if (label === "Priority") {
        switch (val) {
            case "High":
                return 5;
                break;
            case "Medium":
                return 3;
                break;
            case "Low":
                return 1;
                break;
        }
        return 0;
    }
    else if (label === "Date") {
        return new Date(val).toISOString();
    }
    else {
        return val;
    }
};
var ticktickToNotion = function (label, val) {
    if (label === "Status") {
        return val === 2 ? true : false;
    }
    else if (label === "Priority") {
        switch (val) {
            case 5:
                return "High";
            case 3:
                return "Medium";
            case 1:
                return "Low";
        }
        return "None";
    }
    else if (label === "Date") {
        return new Date(val).toISOString().split("T")[0];
    }
    else {
        return val;
    }
};
/* Main */
// Read in credentials
fs.readFile(CREDENTIAL_PATH, "utf8", function (err, data) { return __awaiter(void 0, void 0, void 0, function () {
    var t;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (err != undefined) {
                    console.log("Error reading notion credential file ".concat(err));
                    return [2 /*return*/];
                }
                // Initialize the notion and ticktick clients
                credentials = JSON.parse(data);
                notion = new Client({ auth: credentials.notion.token });
                return [4 /*yield*/, ticktick.login({ email: { username: credentials.ticktick.username, password: credentials.ticktick.password } })];
            case 1:
                _a.sent();
                t = new Task("e3caf53c0c134aab8a9e62aabeac0eaf");
                return [4 /*yield*/, t.init()];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
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
