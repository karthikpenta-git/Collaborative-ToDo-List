import java.util.Scanner;

public class Main {

    public static void main(String[] args) {

        Scanner scanner = new Scanner(System.in);
        TaskManager manager = new TaskManager();

        int nextUserId = 1;
        int nextTaskId = 1;
        boolean running = true;

        System.out.println("==================================");
        System.out.println("     COLLABORATIVE TO-DO LIST");
        System.out.println("          JAVA VERSION");
        System.out.println("==================================");

        while (running) {

            System.out.println("\n1. Add User");
            System.out.println("2. Add Task");
            System.out.println("3. View All Tasks");
            System.out.println("4. View Tasks by User");
            System.out.println("5. View Tasks by Category");
            System.out.println("6. Mark Task Complete");
            System.out.println("7. Delete Task");
            System.out.println("8. Simulate Multiple Users");
            System.out.println("9. Exit");

            System.out.print("\nChoose an option: ");

            try {
                int choice = Integer.parseInt(scanner.nextLine());

                switch (choice) {

                    case 1:
                        System.out.print("Enter user name: ");
                        String name = scanner.nextLine();

                        manager.addUser(
                            new User(nextUserId++, name)
                        );
                        break;

                    case 2:
                        System.out.print("Enter task title: ");
                        String title = scanner.nextLine();

                        System.out.print("Enter category: ");
                        String category = scanner.nextLine();

                        System.out.print("Enter user ID: ");
                        int userId =
                            Integer.parseInt(scanner.nextLine());

                        User assignedUser =
                            manager.findUser(userId);

                        if (assignedUser == null) {
                            System.out.println("User not found.");
                            break;
                        }

                        manager.addTask(
                            new Task(
                                nextTaskId++,
                                title,
                                category,
                                assignedUser
                            )
                        );
                        break;

                    case 3:
                        manager.viewAllTasks();
                        break;

                    case 4:
                        System.out.print("Enter user ID: ");
                        int searchUserId =
                            Integer.parseInt(scanner.nextLine());

                        manager.viewTasksByUser(searchUserId);
                        break;

                    case 5:
                        System.out.print("Enter category: ");
                        String searchCategory =
                            scanner.nextLine();

                        manager.viewTasksByCategory(
                            searchCategory
                        );
                        break;

                    case 6:
                        System.out.print("Enter task ID: ");
                        int completeId =
                            Integer.parseInt(scanner.nextLine());

                        manager.markTaskCompleted(completeId);
                        break;

                    case 7:
                        System.out.print("Enter task ID: ");
                        int deleteId =
                            Integer.parseInt(scanner.nextLine());

                        manager.deleteTask(deleteId);
                        break;

                    case 8:
                        manager.simulateConcurrentUsers();
                        break;

                    case 9:
                        running = false;
                        System.out.println("Application closed.");
                        break;

                    default:
                        System.out.println("Invalid option.");
                }

            } catch (NumberFormatException e) {
                System.out.println(
                    "Please enter a valid number."
                );

            } catch (Exception e) {
                System.out.println(
                    "Error: " + e.getMessage()
                );
            }
        }

        scanner.close();
    }
}