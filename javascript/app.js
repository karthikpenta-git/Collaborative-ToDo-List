// Load tools for terminal input and local file storage.
const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");
const fs = require("node:fs/promises");
const path = require("node:path");

// Store application data beside this file.
const dataFile = path.join(__dirname, "data.json");

const rl = readline.createInterface({
    input: stdin,
    output: stdout
});

// Define the information stored for each user.
class User {
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}

// Define the information stored for each task.
class Task {
    constructor(id, title, category, assignedUserId) {
        this.id = id;
        this.title = title;
        this.category = category;
        this.assignedUserId = assignedUserId;
        this.status = "Pending";
    }
}

// Hold the application's current data.
const users = [];
const tasks = [];
let nextUserId = 1;
let nextTaskId = 1;

// Save data through a temporary file before replacing the saved file.
async function saveData() {
    const data = {
        users,
        tasks,
        nextUserId,
        nextTaskId
    };

    const temporaryFile = `${dataFile}.tmp`;

    await fs.writeFile(
        temporaryFile,
        JSON.stringify(data, null, 2),
        "utf8"
    );

    await fs.rename(temporaryFile, dataFile);
}

// Load saved data and reject an invalid file before making changes.
async function loadData() {
    let jsonText;

    try {
        jsonText = await fs.readFile(dataFile, "utf8");
    } catch (error) {
        // Start empty when no saved file exists.
        if (error.code === "ENOENT") {
            return;
        }

        throw error;
    }

    const data = JSON.parse(jsonText);

    if (
        !data ||
        !Array.isArray(data.users) ||
        !Array.isArray(data.tasks)
    ) {
        throw new Error("Saved data must contain users and tasks arrays.");
    }

    const userIds = new Set();
    const userNames = new Set();

    // Validate saved users and prevent duplicate IDs or names.
    for (const user of data.users) {
        if (
            !user ||
            !Number.isSafeInteger(user.id) ||
            user.id <= 0 ||
            typeof user.name !== "string" ||
            user.name.trim() === ""
        ) {
            throw new Error("Saved data contains an invalid user.");
        }

        const normalizedName = user.name.trim().toLowerCase();

        if (userIds.has(user.id) || userNames.has(normalizedName)) {
            throw new Error("Saved data contains duplicate users.");
        }

        userIds.add(user.id);
        userNames.add(normalizedName);
    }

    const taskIds = new Set();
    const taskAssignments = new Set();

    // Validate saved tasks and their assigned users.
    for (const task of data.tasks) {
        if (
            !task ||
            !Number.isSafeInteger(task.id) ||
            task.id <= 0 ||
            typeof task.title !== "string" ||
            task.title.trim() === "" ||
            typeof task.category !== "string" ||
            task.category.trim() === "" ||
            !userIds.has(task.assignedUserId) ||
            !["Pending", "Completed"].includes(task.status)
        ) {
            throw new Error("Saved data contains an invalid task.");
        }

        const assignmentKey = JSON.stringify([
            task.assignedUserId,
            task.title.trim().toLowerCase()
        ]);

        if (
            taskIds.has(task.id) ||
            taskAssignments.has(assignmentKey)
        ) {
            throw new Error("Saved data contains duplicate tasks.");
        }

        taskIds.add(task.id);
        taskAssignments.add(assignmentKey);
    }

    // Ensure new IDs will not conflict with saved records.
    if (
        !Number.isSafeInteger(data.nextUserId) ||
        data.nextUserId <= 0 ||
        data.users.some(user => user.id >= data.nextUserId) ||
        !Number.isSafeInteger(data.nextTaskId) ||
        data.nextTaskId <= 0 ||
        data.tasks.some(task => task.id >= data.nextTaskId)
    ) {
        throw new Error("Saved data contains invalid ID counters.");
    }

    // Restore users and tasks as class instances.
    for (const user of data.users) {
        users.push(new User(user.id, user.name.trim()));
    }

    for (const savedTask of data.tasks) {
        const task = new Task(
            savedTask.id,
            savedTask.title.trim(),
            savedTask.category.trim(),
            savedTask.assignedUserId
        );

        task.status = savedTask.status;
        tasks.push(task);
    }

    nextUserId = data.nextUserId;
    nextTaskId = data.nextTaskId;
}

// Receive a positive whole-number ID.
async function askForId(question) {
    const input = (await rl.question(question)).trim();
    const id = Number(input);

    if (!Number.isSafeInteger(id) || id <= 0) {
        console.log("Enter a valid positive integer ID.");
        return null;
    }

    return id;
}

// Simulate two users adding tasks with different completion delays.
async function runConcurrencyDemo() {
    if (users.length < 2) {
        console.log("Create at least two users to run this demo.");
        return;
    }

    const demoTasks = [];
    let nextDemoTaskId = 1;

    async function addDemoTask(user, title, delay) {
        console.log(`${user.name} started adding "${title}".`);

        // Simulate waiting for an asynchronous operation.
        await new Promise(resolve => setTimeout(resolve, delay));

        // Add the task to the shared demo array.
        const task = new Task(
            nextDemoTaskId,
            title,
            "Concurrency Demo",
            user.id
        );

        nextDemoTaskId++;
        demoTasks.push(task);

        console.log(`${user.name} finished adding "${title}".`);
    }

    console.log("\nStarting two overlapping user operations...");

    // Start both operations and wait until both finish.
    await Promise.all([
        addDemoTask(users[0], "Review application", 1000),
        addDemoTask(users[1], "Test application", 500)
    ]);

    console.log("\nBoth operations finished:");
    console.table(demoTasks);
    console.log("Demo tasks were not saved.");
}

