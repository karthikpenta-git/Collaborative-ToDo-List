import java.nio.file.Files;
import java.nio.file.Path;

/** Runs meaningful checks without altering the application's saved data. */
public class ApplicationTest {
    private static int checks = 0;
    private static void check(boolean condition, String label) {
        if (!condition) throw new AssertionError(label);
        checks++;
    }
    private static void rejects(Runnable operation, String label) {
        try { operation.run(); } catch (IllegalArgumentException e) { checks++; return; }
        throw new AssertionError(label);
    }
    public static void main(String[] args) throws Exception {
        TaskManager m = new TaskManager();
        User aliza = m.addUser(" Aliza ");
        User karthik = m.addUser("Karthik");
        check(aliza.getId() == 1 && aliza.getName().equals("Aliza"), "Create and trim user");
        rejects(() -> m.addUser("aliza"), "Duplicate username");
        rejects(() -> m.addUser(" "), "Blank username");
        Task a = m.addTask("Report", "Project", 1);
        Task b = m.addTask("Report", "Project", 2);
        rejects(() -> m.addTask(" report ", "Other", 1), "Duplicate task");
        rejects(() -> m.addTask("Missing", "Project", 99), "Missing assigned user");
        rejects(() -> m.addTask(" ", "Project", 1), "Blank title");
        check(m.getTasksByUser(1).size() == 1, "User filter");
        check(m.getTasksByCategory(" project ").size() == 2, "Category filter");
        check(m.completeTask(a.getId()) && !m.completeTask(a.getId()), "Complete once");
        rejects(() -> m.reassignTask(a.getId(), 2), "Duplicate reassignment");
        m.deleteTask(b.getId());
        m.reassignTask(a.getId(), 2);
        check(m.getTask(1).getAssignedUserId() == 2, "Reassignment");
        Path dir = Files.createTempDirectory("todo-java-test-");
        Path file = dir.resolve("data.json");
        try {
            Storage store = new Storage(file);
            check(store.load().getUsers().isEmpty(), "Missing file starts empty");
            store.save(m);
            TaskManager restored = store.load();
            check(restored.getTask(1).getStatus().equals("Completed")
                && restored.getTask(1).getAssignedUserId() == 2, "Persistence");
            check(restored.addTask("New", "Project", 1).getId() == 3, "Counters after deletion");
            int before = restored.getTasks().size();
            ConcurrencyDemo.run(restored);
            check(restored.getTasks().size() == before, "Demo leaves main state unchanged");
            restored.deleteUser(karthik.getId());
            check(restored.getTasksByUser(aliza.getId()).size() == 1
                && restored.getTasks().size() == 1, "User cascade deletion");
            rejects(() -> restored.getUser(2), "Deleted user missing");
            Files.writeString(file, "{broken");
            boolean invalid = false;
            try { store.load(); } catch (RuntimeException e) { invalid = true; }
            check(invalid && Files.readString(file).equals("{broken"), "Corrupt JSON not overwritten");
            Files.writeString(file, "{\"users\":[],\"tasks\":[],\"nextUserId\":1.5,\"nextTaskId\":1}");
            invalid = false;
            try { store.load(); } catch (RuntimeException e) { invalid = true; }
            check(invalid, "Fractional saved ID rejected");
            System.out.println("PASS: " + checks + " checks.");
        } finally {
            Files.deleteIfExists(file); Files.deleteIfExists(dir);
        }
    }
}
