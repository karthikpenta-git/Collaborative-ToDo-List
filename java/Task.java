/** Stores a categorized task and the ID of its assigned user. */
public class Task {
    private final int id;
    private final String title;
    private final String category;
    private int assignedUserId;
    private String status = "Pending";
    public Task(int id, String title, String category, int assignedUserId) {
        this.id = id; this.title = title; this.category = category;
        this.assignedUserId = assignedUserId;
    }
    public int getId() { return id; }
    public String getTitle() { return title; }
    public String getCategory() { return category; }
    public int getAssignedUserId() { return assignedUserId; }
    public String getStatus() { return status; }
    public void complete() { status = "Completed"; }
    public void assignTo(int userId) { assignedUserId = userId; }
}
