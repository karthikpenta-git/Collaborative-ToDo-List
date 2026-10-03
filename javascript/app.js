const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");

const TaskManager = require("./taskManager");
const { loadData, saveData } = require("./storage");
const runConcurrencyDemo = require("./concurrencyDemo");

// Connect the application to terminal input and output.
const rl = readline.createInterface({
    input: stdin,
    output: stdout
});

// Manage users and tasks.
const manager = new TaskManager();

// Define terminal colors.
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m"
};

// Display highlighted feedback.
function showMessage(message, type = "info") {
    const messageColors = {
        success: colors.green,
        error: colors.red,
        warning: colors.yellow,
        info: colors.cyan
    };

    const color = messageColors[type] || colors.cyan;

    console.log(`\n${color}----------------------------------------`);
    console.log(`  ${message}`);
    console.log(`----------------------------------------${colors.reset}\n`);
}

// Display a highlighted heading.
function showHeading(title) {
    console.log(`\n${colors.cyan}${title}${colors.reset}`);
}

// Display the main menu grouped by purpose.
function displayMenu() {
    console.log(`
${colors.cyan}================================================
            COLLABORATIVE TO-DO LIST
================================================${colors.reset}

${colors.cyan}  CREATE${colors.reset}
    1. Create user
    2. Add task

${colors.cyan}  VIEW${colors.reset}
    3. View users
    4. View all tasks
    5. View tasks by user
    6. View tasks by category

${colors.cyan}  UPDATE & DELETE${colors.reset}
    7. Mark task as completed
    8. Delete task
    9. Reassign task
   10. Delete user

${colors.cyan}  DEMO & EXIT${colors.reset}
   11. Run concurrency demo
   12. Exit

${colors.cyan}================================================${colors.reset}
`);
}

// Read and validate a user or task ID.
async function askForId(prompt) {
    const answer = (await rl.question(prompt)).trim();
    const id = Number(answer);

    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error("Enter a valid positive whole-number ID.");
    }

    return id;
}

// Display a highlighted table or an empty-list message.
function showRecords(records, emptyMessage, title) {
    if (records.length === 0) {
        showMessage(emptyMessage, "info");
        return;
    }

    if (title) {
        showHeading(title);
    }

    console.log(colors.cyan);

    try {
        console.table(records);
    } finally {
        console.log(colors.reset);
    }
}

// Save data after a successful change.
async function persistChanges() {
    try {
        await saveData(manager.getData());
    } catch (error) {
        const saveError = new Error(
            `Could not save data: ${error.message}`
        );

        saveError.stopApplication = true;
        throw saveError;
    }
}

// Create a user.
async function createUser() {
    const name = await rl.question("Enter user name: ");
    const user = manager.addUser(name);

    await persistChanges();

    showMessage(
        `User created: ${user.name} (ID ${user.id})`,
        "success"
    );
}

// Create a task assigned to an existing user.
async function addTask() {
    if (manager.users.length === 0) {
        showMessage(
            "No users yet. Create a user first.",
            "warning"
        );
        return;
    }

    const title = await rl.question("Enter task title: ");
    const category = await rl.question("Enter category: ");

    showRecords(manager.users, "No users yet.", "Available users:");

    const userId = await askForId("Assign to user ID: ");
    const task = manager.addTask(title, category, userId);

    await persistChanges();

    showMessage(
        `Task ${task.id} created and assigned to ` +
        `${manager.getUser(userId).name}.`,
        "success"
    );
}

// Display tasks assigned to a selected user.
async function viewTasksByUser() {
    if (manager.users.length === 0) {
        showMessage("No users yet.", "info");
        return;
    }

    showRecords(manager.users, "No users yet.", "Available users:");

    const userId = await askForId("Enter user ID: ");
    const user = manager.getUser(userId);

    showRecords(
        manager.getTasksByUser(userId),
        "This user has no tasks.",
        `Tasks assigned to ${user.name}:`
    );
}

// Display tasks in the selected category.
async function viewTasksByCategory() {
    if (manager.tasks.length === 0) {
        showMessage("No tasks yet.", "info");
        return;
    }

    const category = await rl.question("Enter category: ");
    const matchingTasks = manager.getTasksByCategory(category);

    showRecords(
        matchingTasks,
        "No tasks found in this category.",
        `Tasks in category "${category.trim()}":`
    );
}

// Mark a selected task as completed.
async function completeTask() {
    if (manager.tasks.length === 0) {
        showMessage("No tasks yet.", "info");
        return;
    }

    showRecords(manager.tasks, "No tasks yet.", "Available tasks:");

    const taskId = await askForId("Enter task ID to complete: ");
    const changed = manager.completeTask(taskId);

    if (!changed) {
        showMessage("This task is already completed.", "info");
        return;
    }

    await persistChanges();

    showMessage(
        `Task completed: ${manager.getTask(taskId).title}`,
        "success"
    );
}

