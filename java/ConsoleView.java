import java.util.ArrayList;
import java.util.List;

/** Displays grouped options, highlighted messages, and aligned record tables. */
public class ConsoleView {
    private static final boolean COLOR = System.getenv("NO_COLOR") == null;
    public static void message(String text, String kind) {
        String color = kind.equals("error") ? "31" : kind.equals("warning") ? "33"
            : kind.equals("success") ? "32" : "36";
        System.out.println();
        colored("--------------------------------------------------\n  " + safe(text)
            + "\n--------------------------------------------------", color);
    }
    public static void info(String text) { colored(safe(text), "36"); }
    private static void colored(String text, String color) {
        System.out.println(COLOR ? "\u001B[" + color + "m" + text + "\u001B[0m" : text);
    }
    // Keeps names and titles from injecting terminal controls into output.
    private static String safe(String text) {
        return text.replaceAll("[\\p{Cntrl}&&[^\\n\\t]]", "?").replace("\t", " ");
    }
    public static void menu() {
        info("\n==================================================\n             COLLABORATIVE TO-DO LIST\n==================================================");
        System.out.println("\n  CREATE\n    1. Create user\n    2. Add task"
            + "\n\n  VIEW\n    3. View users\n    4. View all tasks"
            + "\n    5. View tasks by user\n    6. View tasks by category"
            + "\n\n  UPDATE & DELETE\n    7. Mark task as completed"
            + "\n    8. Delete task\n    9. Reassign task\n   10. Delete user"
            + "\n\n  DEMO & EXIT\n   11. Run concurrency demo\n   12. Exit");
        info("\n==================================================");
    }
    public static void users(List<User> users) {
        List<String[]> rows = new ArrayList<>();
        for (int i = 0; i < users.size(); i++) {
            User u = users.get(i);
            rows.add(new String[]{"" + i, "" + u.getId(), u.getName()});
        }
        table(new String[]{"(index)", "id", "name"}, rows);
    }
    public static void tasks(List<Task> tasks) {
        List<String[]> rows = new ArrayList<>();
        for (int i = 0; i < tasks.size(); i++) {
            Task t = tasks.get(i);
            rows.add(new String[]{"" + i, "" + t.getId(), t.getTitle(), t.getCategory(),
                "" + t.getAssignedUserId(), t.getStatus()});
        }
        table(new String[]{"(index)", "id", "title", "category", "assignedUserId", "status"}, rows);
    }
    private static void table(String[] headers, List<String[]> rows) {
        int[] widths = new int[headers.length];
        for (int i = 0; i < widths.length; i++) widths[i] = headers[i].length();
        for (String[] row : rows)
            for (int i = 0; i < widths.length; i++) {
                row[i] = safe(row[i]).replace("\n", " ").replace("\r", " ");
                widths[i] = Math.max(widths[i], row[i].length());
            }
        line(widths, "┌", "┬", "┐"); row(headers, widths);
        line(widths, "├", "┼", "┤");
        for (String[] cells : rows) row(cells, widths);
        line(widths, "└", "┴", "┘");
    }
    private static void line(int[] widths, String left, String mid, String right) {
        StringBuilder b = new StringBuilder(left);
        for (int i = 0; i < widths.length; i++)
            b.append("─".repeat(widths[i] + 2)).append(i == widths.length - 1 ? right : mid);
        info(b.toString());
    }
    private static void row(String[] cells, int[] widths) {
        StringBuilder b = new StringBuilder("│");
        for (int i = 0; i < cells.length; i++)
            b.append(" ").append(cells[i]).append(" ".repeat(widths[i] - cells[i].length() + 1)).append("│");
        info(b.toString());
    }
}
