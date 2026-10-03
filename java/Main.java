import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.Scanner;

/** Reads terminal input and coordinates task operations and persistence. */
public class Main {
    private final Scanner input = new Scanner(System.in);
    private final Storage storage;
    private TaskManager manager;
    public Main(Path file) { storage = new Storage(file); }
    public static void main(String[] args) {
        // Compiled classes live in java/out; data stays beside the source files.
        try {
            Path classes = Path.of(Main.class.getProtectionDomain().getCodeSource().getLocation().toURI());
            Path file = args.length == 0 ? classes.getParent().resolve("data.json") : Path.of(args[0]);
            new Main(file).run();
        } catch (Exception e) {
            ConsoleView.message("Application could not start: " + e.getMessage(), "error");
            System.exit(1);
        }
    }
    private String ask(String prompt) {
        System.out.print(prompt);
        if (!input.hasNextLine()) throw new java.util.NoSuchElementException();
        return input.nextLine().trim();
    }
    private int id(String prompt) {
        try {
            int id = Integer.parseInt(ask(prompt));
            if (id <= 0) throw new NumberFormatException();
            return id;
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Enter a valid positive whole-number ID.");
        }
    }
    private boolean needUsers() {
        if (!manager.getUsers().isEmpty()) return true;
        ConsoleView.message("No users yet. Create a user first.", "warning"); return false;
    }
    private boolean needTasks() {
        if (!manager.getTasks().isEmpty()) return true;
        ConsoleView.message("No tasks yet.", "warning"); return false;
    }
    // Saving failures stop the session to prevent further unsaved changes.
    private void save() throws IOException { storage.save(manager); }
    public void run() throws Exception {
        manager = storage.load();
        try {
            boolean running = true;
            while (running) {
                ConsoleView.menu();
                String choice = ask("Select an option: ");
                try {
                    switch (choice) {
                        case "1": {
                            User user = manager.addUser(ask("Enter user name: "));
                            save();
                            ConsoleView.message("User created: " + user.getName() + " (ID " + user.getId() + ")", "success");
                            break;
                        }
                        case "2": {
                            if (!needUsers()) break;
                            String title = ask("Enter task title: ");
                            String category = ask("Enter category: ");
                            ConsoleView.info("Available users:"); ConsoleView.users(manager.getUsers());
                            int userId = id("Assign to user ID: ");
                            Task task = manager.addTask(title, category, userId);
                            save();
                            ConsoleView.message("Task " + task.getId() + " created and assigned to "
                                + manager.getUser(userId).getName() + ".", "success"); break;
                        }
                        case "3":
                            if (!manager.getUsers().isEmpty()) { ConsoleView.info("Users:"); ConsoleView.users(manager.getUsers()); } else ConsoleView.message("No users yet.", "info");
                            break;
                        case "4":
                            if (needTasks()) { ConsoleView.info("All tasks:"); ConsoleView.tasks(manager.getTasks()); }
                            break;
                        case "5": {
                            if (!needUsers()) break;
                            ConsoleView.info("Available users:"); ConsoleView.users(manager.getUsers());
                            User user = manager.getUser(id("Enter user ID: "));
                            List<Task> tasks = manager.getTasksByUser(user.getId());
                            if (tasks.isEmpty()) ConsoleView.message("This user has no tasks.", "warning");
                            else { ConsoleView.info("Tasks assigned to " + user.getName() + ":"); ConsoleView.tasks(tasks); }
                            break;
                        }
                        case "6": {
                            if (!needTasks()) break;
                            String category = TaskManager.text(ask("Enter category: "), "Category");
                            List<Task> tasks = manager.getTasksByCategory(category);
                            if (tasks.isEmpty()) ConsoleView.message("No tasks found in this category.", "warning");
                            else { ConsoleView.info("Tasks in category \"" + category + "\":"); ConsoleView.tasks(tasks); }
                            break;
                        }
                        case "7": {
                            if (!needTasks()) break;
                            ConsoleView.info("Available tasks:"); ConsoleView.tasks(manager.getTasks());
                            int taskId = id("Enter task ID to complete: ");
                            if (manager.completeTask(taskId)) {
                                save(); ConsoleView.message("Task completed: " + manager.getTask(taskId).getTitle(), "success");
                            } else ConsoleView.message("This task is already completed.", "warning");
                            break;
                        }
                        case "8": {
                            if (!needTasks()) break;
                            ConsoleView.info("Available tasks:"); ConsoleView.tasks(manager.getTasks());
                            Task task = manager.deleteTask(id("Enter task ID to delete: "));
                            save(); ConsoleView.message("Task deleted: " + task.getTitle(), "success"); break;
                        }
                        case "9": {
                            if (!needTasks()) break;
                            ConsoleView.info("Available tasks:"); ConsoleView.tasks(manager.getTasks());
                            int taskId = id("Enter task ID to reassign: "); manager.getTask(taskId);
                            ConsoleView.info("Available users:"); ConsoleView.users(manager.getUsers());
                            int userId = id("Enter new user ID: ");
                            Task task = manager.reassignTask(taskId, userId);
                            save(); ConsoleView.message("\"" + task.getTitle() + "\" reassigned to "
                                + manager.getUser(userId).getName() + ".", "success"); break;
                        }
                        case "10": {
                            if (!needUsers()) break;
                            ConsoleView.info("Available users:"); ConsoleView.users(manager.getUsers());
                            User user = manager.getUser(id("Enter user ID to delete: "));
                            List<Task> assigned = manager.getTasksByUser(user.getId());
                            long pending = assigned.stream().filter(t -> t.getStatus().equals("Pending")).count();
                            ConsoleView.message(user.getName() + " has " + pending + " pending task(s) and "
                                + (assigned.size() - pending) + " completed task(s).", "warning");
                            ConsoleView.message("Deleting this user will also delete all " + assigned.size() + " assigned task(s).", "warning");
                            if (!ask("Type yes to confirm deletion: ").equalsIgnoreCase("yes")) {
                                ConsoleView.message("User deletion cancelled.", "info"); break;
                            }
                            manager.deleteUser(user.getId()); save();
                            ConsoleView.message("User and assigned tasks deleted: " + user.getName(), "success"); break;
                        }
                        case "11": ConcurrencyDemo.run(manager); break;
                        case "12": ConsoleView.message("Goodbye!", "info"); running = false; break;
                        default: ConsoleView.message("Invalid option. Choose 1 through 12.", "error");
                    }
                } catch (IllegalArgumentException | ArithmeticException e) {
                    ConsoleView.message(e.getMessage(), "error");
                } catch (IOException e) {
                    ConsoleView.message("Could not save data. Application stopped: " + e.getMessage(), "error");
                    throw e;
                }
            }
        } catch (java.util.NoSuchElementException e) {
            ConsoleView.message("Input closed. Goodbye!", "info");
        } finally { input.close(); }
    }
}
