const fs = require("fs");
const path = require("path");

class TaskManager {
    constructor() {
        this.users = [];
        this.tasks = [];
        this.dataFile = path.join(__dirname, "tasks.json");
    }

    addUser(user) {
        this.users.push(user);
        console.log(`User added: ${user.name}`);
    }

    async addTask(task) {
        this.tasks.push(task);
        await this.saveToJSON();
        console.log("Task added successfully.");
    }

    viewAllTasks() {
        if (this.tasks.length === 0) {
            console.log("No tasks available.");
            return;
        }

        console.log("\n--- ALL TASKS ---");

        this.tasks.forEach(task => {
            console.log(task.toString());
        });
    }

    viewTasksByUser(userId) {
        console.log("\n--- TASKS FOR USER ---");

        const results = this.tasks.filter(
            task => task.assignedUser.id === userId
        );

        if (results.length === 0) {
            console.log("No tasks found for this user.");
            return;
        }

        results.forEach(task => console.log(task.toString()));
    }

    viewTasksByCategory(category) {
        console.log(`\n--- TASKS IN CATEGORY: ${category} ---`);

        const results = this.tasks.filter(
            task =>
                task.category.toLowerCase() ===
                category.toLowerCase()
        );

        if (results.length === 0) {
            console.log("No tasks found in this category.");
            return;
        }

        results.forEach(task => console.log(task.toString()));
    }

    async markTaskCompleted(taskId) {
        const task = this.tasks.find(
            task => task.id === taskId
        );

        if (!task) {
            console.log("Task not found.");
            return;
        }

        task.markCompleted();
        await this.saveToJSON();

        console.log(
            `Task ${taskId} marked as completed.`
        );
    }

    async deleteTask(taskId) {
        const index = this.tasks.findIndex(
            task => task.id === taskId
        );

        if (index === -1) {
            console.log("Task not found.");
            return;
        }

        this.tasks.splice(index, 1);
        await this.saveToJSON();

        console.log("Task deleted successfully.");
    }

    findUser(userId) {
        return this.users.find(
            user => user.id === userId
        );
    }

    async saveToJSON() {
        const data = {
            users: this.users,
            tasks: this.tasks
        };

        await fs.promises.writeFile(
            this.dataFile,
            JSON.stringify(data, null, 2)
        );
    }

    async simulateConcurrentUsers() {
        console.log(
            "\nSimulating asynchronous access..."
        );

        const user1 = new Promise(resolve => {
            setTimeout(() => {
                console.log(
                    "Async User 1 is viewing tasks..."
                );
                this.viewAllTasks();
                resolve();
            }, 300);
        });

        const user2 = new Promise(resolve => {
            setTimeout(async () => {
                console.log(
                    "\nAsync User 2 is updating Task 1..."
                );

                await this.markTaskCompleted(1);
                resolve();
            }, 300);
        });

        await Promise.all([user1, user2]);

        console.log(
            "Asynchronous user simulation completed."
        );
    }
}

module.exports = TaskManager;