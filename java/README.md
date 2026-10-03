# Java Collaborative To-Do List

Java counterpart of Aliza's grouped 12-option JavaScript implementation.
Requires JDK 17 or newer, including javac. Gson is bundled in lib.

## Installation

Back up your existing Java folder. Copy this package's java folder into
Collaborative-ToDo-List and replace its Java source files. Remove the old
TaskStatus.java; this implementation uses Pending and Completed string values.
Do not replace your javascript folder.

## Compile and run on macOS or Linux

From the repository root:

```bash
mkdir -p java/out
javac -encoding UTF-8 -cp "java/lib/*" -d java/out java/*.java
java -cp "java/out:java/lib/*" Main
```

Windows PowerShell uses a semicolon in the runtime classpath:

```powershell
New-Item -ItemType Directory -Force java/out
javac -encoding UTF-8 -cp "java/lib/*" -d java/out java/*.java
java -cp "java/out;java/lib/*" Main
```

## Menu and features

1. Create user
2. Add task
3. View users
4. View all tasks
5. View tasks by user
6. View tasks by category
7. Mark task as completed
8. Delete task
9. Reassign task
10. Delete user
11. Run concurrency demo
12. Exit

All options appear together in CREATE, VIEW, UPDATE & DELETE, and DEMO & EXIT
groups. No submenu or Enter-to-continue pause is used. Success messages are
green, errors red, warnings yellow, and information cyan. Set NO_COLOR in the
environment to disable colors. Tables include the same JavaScript record fields.

## JSON and validation

Successful changes save immediately to java/data.json. Restarting restores
users, tasks, statuses, and counters. A missing file starts an empty application.
Java and JavaScript use separate data files with the same field structure.
Do not run simultaneous processes editing the same file.

Names, titles, and categories must be nonempty. Usernames are unique ignoring
case. Task titles are unique per assigned user, including during reassignment.
IDs are never renumbered after deletion. Deleting a user shows pending/completed
task counts and requires typing yes, then removes the user and assigned tasks.
An invalid save file stops startup rather than resetting data. A save failure
stops the session. Storage writes a temporary snapshot before replacing the file.

## Java concurrency

ExecutorService starts two real worker threads against a separate data copy.
CountDownLatch ensures both start before their simulated waits. The first user's
operation waits 1000 ms; the second waits 500 ms. TaskManager synchronizes task
creation and ID allocation. Both futures finish before the menu returns.
Demo tasks do not change the main state or saved file. Scheduling may change
start log order; the shorter delay normally finishes first. This is an
in-process simulation, not a networked multi-terminal application.

## Tests

After compiling:

```bash
java -cp "java/out:java/lib/*" ApplicationTest
```

The 19 checks cover creation, validation, filtering, completion, reassignment,
deletion, persistence, counters, isolated concurrency, and corrupt saved data.
Tests use temporary data and do not change java/data.json. Additional scripted
menu tests verified cancelled and confirmed user deletion and restart loading.

## Files

- Main.java: menu, input, confirmation, and saving.
- ConsoleView.java: highlighted messages and aligned tables.
- User.java and Task.java: encapsulated records.
- TaskManager.java: validation and synchronized state operations.
- Storage.java: JSON loading, saving, and independent copies.
- ConcurrencyDemo.java: worker threads and simulated waits.
- ApplicationTest.java: automated checks.

## Comparison and scope

Java uses declared types, compiled classes, ArrayList, streams, ExecutorService,
synchronized methods, and a JSON library. JavaScript uses dynamic objects,
array callbacks, the event loop, async/await, Promise.all, and built-in JSON.
The menu and workflows match; table spacing and string quote style differ.
Java IDs are positive 32-bit integers, while JavaScript allows larger safe IDs.

Repository HEAD inspected had a nine-option JavaScript app. This package targets
the newer grouped 12-option version retained in Git commit b495a74, matching
the demonstrated screenshots. No remote repository changes have been pushed.

## Dependency

lib/gson-2.11.0.jar is the official Gson 2.11.0 Maven Central artifact.
Gson uses Apache License 2.0; see lib/LICENSE-gson.txt.
Project: https://github.com/google/gson
