import java.util.ArrayList;
import java.util.List;

public class TaskManager {

    private final List<User> users = new ArrayList<>();
    private final List<Task> tasks = new ArrayList<>();

    public synchronized void addUser(User user) {
        users.add(user);
        System.out.println("User added: " + user.getName());
    }

    public synchronized void addTask(Task task) {
        tasks.add(task);
        System.out.println("Task added successfully.");
    }

    public synchronized void viewAllTasks() {
        if (tasks.isEmpty()) {
            System.out.println("No tasks available.");
            return;
        }

        System.out.println("\n--- ALL TASKS ---");
        for (Task task : tasks) {
            System.out.println(task);
        }
    }

    public synchronized void viewTasksByUser(int userId) {
        System.out.println("\n--- TASKS FOR USER ---");
        boolean found = false;

        for (Task task : tasks) {
            if (task.getAssignedUser().getId() == userId) {
                System.out.println(task);
                found = true;
            }
        }

        if (!found) {
            System.out.println("No tasks found for this user.");
        }
    }

    public synchronized void viewTasksByCategory(String category) {
        System.out.println("\n--- TASKS IN CATEGORY: " + category + " ---");
        boolean found = false;

        for (Task task : tasks) {
            if (task.getCategory().equalsIgnoreCase(category)) {
                System.out.println(task);
                found = true;
            }
        }

        if (!found) {
            System.out.println("No tasks found in this category.");
        }
    }

    public synchronized void markTaskCompleted(int taskId) {
        for (Task task : tasks) {
            if (task.getId() == taskId) {
                task.markCompleted();
                System.out.println("Task " + taskId + " marked as completed.");
                return;
            }
        }

        System.out.println("Task not found.");
    }

    public synchronized void deleteTask(int taskId) {
        boolean removed = tasks.removeIf(task -> task.getId() == taskId);

        if (removed) {
            System.out.println("Task deleted successfully.");
        } else {
            System.out.println("Task not found.");
        }
    }

    public User findUser(int userId) {
        for (User user : users) {
            if (user.getId() == userId) {
                return user;
            }
        }

        return null;
    }

    public void simulateConcurrentUsers() {

        Thread user1 = new Thread(() -> {
            System.out.println("\nUser Thread 1 is viewing tasks...");
            viewAllTasks();
        });

        Thread user2 = new Thread(() -> {
            System.out.println("\nUser Thread 2 is updating Task 1...");
            markTaskCompleted(1);
        });

        user1.start();
        user2.start();

        try {
            user1.join();
            user2.join();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            System.out.println("Thread execution was interrupted.");
        }

        System.out.println("Concurrent user simulation completed.");
    }
}