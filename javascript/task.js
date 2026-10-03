// Represent one task and its assigned user.
class Task {
    constructor(id, title, category, assignedUserId) {
        this.id = id;
        this.title = title;
        this.category = category;
        this.assignedUserId = assignedUserId;
        this.status = "Pending";
    }
}

module.exports = Task;