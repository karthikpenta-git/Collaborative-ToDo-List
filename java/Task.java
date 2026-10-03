public class Task {
    private int id;
    private String title;
    private String category;
    private User assignedUser;
    private TaskStatus status;

    public Task(int id, String title, String category, User assignedUser) {
        this.id = id;
        this.title = title;
        this.category = category;
        this.assignedUser = assignedUser;
        this.status = TaskStatus.PENDING;
    }

    public int getId() {
        return id;
    }

    public String getCategory() {
        return category;
    }

    public User getAssignedUser() {
        return assignedUser;
    }

    public TaskStatus getStatus() {
        return status;
    }

    public void markCompleted() {
        status = TaskStatus.COMPLETED;
    }

    @Override
    public String toString() {
        return "Task ID: " + id
                + " | Title: " + title
                + " | Category: " + category
                + " | Assigned To: " + assignedUser.getName()
                + " | Status: " + status;
    }
}