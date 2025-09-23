const readline = require("readline");

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Employee data stored in memory
let employees = [];

// Main Menu
function showMenu() {
  console.log("\nEmployee Management System");
  console.log("1. Add Employee");
  console.log("2. List Employees");
  console.log("3. Remove Employee");
  console.log("4. Exit");

  rl.question("\nEnter your choice: ", (choice) => {
    switch (choice) {
      case "1":
        addEmployee();
        break;
      case "2":
        listEmployees();
        break;
      case "3":
        removeEmployee();
        break;
      case "4":
        console.log("Exiting...");
        rl.close();
        break;
      default:
        console.log("Invalid choice. Please try again.");
        showMenu();
    }
  });
}

// Add Employee
function addEmployee() {
  rl.question("Enter employee name: ", (name) => {
    rl.question("Enter employee ID: ", (id) => {
      employees.push({ name, id });
      console.log(`Employee ${name} (ID: ${id}) added successfully!`);
      showMenu();
    });
  });
}

// List Employees
function listEmployees() {
  if (employees.length === 0) {
    console.log("No employees found.");
  } else {
    console.log("\nEmployee List:");
    employees.forEach((emp, index) => {
      console.log(`${index + 1}. Name: ${emp.name}, ID: ${emp.id}`);
    });
  }
  showMenu();
}

// Remove Employee
function removeEmployee() {
  rl.question("Enter Employee ID to remove: ", (id) => {
    const index = employees.findIndex(emp => emp.id === id);
    if (index !== -1) {
      const removed = employees.splice(index, 1);
      console.log(`Employee ${removed[0].name} (ID: ${removed[0].id}) removed.`);
    } else {
      console.log("Employee not found.");
    }
    showMenu();
  });
}

// Start app
showMenu();