// Delete a selected task.
async function deleteTask() {
    if (manager.tasks.length === 0) {
        showMessage("No tasks yet.", "info");
        return;
    }

    showRecords(manager.tasks, "No tasks yet.", "Available tasks:");

    const taskId = await askForId("Enter task ID to delete: ");
    const task = manager.deleteTask(taskId);

    await persistChanges();

    showMessage(`Task deleted: ${task.title}`, "success");
}

// Reassign a task to another user.
async function reassignTask() {
    if (manager.tasks.length === 0) {
        showMessage("No tasks yet.", "info");
        return;
    }

    showRecords(manager.tasks, "No tasks yet.", "Available tasks:");

    const taskId = await askForId("Enter task ID to reassign: ");

    // Confirm the task exists before requesting a new user.
    manager.getTask(taskId);

    showRecords(manager.users, "No users yet.", "Available users:");

    const newUserId = await askForId("Enter new user ID: ");
    const task = manager.reassignTask(taskId, newUserId);

    await persistChanges();

    showMessage(
        `"${task.title}" reassigned to ` +
        `${manager.getUser(newUserId).name}.`,
        "success"
    );
}

// Request confirmation before deleting a user and assigned tasks.
async function deleteUser() {
    if (manager.users.length === 0) {
        showMessage("No users yet.", "info");
        return;
    }

    showRecords(manager.users, "No users yet.", "Available users:");

    const userId = await askForId("Enter user ID to delete: ");
    const user = manager.getUser(userId);
    const assignedTasks = manager.getTasksByUser(userId);

    const pendingCount = assignedTasks.filter(
        task => task.status === "Pending"
    ).length;

    const completedCount = assignedTasks.filter(
        task => task.status === "Completed"
    ).length;

    showMessage(
        `${user.name} has ${pendingCount} pending task(s) ` +
        `and ${completedCount} completed task(s).`,
        "warning"
    );

    showMessage(
        `Deleting this user will also delete all ` +
        `${assignedTasks.length} assigned task(s).`,
        "warning"
    );

    const confirmation = (
        await rl.question("Type yes to confirm deletion: ")
    ).trim().toLowerCase();

    if (confirmation !== "yes") {
        showMessage("User deletion cancelled.", "info");
        return;
    }

    manager.deleteUser(userId);

    await persistChanges();

    showMessage(
        `User and assigned tasks deleted: ${user.name}`,
        "success"
    );
}

// Highlight progress messages and tables from the existing demo.
async function displayConcurrencyDemo() {
    showMessage("Starting the concurrency demonstration.", "info");

    const originalLog = console.log;
    const originalTable = console.table;

    // Format the demo's existing progress logs.
    console.log = (...messages) => {
        originalLog(
            colors.cyan,
            ...messages,
            colors.reset
        );
    };

    // Highlight the demo's task table.
    console.table = (...argumentsList) => {
        originalLog(colors.cyan);

        try {
            originalTable.apply(console, argumentsList);
        } finally {
            originalLog(colors.reset);
        }
    };

    try {
        await runConcurrencyDemo(manager);
    } finally {
        // Restore normal logging after the demo finishes or fails.
        console.log = originalLog;
        console.table = originalTable;
    }

    showMessage(
        "Concurrency demonstration finished. " +
        "Your saved tasks were not changed.",
        "success"
    );
}

// Load saved data and process menu selections.
async function main() {
    try {
        manager.loadData(await loadData());

        while (true) {
            displayMenu();

            const choice = (
                await rl.question("Select an option: ")
            ).trim();

            try {
                switch (choice) {
                case "1":
                    await createUser();
                    break;

                case "2":
                    await addTask();
                    break;

                case "3":
                    showRecords(
                        manager.users,
                        "No users yet.",
                        "Users:"
                    );
                    break;

                case "4":
                    showRecords(
                        manager.tasks,
                        "No tasks yet.",
                        "All tasks:"
                    );
                    break;

                case "5":
                    await viewTasksByUser();
                    break;

                case "6":
                    await viewTasksByCategory();
                    break;

                case "7":
                    await completeTask();
                    break;

                case "8":
                    await deleteTask();
                    break;

                case "9":
                    await reassignTask();
                    break;

                case "10":
                    await deleteUser();
                    break;

                case "11":
                    await displayConcurrencyDemo();
                    break;

                case "12":
                    showMessage("Goodbye!", "info");
                    return;

                default:
                    showMessage(
                        "Invalid option. Choose 1 through 12.",
                        "error"
                    );
            }
            } catch (error) {
                if (error.stopApplication) {
                    throw error;
                }

                showMessage(error.message, "error");
            }

        }
    } finally {
        // Close terminal input when the application finishes.
        rl.close();
    }
}

// Report errors that prevent the application from continuing.
main().catch(error => {
    showMessage(
        `Application stopped: ${error.message}`,
        "error"
    );

    process.exitCode = 1;
});