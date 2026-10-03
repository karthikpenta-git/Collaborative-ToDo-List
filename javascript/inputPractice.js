// Load the tools for receiving terminal input.
const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");

// Connect the input interface to the terminal.
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

// Store users created during this session.
const users = [];
let nextUserId = 1;

async function main() {
    try {
        let running = true;

        // Display the menu until the user exits.
        while (running) {
            console.log("\nCollaborative To-Do List");
            console.log("1. Create user");
            console.log("2. View users");
            console.log("3. Exit");

            // Receive the user's menu selection.
            const choice = await rl.question("Select an option: ");

            switch (choice.trim()) {
                case "1": {
                    // Receive the new user's name.
                    const name = (
                        await rl.question("Enter user name: ")
                    ).trim();

                    // Reject an empty name.
                    if (name === "") {
                        console.log("Name cannot be empty.");
                        break;
                    }

                    // Create the user and add them to the list.
                    const user = new User(nextUserId, name);
                    users.push(user);

                    // Prepare a unique ID for the next user.
                    nextUserId++;

                    console.log(
                        `User created: ${user.name} (ID ${user.id})`
                    );
                    break;
                }

                case "2": {
                    // Display the users or explain that the list is empty.
                    if (users.length === 0) {
                        console.log("No users yet. Create one first.");
                    } else {
                        console.table(users);
                    }
                    break;
                }

                case "3":
                    // Stop the menu loop.
                    running = false;
                    console.log("Goodbye!");
                    break;

                default:
                    // Report an invalid menu selection.
                    console.log("Invalid option. Choose 1, 2, or 3.");
            }
        }
    } finally {
        // Close the terminal input interface.
        rl.close();
    }
}

// Start the application and report unhandled errors.
main().catch(console.error);