// Import Node.js tools for asking questions in the terminal.
const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");

// Connect the question interface to terminal input and output.
const rl = readline.createInterface({
    input: stdin,
    output: stdout
});

async function main() {
    try {
        // Wait for the user to type a name and press Enter.
        const name = await rl.question("Enter your name: ");

        console.log(`Welcome, ${name}!`);
    } finally {
        // Close the interface so the program can finish.
        rl.close();
    }
}

main().catch(console.error);