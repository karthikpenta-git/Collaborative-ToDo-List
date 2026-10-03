import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonParser;
import com.google.gson.Strictness;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;

/** Loads and saves a complete JSON snapshot of the application. */
public class Storage {
    private static final Gson JSON = new GsonBuilder().setPrettyPrinting()
        .setStrictness(Strictness.STRICT).create();
    private final Path file;
    public Storage(Path file) { this.file = file.toAbsolutePath(); }
    public TaskManager load() throws IOException {
        if (!Files.exists(file)) return new TaskManager();
        String text = Files.readString(file, StandardCharsets.UTF_8);
        // Check the root and required fields before deserializing Java objects.
        var root = JsonParser.parseString(text);
        if (!root.isJsonObject()) throw new IllegalArgumentException("Invalid saved data.");
        var obj = root.getAsJsonObject();
        for (String key : new String[]{"users", "tasks", "nextUserId", "nextTaskId"})
            if (!obj.has(key)) throw new IllegalArgumentException("Missing saved field: " + key);
        checkNumber(obj, "nextUserId"); checkNumber(obj, "nextTaskId");
        if (!obj.get("users").isJsonArray() || !obj.get("tasks").isJsonArray())
            throw new IllegalArgumentException("Saved data must contain users and tasks arrays.");
        for (var entry : obj.getAsJsonArray("users")) {
            var user = entry.getAsJsonObject();
            checkNumber(user, "id"); checkString(user, "name");
        }
        for (var entry : obj.getAsJsonArray("tasks")) {
            var task = entry.getAsJsonObject();
            checkNumber(task, "id"); checkNumber(task, "assignedUserId");
            checkString(task, "title"); checkString(task, "category"); checkString(task, "status");
        }
        TaskManager manager = JSON.fromJson(text, TaskManager.class);
        manager.validate();
        return manager;
    }
    private static void checkNumber(com.google.gson.JsonObject obj, String key) {
        var value = obj.get(key);
        if (value == null || !value.isJsonPrimitive() || !value.getAsJsonPrimitive().isNumber())
            throw new IllegalArgumentException("Invalid saved ID: " + key);
        try {
            if (value.getAsBigDecimal().intValueExact() <= 0) throw new ArithmeticException();
        } catch (ArithmeticException e) {
            throw new IllegalArgumentException("Invalid saved ID: " + key);
        }
    }
    private static void checkString(com.google.gson.JsonObject obj, String key) {
        var value = obj.get(key);
        if (value == null || !value.isJsonPrimitive() || !value.getAsJsonPrimitive().isString())
            throw new IllegalArgumentException("Invalid saved text: " + key);
    }
    public void save(TaskManager manager) throws IOException {
        Files.createDirectories(file.getParent());
        Path temp = file.resolveSibling(file.getFileName() + ".tmp");
        Files.writeString(temp, JSON.toJson(manager), StandardCharsets.UTF_8);
        try {
            Files.move(temp, file, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        } catch (AtomicMoveNotSupportedException e) {
            Files.move(temp, file, StandardCopyOption.REPLACE_EXISTING);
        }
    }
    // Makes an independent copy for the demo, including saved counters and statuses.
    public static TaskManager copy(TaskManager manager) {
        TaskManager result = JSON.fromJson(JSON.toJson(manager), TaskManager.class);
        result.validate();
        return result;
    }
}
