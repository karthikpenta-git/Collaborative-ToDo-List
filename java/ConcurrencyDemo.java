import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.*;

/** Runs two real Java worker threads against an isolated copy of the data. */
public class ConcurrencyDemo {
    public static void run(TaskManager manager) throws InterruptedException, ExecutionException {
        if (manager.getUsers().size() < 2) {
            ConsoleView.message("Create at least two users to run this demo.", "warning"); return;
        }
        TaskManager demo = Storage.copy(manager);
        List<User> users = demo.getUsers();
        List<Task> created = Collections.synchronizedList(new ArrayList<>());
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch started = new CountDownLatch(2);
        ConsoleView.message("Starting the concurrency demonstration.", "info");
        ConsoleView.info("\nStarting two overlapping user operations...");
        try {
            Future<?> first = pool.submit(() -> add(demo, users.get(0), "Review application", 1000, created, started));
            Future<?> second = pool.submit(() -> add(demo, users.get(1), "Test application", 500, created, started));
            first.get(); second.get();
            ConsoleView.info("\nBoth operations finished:");
            ConsoleView.tasks(created);
            ConsoleView.info("Demo tasks were not saved.");
            ConsoleView.message("Concurrency demonstration finished. Your saved tasks were not changed.", "success");
        } finally {
            pool.shutdownNow();
        }
    }
    private static void add(TaskManager demo, User user, String base, long delay,
                            List<Task> created, CountDownLatch started) {
        String title = base;
        int suffix = 2;
        while (demo.hasDuplicateTask(title, user.getId(), -1)) title = base + " " + suffix++;
        ConsoleView.info(user.getName() + " started adding \"" + title + "\".");
        started.countDown();
        try {
            // Wait until both workers have started, then simulate their different delays.
            started.await();
            Thread.sleep(delay);
            Task task = demo.addTask(title, "Concurrency Demo", user.getId());
            created.add(task);
            ConsoleView.info(user.getName() + " finished adding \"" + title + "\".");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Concurrency demo interrupted.", e);
        }
    }
}
