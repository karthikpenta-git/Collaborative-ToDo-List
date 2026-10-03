// Define the information stored for each user.
class User {
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}

// Make the User class available to other files.
module.exports = User;