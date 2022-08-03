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
// Imports
var fs = require("fs");
var Client = require("@notionhq/client").Client;
// Globals
var notion;
var credentials = {};
var tasks;
// Read in credentials
fs.readFile("./_credentials/credentials.json", "utf8", function (err, data) {
    if (err != undefined) {
        console.log("Error reading notion credential file " + err);
        return;
    }
    credentials = JSON.parse(data);
    notion = new Client({ auth: credentials.notion.token });
    getNotionTasks();
});
// Get Notion tasks
var getNotionTasks = function () { return __awaiter(void 0, void 0, void 0, function () {
    var response, tasks, label, task;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, notion.databases.query({
                    database_id: credentials.notion.task_database_id,
                    filter: {
                        or: [
                            { property: "Type", select: { "equals": "Short Term" } }
                        ]
                    },
                    sorts: [
                        {
                            property: "Due Date",
                            direction: "descending"
                        },
                    ]
                })];
            case 1:
                response = _a.sent();
                tasks = [];
                for (label in response.results) {
                    task = {
                        // Add notion specific properties
                        notionId: response.results[label].id,
                        notionUrl: response.results[label].url
                    };
                    // Add general properties
                    console.log(response.results[label].properties);
                }
                return [2 /*return*/, tasks];
        }
    });
}); };
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
