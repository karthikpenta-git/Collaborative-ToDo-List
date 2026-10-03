// Defines the information stored for each user.
class User {
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}

// Defines the information stored for each task.
class Task {
    constructor(id, title, category, assignedUserId) {
        this.id = id;
        this.title = title;
        this.category = category;
        this.assignedUserId = assignedUserId;

        // Every new task starts as Pending.
        this.status = "Pending";
    }
}

// Returns a new array of tasks assigned to a specific user.
function getTasksByUser(userId) {
    return tasks.filter(
        task => task.assignedUserId === userId
    );
}

console.log("Welcome to the Collaborative To-Do List!");

// Create Aliza and a task assigned to her.
const user1 = new User(1, "Aliza");

const task1 = new Task(
    1,
    "Finish project report",
    "School",
    user1.id
);

// Store users and tasks in separate arrays.
const users = [user1];
const tasks = [task1];

// Add Karthik to the user list.
const user2 = new User(2, "Karthik");
users.push(user2);

// Add a task assigned to Karthik.
const task2 = new Task(
    2,
    "Test Java application",
    "Development",
    user2.id
);

tasks.push(task2);

// Display all users and tasks.
console.log("\nUsers:");
console.table(users);

console.log("\nAll tasks:");
console.table(tasks);

// Use the same function to view either user's tasks.
console.log("\nTasks assigned to Aliza:");
console.table(getTasksByUser(user1.id));

console.log("\nTasks assigned to Karthik:");
console.table(getTasksByUser(user2.id));

// Find task 1 and mark it as completed.
// find() returns the actual object stored in the array.
const selectedTask = tasks.find(task => task.id === 1);

if (selectedTask) {
    selectedTask.status = "Completed";
    console.log("\nTask marked as completed!");
} else {
    console.log("\nTask not found.");
}

console.table(tasks);

// Find the array position of task 2.
// findIndex() returns -1 if no task matches.
const taskIndex = tasks.findIndex(task => task.id === 2);

if (taskIndex !== -1) {
    // Remove one item at the matching position.
    tasks.splice(taskIndex, 1);
    console.log("\nTask deleted!");
} else {
    console.log("\nTask not found.");
}

console.table(tasks);