async function main() {
    try {
        // Restore saved data before displaying the menu.
        await loadData();

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
            console.log("10. Delete user");
            console.log("11. Run concurrency demo");
            console.log("12. Exit");

            const choice = await rl.question("Select an option: ");

            switch (choice.trim()) {
                case "1": {
                    // Receive and validate the new user's name.
                    const name = (
                        await rl.question("Enter user name: ")
                    ).trim();

                    if (name === "") {
                        console.log("Name cannot be empty.");
                        break;
                    }

                    const duplicateUser = users.some(
                        user =>
                            user.name.toLowerCase() === name.toLowerCase()
                    );

                    if (duplicateUser) {
                        console.log("Username already exists.");
                        break;
                    }

                    // Add and save the new user.
                    const user = new User(nextUserId, name);
                    users.push(user);
                    nextUserId++;
                    await saveData();

                    console.log(
                        `User created: ${user.name} (ID ${user.id})`
                    );
                    break;
                }

                case "2": {
                    // Display the user list.
                    if (users.length === 0) {
                        console.log("No users yet. Create one first.");
                    } else {
                        console.table(users);
                    }
                    break;
                }

                case "3": {
                    // Require a user before adding an assigned task.
                    if (users.length === 0) {
                        console.log("Create a user before adding a task.");
                        break;
                    }

                    const title = (
                        await rl.question("Enter task title: ")
                    ).trim();

                    if (title === "") {
                        console.log("Title cannot be empty.");
                        break;
                    }

                    const category = (
                        await rl.question("Enter category: ")
                    ).trim();

                    if (category === "") {
                        console.log("Category cannot be empty.");
                        break;
                    }

                    console.table(users);

                    const assignedUserId = await askForId(
                        "Assign to user ID: "
                    );

                    if (assignedUserId === null) {
                        break;
                    }

                    const assignedUser = users.find(
                        user => user.id === assignedUserId
                    );

                    if (!assignedUser) {
                        console.log("User not found. Task was not added.");
                        break;
                    }

                    // Reject duplicate titles assigned to the same user.
                    const duplicateTask = tasks.some(
                        task =>
                            task.title.toLowerCase() === title.toLowerCase() &&
                            task.assignedUserId === assignedUserId
                    );

                    if (duplicateTask) {
                        console.log(
                            "This user already has a task with that title."
                        );
                        break;
                    }

                    // Add and save the new task.
                    const task = new Task(
                        nextTaskId,
                        title,
                        category,
                        assignedUserId
                    );

                    tasks.push(task);
                    nextTaskId++;
                    await saveData();

                    console.log(
                        `Task ${task.id} created and assigned to ${assignedUser.name}.`
                    );
                    break;
                }

                case "4": {
                    // Display the complete task list.
                    if (tasks.length === 0) {
                        console.log("No tasks yet. Add one first.");
                    } else {
                        console.table(tasks);
                    }
                    break;
                }

                case "5": {
                    // Select a user and display their assigned tasks.
                    if (users.length === 0) {
                        console.log("No users yet. Create one first.");
                        break;
                    }

                    console.table(users);
                    const userId = await askForId("Enter user ID: ");

                    if (userId === null) {
                        break;
                    }

                    const selectedUser = users.find(
                        user => user.id === userId
                    );

                    if (!selectedUser) {
                        console.log("User not found.");
                        break;
                    }

                    const userTasks = tasks.filter(
                        task => task.assignedUserId === userId
                    );

                    if (userTasks.length === 0) {
                        console.log(
                            `No tasks assigned to ${selectedUser.name}.`
                        );
                    } else {
                        console.log(
                            `\nTasks assigned to ${selectedUser.name}:`
                        );
                        console.table(userTasks);
                    }
                    break;
                }

                case "6": {
                    // Find and complete the selected task.
                    if (tasks.length === 0) {
                        console.log("No tasks yet. Add one first.");
                        break;
                    }

                    console.table(tasks);

                    const taskId = await askForId(
                        "Enter task ID to complete: "
                    );

                    if (taskId === null) {
                        break;
                    }

                    const selectedTask = tasks.find(
                        task => task.id === taskId
                    );

                    if (!selectedTask) {
                        console.log("Task not found.");
                        break;
                    }

                    if (selectedTask.status === "Completed") {
                        console.log("This task is already completed.");
                        break;
                    }

                    selectedTask.status = "Completed";
                    await saveData();

                    console.log(
                        `Task "${selectedTask.title}" marked as completed.`
                    );
                    break;
                }

                case "7": {
                    // Find and remove the selected task.
                    if (tasks.length === 0) {
                        console.log("No tasks to delete.");
                        break;
                    }

                    console.table(tasks);

                    const taskId = await askForId(
                        "Enter task ID to delete: "
                    );

                    if (taskId === null) {
                        break;
                    }

                    const taskIndex = tasks.findIndex(
                        task => task.id === taskId
                    );

                    if (taskIndex === -1) {
                        console.log("Task not found.");
                        break;
                    }

                    const deletedTask = tasks.splice(taskIndex, 1)[0];
                    await saveData();

                    console.log(`Task "${deletedTask.title}" deleted.`);
                    break;
                }

                case "8": {
                    // Display tasks matching the entered category.
                    if (tasks.length === 0) {
                        console.log("No tasks yet. Add one first.");
                        break;
                    }

                    const category = (
                        await rl.question("Enter category: ")
                    ).trim();

                    if (category === "") {
                        console.log("Category cannot be empty.");
                        break;
                    }

                    const categoryTasks = tasks.filter(
                        task =>
                            task.category.toLowerCase() ===
                            category.toLowerCase()
                    );

                    if (categoryTasks.length === 0) {
                        console.log(
                            `No tasks found in category "${category}".`
                        );
                    } else {
                        console.log(`\nTasks in category "${category}":`);
                        console.table(categoryTasks);
                    }
                    break;
                }

                case "9": {
                    // Select the task whose assignment will change.
                    if (tasks.length === 0) {
                        console.log("No tasks to reassign.");
                        break;
                    }

                    console.table(tasks);

                    const taskId = await askForId(
                        "Enter task ID to reassign: "
                    );

                    if (taskId === null) {
                        break;
                    }

                    const selectedTask = tasks.find(
                        task => task.id === taskId
                    );

                    if (!selectedTask) {
                        console.log("Task not found.");
                        break;
                    }

                    console.table(users);

                    const newUserId = await askForId(
                        "Enter new user ID: "
                    );

                    if (newUserId === null) {
                        break;
                    }

                    const newUser = users.find(
                        user => user.id === newUserId
                    );

                    if (!newUser) {
                        console.log("User not found.");
                        break;
                    }

                    if (selectedTask.assignedUserId === newUserId) {
                        console.log(
                            "This task is already assigned to that user."
                        );
                        break;
                    }

                    // Prevent a duplicate task for the destination user.
                    const duplicateTask = tasks.some(
                        task =>
                            task.id !== selectedTask.id &&
                            task.title.toLowerCase() ===
                                selectedTask.title.toLowerCase() &&
                            task.assignedUserId === newUserId
                    );

                    if (duplicateTask) {
                        console.log(
                            "This user already has a task with that title."
                        );
                        break;
                    }

                    selectedTask.assignedUserId = newUserId;
                    await saveData();

                    console.log(
                        `Task "${selectedTask.title}" reassigned to ${newUser.name}.`
                    );
                    break;
                }

                case "10": {
                    // Select the user to remove.
                    if (users.length === 0) {
                        console.log("No users to delete.");
                        break;
                    }

                    console.table(users);

                    const userId = await askForId(
                        "Enter user ID to delete: "
                    );

                    if (userId === null) {
                        break;
                    }

                    const userIndex = users.findIndex(
                        user => user.id === userId
                    );

                    if (userIndex === -1) {
                        console.log("User not found.");
                        break;
                    }

                    // Count all tasks affected by this deletion.
                    const selectedUser = users[userIndex];
                    const userTasks = tasks.filter(
                        task => task.assignedUserId === userId
                    );

                    const pendingCount = userTasks.filter(
                        task => task.status === "Pending"
                    ).length;

                    const completedCount = userTasks.filter(
                        task => task.status === "Completed"
                    ).length;

                    console.log(
                        `${selectedUser.name} has ${pendingCount} pending tasks ` +
                        `and ${completedCount} completed tasks.`
                    );

                    console.log(
                        `Deleting this user will also delete all ${userTasks.length} assigned tasks.`
                    );

                    const confirmation = (
                        await rl.question("Continue? (yes/no): ")
                    ).trim().toLowerCase();

                    if (confirmation !== "yes") {
                        console.log("Deletion cancelled.");
                        break;
                    }

                    // Remove assigned tasks before removing the user.
                    for (let i = tasks.length - 1; i >= 0; i--) {
                        if (tasks[i].assignedUserId === userId) {
                            tasks.splice(i, 1);
                        }
                    }

                    users.splice(userIndex, 1);
                    await saveData();

                    console.log(
                        `User "${selectedUser.name}" and their assigned tasks deleted.`
                    );
                    break;
                }

                case "11":
                    // Run the asynchronous multi-user demonstration.
                    await runConcurrencyDemo();
                    break;

                case "12":
                    // End the application.
                    running = false;
                    console.log("Goodbye!");
                    break;

                default:
                    console.log("Invalid option. Choose 1 through 12.");
            }
        }
    } finally {
        // Close terminal input after exit or an error.
        rl.close();
    }
}

// Report failures and stop without continuing with unsaved data.
main().catch(error => {
    console.error("Application stopped:", error.message);
    process.exitCode = 1;
});