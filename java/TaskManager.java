import java.util.ArrayList;
import java.util.List;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

/** Applies validation and manages users, tasks, and permanent ID counters. */
public class TaskManager {
    private List<User> users = new ArrayList<>();
    private List<Task> tasks = new ArrayList<>();
    private int nextUserId = 1;
    private int nextTaskId = 1;

    // Synchronization keeps task creation and ID assignment together during the thread demo.
    public synchronized User addUser(String name) {
        name = text(name, "Username");
        final String candidate = name;
        if (users.stream().anyMatch(u -> u.getName().equalsIgnoreCase(candidate)))
            throw new IllegalArgumentException("Username already exists.");
        User user = new User(nextUserId, name);
        nextUserId = Math.incrementExact(nextUserId);
        users.add(user);
        return user;
    }
    public synchronized Task addTask(String title, String category, int userId) {
        title = text(title, "Title");
        category = text(category, "Category");
        getUser(userId);
        if (hasDuplicateTask(title, userId, -1))
            throw new IllegalArgumentException("This user already has a task with that title.");
        Task task = new Task(nextTaskId, title, category, userId);
        nextTaskId = Math.incrementExact(nextTaskId);
        tasks.add(task);
        return task;
    }
    public synchronized boolean hasDuplicateTask(String title, int userId, int excludedId) {
        return tasks.stream().anyMatch(t -> t.getId() != excludedId
            && t.getTitle().equalsIgnoreCase(title.trim()) && t.getAssignedUserId() == userId);
    }
    public synchronized User getUser(int id) {
        return users.stream().filter(u -> u.getId() == id).findFirst()
            .orElseThrow(() -> new IllegalArgumentException("User not found."));
    }
    public synchronized Task getTask(int id) {
        return tasks.stream().filter(t -> t.getId() == id).findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Task not found."));
    }
    public synchronized List<User> getUsers() { return new ArrayList<>(users); }
    public synchronized List<Task> getTasks() { return new ArrayList<>(tasks); }
    public synchronized List<Task> getTasksByUser(int id) {
        getUser(id);
        return tasks.stream().filter(t -> t.getAssignedUserId() == id).collect(Collectors.toList());
    }
    public synchronized List<Task> getTasksByCategory(String category) {
        final String key = text(category, "Category");
        return tasks.stream().filter(t -> t.getCategory().equalsIgnoreCase(key))
            .collect(Collectors.toList());
    }
    public synchronized boolean completeTask(int id) {
        Task task = getTask(id);
        if (task.getStatus().equals("Completed")) return false;
        task.complete();
        return true;
    }
    public synchronized Task deleteTask(int id) {
        Task task = getTask(id);
        tasks.remove(task);
        return task;
    }
    public synchronized Task reassignTask(int id, int newUserId) {
        Task task = getTask(id);
        getUser(newUserId);
        if (task.getAssignedUserId() == newUserId)
            throw new IllegalArgumentException("This task is already assigned to that user.");
        if (hasDuplicateTask(task.getTitle(), newUserId, task.getId()))
            throw new IllegalArgumentException("This user already has a task with that title.");
        task.assignTo(newUserId);
        return task;
    }
    // Removes the user and all assigned tasks after the UI obtains confirmation.
    public synchronized void deleteUser(int id) {
        User user = getUser(id);
        tasks.removeIf(t -> t.getAssignedUserId() == id);
        users.remove(user);
    }
    public static String text(String value, String field) {
        if (value == null || value.trim().isEmpty())
            throw new IllegalArgumentException(field + " cannot be empty.");
        return value.trim();
    }
    // Validates restored data before replacing the application's current state.
    public synchronized void validate() {
        if (users == null || tasks == null) throw new IllegalArgumentException("Invalid saved lists.");
        Set<Integer> userIds = new HashSet<>();
        Set<Integer> taskIds = new HashSet<>();
        List<String> names = new ArrayList<>();
        int maxUser = 0, maxTask = 0;
        for (User u : users) {
            if (u == null || u.getId() <= 0 || !userIds.add(u.getId()))
                throw new IllegalArgumentException("Invalid or duplicate saved user ID.");
            String name = text(u.getName(), "Saved user name");
            if (!name.equals(u.getName()) || names.stream().anyMatch(n -> n.equalsIgnoreCase(name)))
                throw new IllegalArgumentException("Invalid or duplicate saved username.");
            names.add(name); maxUser = Math.max(maxUser, u.getId());
        }
        for (Task t : tasks) {
            if (t == null || t.getId() <= 0 || !taskIds.add(t.getId())
                || !userIds.contains(t.getAssignedUserId()))
                throw new IllegalArgumentException("Invalid saved task or assignment.");
            if (!text(t.getTitle(), "Saved title").equals(t.getTitle())
                || !text(t.getCategory(), "Saved category").equals(t.getCategory())
                || !("Pending".equals(t.getStatus()) || "Completed".equals(t.getStatus())))
                throw new IllegalArgumentException("Invalid saved task fields.");
            if (hasDuplicateTask(t.getTitle(), t.getAssignedUserId(), t.getId()))
                throw new IllegalArgumentException("Duplicate saved task.");
            maxTask = Math.max(maxTask, t.getId());
        }
        if (nextUserId <= maxUser || nextTaskId <= maxTask)
            throw new IllegalArgumentException("Invalid saved ID counters.");
    }
}
