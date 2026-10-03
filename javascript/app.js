const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");
const TaskManager = require("./taskManager");
const { loadData, saveData } = require("./storage");
const runConcurrencyDemo = require("./concurrencyDemo");

// Connect the terminal and create the application's task manager.
const rl = readline.createInterface({
    input: stdin,
    output: stdout
});

const manager = new TaskManager();

// Receive a positive whole-number ID.
async function askForId(question) {
    const input = (await rl.question(question)).trim();
    const id = Number(input);

    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error("Enter a valid positive integer ID.");
    }

    return id;
}

// Display records or an empty-list message.
function showRecords(records, emptyMessage) {
    if (records.length === 0) {
        console.log(emptyMessage);
    } else {
        console.table(records);
    }
}

// Save changes and stop the application if saving fails.
async function persistChanges() {
    try {
        await saveData(manager.getData());
    } catch (error) {
        const failure = new Error(`Could not save data: ${error.message}`);
        failure.stopApplication = true;
        throw failure;
    }
}

async function main() {
    try {
        // Load and validate saved records before accepting changes.
        manager.loadData(await loadData());

        let running = true;

        while (running) {
            console.log("\nCollaborative To-Do List");
            console.log("1. Create user");
            console.log("2. View users");
            console.log("3. Add task");
            console.log("4. View all tasks");
            console.log("5. View tasks by user");
            console.log("6. Mark task as completed");
            console.log("7. Delete task");
            console.log("8. View tasks by category");
            console.log("9. Reassign task");
            console.log("10. Delete user");
            console.log("11. Run concurrency demo");
            console.log("12. Exit");

            const choice = (await rl.question("Select an option: ")).trim();

            try {
                switch (choice) {
                    case "1": {
                        // Receive the name and create a validated user.
                        const name = await rl.question("Enter user name: ");
                        const user = manager.addUser(name);
                        await persistChanges();

                        console.log(
                            `User created: ${user.name} (ID ${user.id})`
                        );
                        break;
                    }

                    case "2":
                        showRecords(
                            manager.users,
                            "No users yet. Create one first."
                        );
                        break;

                    case "3": {
                        if (manager.users.length === 0) {
                            console.log("Create a user before adding a task.");
                            break;
                        }

                        // Receive task details and its assigned user.
                        const title = await rl.question("Enter task title: ");
                        const category = await rl.question("Enter category: ");

                        console.table(manager.users);
                        const userId = await askForId("Assign to user ID: ");

                        const task = manager.addTask(title, category, userId);
                        await persistChanges();

                        console.log(
                            `Task ${task.id} created and assigned to ` +
                            `${manager.getUser(userId).name}.`
                        );
                        break;
                    }

                    case "4":
                        showRecords(
                            manager.tasks,
                            "No tasks yet. Add one first."
                        );
                        break;

                    case "5": {
                        if (manager.users.length === 0) {
                            console.log("No users yet. Create one first.");
                            break;
                        }

                        console.table(manager.users);
                        const userId = await askForId("Enter user ID: ");
                        const user = manager.getUser(userId);

                        console.log(`\nTasks assigned to ${user.name}:`);
                        showRecords(
                            manager.getTasksByUser(userId),
                            "No tasks assigned to this user."
                        );
                        break;
                    }

                    case "6": {
                        if (manager.tasks.length === 0) {
                            console.log("No tasks yet. Add one first.");
                            break;
                        }

                        console.table(manager.tasks);
                        const taskId = await askForId(
                            "Enter task ID to complete: "
                        );

                        const changed = manager.completeTask(taskId);

                        if (!changed) {
                            console.log("This task is already completed.");
                            break;
                        }

                        await persistChanges();
                        console.log(
                            `Task "${manager.getTask(taskId).title}" ` +
                            "marked as completed."
                        );
                        break;
                    }

                    case "7": {
                        if (manager.tasks.length === 0) {
                            console.log("No tasks to delete.");
                            break;
                        }

                        console.table(manager.tasks);
                        const taskId = await askForId(
                            "Enter task ID to delete: "
                        );

                        const task = manager.deleteTask(taskId);
                        await persistChanges();

                        console.log(`Task "${task.title}" deleted.`);
                        break;
                    }

                    case "8": {
                        if (manager.tasks.length === 0) {
                            console.log("No tasks yet. Add one first.");
                            break;
                        }

                        const category = await rl.question("Enter category: ");

                        showRecords(
                            manager.getTasksByCategory(category),
                            "No tasks found in that category."
                        );
                        break;
                    }

                    case "9": {
                        if (manager.tasks.length === 0) {
                            console.log("No tasks to reassign.");
                            break;
                        }

                        console.table(manager.tasks);
                        const taskId = await askForId(
                            "Enter task ID to reassign: "
                        );

                        // Check the task before asking for the new user.
                        manager.getTask(taskId);
                        console.table(manager.users);

                        const userId = await askForId("Enter new user ID: ");
                        const task = manager.reassignTask(taskId, userId);
                        await persistChanges();

                        console.log(
                            `Task "${task.title}" reassigned to ` +
                            `${manager.getUser(userId).name}.`
                        );
                        break;
                    }

                    case "10": {
                        if (manager.users.length === 0) {
                            console.log("No users to delete.");
                            break;
                        }

                        console.table(manager.users);
                        const userId = await askForId(
                            "Enter user ID to delete: "
                        );

                        const user = manager.getUser(userId);
                        const userTasks = manager.getTasksByUser(userId);

                        const pending = userTasks.filter(
                            task => task.status === "Pending"
                        ).length;

                        const completed = userTasks.filter(
                            task => task.status === "Completed"
                        ).length;

                        // Explain all affected records before deleting.
                        console.log(
                            `${user.name} has ${pending} pending tasks ` +
                            `and ${completed} completed tasks.`
                        );

                        console.log(
                            "Deleting this user will also delete all " +
                            `${userTasks.length} assigned tasks.`
                        );

                        const confirmation = (
                            await rl.question("Continue? (yes/no): ")
                        ).trim().toLowerCase();

                        if (confirmation !== "yes") {
                            console.log("Deletion cancelled.");
                            break;
                        }

                        manager.deleteUser(userId);
                        await persistChanges();

                        console.log(
                            `User "${user.name}" and their assigned tasks deleted.`
                        );
                        break;
                    }

                    case "11":
                        await runConcurrencyDemo(manager);
                        break;

                    case "12":
                        running = false;
                        console.log("Goodbye!");
                        break;

                    default:
                        console.log("Invalid option. Choose 1 through 12.");
                }
            } catch (error) {
                // Stop on storage failure; allow another choice after invalid input.
                if (error.stopApplication) {
                    throw error;
                }

                console.log(error.message);
            }
        }
    } finally {
        // Close terminal input after exit or failure.
        rl.close();
    }
}

main().catch(error => {
    console.error("Application stopped:", error.message);
    process.exitCode = 1;
});