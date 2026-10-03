const User = require("./user");
const Task = require("./task");

// Validate and clean a required text value.
function cleanText(value, label) {
    if (typeof value !== "string" || value.trim() === "") {
        throw new Error(`${label} cannot be empty.`);
    }

    return value.trim();
}

// Validate user and task IDs.
function checkId(id) {
    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error("Enter a valid positive integer ID.");
    }
}

// Manage users, tasks, assignments, and duplicate rules.
class TaskManager {
    constructor() {
        this.users = [];
        this.tasks = [];
        this.nextUserId = 1;
        this.nextTaskId = 1;
    }

    // Return the data needed for saving or copying the application state.
    getData() {
        return {
            users: this.users,
            tasks: this.tasks,
            nextUserId: this.nextUserId,
            nextTaskId: this.nextTaskId
        };
    }

    // Validate saved data before restoring it.
    loadData(data) {
        if (
            !data ||
            !Array.isArray(data.users) ||
            !Array.isArray(data.tasks)
        ) {
            throw new Error("Saved data must contain users and tasks arrays.");
        }

        const restoredUsers = [];
        const restoredTasks = [];
        const userIds = new Set();
        const userNames = new Set();
        const taskIds = new Set();
        const assignments = new Set();

        for (const user of data.users) {
            if (!user) {
                throw new Error("Saved data contains an invalid user.");
            }

            checkId(user.id);
            const name = cleanText(user.name, "Username");
            const key = name.toLowerCase();

            if (userIds.has(user.id) || userNames.has(key)) {
                throw new Error("Saved data contains duplicate users.");
            }

            userIds.add(user.id);
            userNames.add(key);
            restoredUsers.push(new User(user.id, name));
        }

        for (const savedTask of data.tasks) {
            if (!savedTask) {
                throw new Error("Saved data contains an invalid task.");
            }

            checkId(savedTask.id);

            const title = cleanText(savedTask.title, "Title");
            const category = cleanText(savedTask.category, "Category");

            if (!userIds.has(savedTask.assignedUserId)) {
                throw new Error("A saved task refers to a missing user.");
            }

            if (!["Pending", "Completed"].includes(savedTask.status)) {
                throw new Error("A saved task has an invalid status.");
            }

            const key = JSON.stringify([
                savedTask.assignedUserId,
                title.toLowerCase()
            ]);

            if (taskIds.has(savedTask.id) || assignments.has(key)) {
                throw new Error("Saved data contains duplicate tasks.");
            }

            taskIds.add(savedTask.id);
            assignments.add(key);

            const task = new Task(
                savedTask.id,
                title,
                category,
                savedTask.assignedUserId
            );

            task.status = savedTask.status;
            restoredTasks.push(task);
        }

        checkId(data.nextUserId);
        checkId(data.nextTaskId);

        if (
            restoredUsers.some(user => user.id >= data.nextUserId) ||
            restoredTasks.some(task => task.id >= data.nextTaskId)
        ) {
            throw new Error("Saved ID counters conflict with existing records.");
        }

        // Restore state only after every record passes validation.
        this.users = restoredUsers;
        this.tasks = restoredTasks;
        this.nextUserId = data.nextUserId;
        this.nextTaskId = data.nextTaskId;
    }

    // Find an existing user.
    getUser(id) {
        checkId(id);
        const user = this.users.find(user => user.id === id);

        if (!user) {
            throw new Error("User not found.");
        }

        return user;
    }

    // Find an existing task.
    getTask(id) {
        checkId(id);
        const task = this.tasks.find(task => task.id === id);

        if (!task) {
            throw new Error("Task not found.");
        }

        return task;
    }

    // Create a user with a unique name and ID.
    addUser(name) {
        name = cleanText(name, "Username");

        if (
            this.users.some(
                user => user.name.toLowerCase() === name.toLowerCase()
            )
        ) {
            throw new Error("Username already exists.");
        }

        // Reserve space for a valid next ID.
        if (this.nextUserId >= Number.MAX_SAFE_INTEGER) {
            throw new Error("No more user IDs are available.");
        }

        const user = new User(this.nextUserId, name);
        this.users.push(user);
        this.nextUserId++;

        return user;
    }

    // Check whether another task has this title and assignment.
    hasDuplicateTask(title, userId, excludedTaskId = null) {
        return this.tasks.some(
            task =>
                task.id !== excludedTaskId &&
                task.title.toLowerCase() === title.toLowerCase() &&
                task.assignedUserId === userId
        );
    }

    // Create a task assigned to an existing user.
    addTask(title, category, assignedUserId) {
        title = cleanText(title, "Title");
        category = cleanText(category, "Category");
        this.getUser(assignedUserId);

        if (this.hasDuplicateTask(title, assignedUserId)) {
            throw new Error("This user already has a task with that title.");
        }

        if (this.nextTaskId >= Number.MAX_SAFE_INTEGER) {
            throw new Error("No more task IDs are available.");
        }

        const task = new Task(
            this.nextTaskId,
            title,
            category,
            assignedUserId
        );

        this.tasks.push(task);
        this.nextTaskId++;

        return task;
    }

    // Select tasks assigned to one user.
    getTasksByUser(userId) {
        this.getUser(userId);

        return this.tasks.filter(
            task => task.assignedUserId === userId
        );
    }

    // Select tasks in a category, ignoring capitalization.
    getTasksByCategory(category) {
        category = cleanText(category, "Category");

        return this.tasks.filter(
            task => task.category.toLowerCase() === category.toLowerCase()
        );
    }

    // Complete a task and report whether anything changed.
    completeTask(taskId) {
        const task = this.getTask(taskId);

        if (task.status === "Completed") {
            return false;
        }

        task.status = "Completed";
        return true;
    }

    // Remove a task without changing other task IDs.
    deleteTask(taskId) {
        this.getTask(taskId);

        const index = this.tasks.findIndex(task => task.id === taskId);
        return this.tasks.splice(index, 1)[0];
    }

    // Move a task to another user while enforcing duplicate rules.
    reassignTask(taskId, newUserId) {
        const task = this.getTask(taskId);
        this.getUser(newUserId);

        if (task.assignedUserId === newUserId) {
            throw new Error("This task is already assigned to that user.");
        }

        if (this.hasDuplicateTask(task.title, newUserId, task.id)) {
            throw new Error("This user already has a task with that title.");
        }

        task.assignedUserId = newUserId;
        return task;
    }

    // Remove a user and all their tasks after the menu confirms deletion.
    deleteUser(userId) {
        const user = this.getUser(userId);

        this.tasks = this.tasks.filter(
            task => task.assignedUserId !== userId
        );

        const index = this.users.findIndex(user => user.id === userId);
        this.users.splice(index, 1);

        return user;
    }
}

module.exports = TaskManager;