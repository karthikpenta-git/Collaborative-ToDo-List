const TaskManager = require("./taskManager");

// Simulate overlapping user operations using the real task manager.
async function runConcurrencyDemo(manager) {
    if (manager.users.length < 2) {
        console.log("Create at least two users to run this demo.");
        return;
    }

    // Copy application data so the demo does not change saved records.
    const demoManager = new TaskManager();
    const copiedData = JSON.parse(JSON.stringify(manager.getData()));
    demoManager.loadData(copiedData);

    const firstUser = demoManager.users[0];
    const secondUser = demoManager.users[1];
    const demoTasks = [];

    // Choose demo titles that do not conflict with existing tasks.
    function uniqueTitle(base, userId) {
        let title = base;
        let suffix = 2;

        while (demoManager.hasDuplicateTask(title, userId)) {
            title = `${base} ${suffix}`;
            suffix++;
        }

        return title;
    }

    const firstTitle = uniqueTitle("Review application", firstUser.id);
    const secondTitle = uniqueTitle("Test application", secondUser.id);

    async function addDemoTask(user, title, delay) {
        console.log(`${user.name} started adding "${title}".`);

        // Simulate waiting for a network or other asynchronous operation.
        await new Promise(resolve => setTimeout(resolve, delay));

        // Use the same validation and task creation as the normal app.
        const task = demoManager.addTask(
            title,
            "Concurrency Demo",
            user.id
        );

        demoTasks.push(task);
        console.log(`${user.name} finished adding "${title}".`);
    }

    console.log("\nStarting two overlapping user operations...");

    await Promise.all([
        addDemoTask(firstUser, firstTitle, 1000),
        addDemoTask(secondUser, secondTitle, 500)
    ]);

    console.log("\nBoth operations finished:");
    console.table(demoTasks);
    console.log("Demo tasks were not saved.");
}

module.exports = runConcurrencyDemo;