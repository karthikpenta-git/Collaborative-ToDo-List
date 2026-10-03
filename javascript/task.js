class Task {
    constructor(id, title, category, assignedUser) {
        this.id = id;
        this.title = title;
        this.category = category;
        this.assignedUser = assignedUser;
        this.status = "PENDING";
    }

    markCompleted() {
        this.status = "COMPLETED";
    }

    toString() {
        return `Task ID: ${this.id} | Title: ${this.title} | Category: ${this.category} | Assigned To: ${this.assignedUser.name} | Status: ${this.status}`;
    }
}

module.exports = Task;