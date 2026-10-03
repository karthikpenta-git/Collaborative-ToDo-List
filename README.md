## JavaScript Implementation — Aliza Shrestha

A terminal-based collaborative to-do list built with JavaScript and Node.js.

### Features

- Create and view users.
- Add tasks with a category and assigned user.
- View all tasks or filter by user or category.
- Mark tasks as completed.
- Delete and reassign tasks.
- Delete users and their assigned tasks after confirmation.
- Reject duplicate usernames, ignoring capitalization.
- Reject duplicate task titles assigned to the same user, ignoring capitalization.
- Save users, tasks, and ID counters to JSON.
- Load saved data when the application starts.
- Demonstrate asynchronous concurrency with two simulated user operations.

### Requirements and Running

Install Node.js. No additional npm packages are required.

From the repository root, run:

```bash
node javascript/app.js
```

Choose an option from the terminal menu. Select option 12 to exit.

### Modules

| File                            | Purpose                                       |
| ------------------------------- | --------------------------------------------- |
| `javascript/app.js`             | Displays the menu and handles terminal input. |
| `javascript/user.js`            | Defines the User class.                       |
| `javascript/task.js`            | Defines the Task class.                       |
| `javascript/taskManager.js`     | Manages users, tasks, and validation rules.   |
| `javascript/storage.js`         | Reads and writes JSON data.                   |
| `javascript/concurrencyDemo.js` | Runs two overlapping asynchronous operations. |
| `javascript/data.json`          | Stores saved application data.                |

### JSON Storage

Successful changes are saved immediately to `javascript/data.json`.
The application restores users, tasks, task statuses, and ID counters
when it restarts.

If the file does not exist, the application starts with empty lists.
User and task IDs are not renumbered after deletion.

### Concurrency Demonstration

Option 11 uses `async/await`, timers, and `Promise.all()` to simulate
two users adding tasks with overlapping waiting periods.

Both operations start before either finishes. The operation with the
shorter delay normally finishes first. Task updates execute sequentially
on the JavaScript event loop.

The demo uses a separate copy of the application data. Its tasks are
not added to the main task list or saved to JSON.

This demonstrates simulated asynchronous concurrency within one process.
The application does not support simultaneous editing through separate
terminal instances sharing the same JSON file.

### Manual Checks Completed

- Saved users and tasks loaded successfully.
- Duplicate usernames were rejected.
- Duplicate task titles for the same user were rejected.
- Completed task status remained after restarting.
- Both concurrency demo operations finished.
- Saved tasks remained unchanged after the demo.
