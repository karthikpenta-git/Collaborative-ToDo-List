const readline = require("readline");
const User = require("./user");
const Task = require("./task");
const TaskManager = require("./taskManager");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const manager = new TaskManager();

let nextUserId = 1;
let nextTaskId = 1;

function question(prompt) {
    return new Promise(resolve => {
        rl.question(prompt, answer => {
            resolve(answer);
        });
    });
}

function showMenu() {
    console.log("\n1. Add User");
    console.log("2. Add Task");
    console.log("3. View All Tasks");
    console.log("4. View Tasks by User");
    console.log("5. View Tasks by Category");
    console.log("6. Mark Task Complete");
    console.log("7. Delete Task");
    console.log("8. Simulate Multiple Users");
    console.log("9. Exit");
}

async function main() {

    console.log("==================================");
    console.log("     COLLABORATIVE TO-DO LIST");
    console.log("       JAVASCRIPT VERSION");
    console.log("==================================");

    let running = true;

    while (running) {

        showMenu();

        const choice = await question(
            "\nChoose an option: "
        );

        try {

            switch (choice.trim()) {

                case "1": {
                    const name = await question(
                        "Enter user name: "
                    );

                    manager.addUser(
                        new User(nextUserId++, name)
                    );

                    break;
                }

                case "2": {
                    const title = await question(
                        "Enter task title: "
                    );

                    const category = await question(
                        "Enter category: "
                    );

                    const userId = Number(
                        await question("Enter user ID: ")
                    );

                    const assignedUser =
                        manager.findUser(userId);

                    if (!assignedUser) {
                        console.log("User not found.");
                        break;
                    }

                    await manager.addTask(
                        new Task(
                            nextTaskId++,
                            title,
                            category,
                            assignedUser
                        )
                    );

                    break;
                }

                case "3":
                    manager.viewAllTasks();
                    break;

                case "4": {
                    const userId = Number(
                        await question("Enter user ID: ")
                    );

                    manager.viewTasksByUser(userId);
                    break;
                }

                case "5": {
                    const category = await question(
                        "Enter category: "
                    );

                    manager.viewTasksByCategory(category);
                    break;
                }

                case "6": {
                    const taskId = Number(
                        await question("Enter task ID: ")
                    );

                    await manager.markTaskCompleted(
                        taskId
                    );

                    break;
                }

                case "7": {
                    const taskId = Number(
                        await question("Enter task ID: ")
                    );

                    await manager.deleteTask(taskId);
                    break;
                }

                case "8":
                    await manager.simulateConcurrentUsers();
                    break;

                case "9":
                    running = false;
                    console.log("Application closed.");
                    break;

                default:
                    console.log(
                        "Please enter a valid option."
                    );
            }

        } catch (error) {

            console.log(
                "Error: " + error.message
            );
        }
    }

    rl.close();
}

main();