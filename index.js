'use strict';

const inquirer = require('inquirer');
const mysql = require('mysql');
const cTable = require('console.table');

const promptMessages = {
  viewEmployees: 'View All Employees',
  addEmployee: 'Add Employee',
  viewDepartments: 'View All Departments',
  addDepartment: 'Add Department',
  viewRoles: 'View All Roles',
  addRole: 'Add Role',
  updateEmployeeRole: 'Update Employee Role',
  exit: 'Exit'
};

const promptMessagesBonus = {
  viewEmployeesByDepartment: 'View All Employees By Department',
  updateEmployeeManager: 'Update Employee Manager',
  viewEmployeesByManager: 'View All Employees By Manager',
  removeEmployee: 'Remove Employee',
  removeDepartment: 'Remove Department',
  removeRole: 'Remove Role',
  viewDepartmentBudget: 'View Department Budget Utilized',
  viewManagers: 'View All Managers'
};

const roleChoices = [];
const employeeChoices = [];
const departmentChoices = [];
const employeeIds = [];

const connection = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'testing123',
  database: 'employees_db'
});

connection.connect(err => {
  if (err) throw err;
  prompt();
});

function prompt() {
  updateInfo(getDatabaseInfo);

  inquirer
    .prompt({
      name: 'action',
      type: 'list',
      message: 'What would you like to do?',
      choices: [
        promptMessages.viewEmployees,
        promptMessages.viewDepartments,
        promptMessages.viewRoles,
        promptMessages.addEmployee,
        promptMessages.addDepartment,
        promptMessages.addRole,
        promptMessages.updateEmployeeRole,
        promptMessages.exit
      ]
    })
    .then(answer => {
      switch (answer.action) {
        case promptMessages.viewEmployees:
          viewEmployees();
          break;

        case promptMessages.viewDepartments:
          view('departments');
          break;

        case promptMessages.viewRoles:
          view('roles');
          break;

        case promptMessages.addEmployee:
          addEmployee();
          break;

        case promptMessages.addDepartment:
          addDepartment();
          break;

        case promptMessages.addRole:
          addRole();
          break;

        case promptMessages.updateEmployeeRole:
          updateEmployeeRole();
          break;

        case promptMessages.exit:
          connection.end();
          break;
        default:
          throw new Error('Unexpected prompt error.');
      }
    });
}

function viewEmployees() {
  const query = `
    SELECT employee.id AS 'Employee ID', employee.first_name AS 'First Name', employee.last_name AS 'Last Name', role.title AS 'Title', department.name AS 'Department', role.salary AS 'Salary', concat(E.first_name, ' ', E.last_name) AS 'Manager Name'
    FROM employee 
      INNER JOIN role 
          ON (employee.role_id = role.id)
      INNER JOIN department
          ON (role.department_id = department.id)
      LEFT JOIN employee E
          ON (employee.manager_id = E.id)
    ORDER BY employee.id;
    `;

  connection.query(query, (err, res) => {
    if (err) throw err;
    const employeeTable = cTable.getTable(res);
    console.log('\n' + employeeTable);
    prompt();
  });
}

function view(choice) {
  switch (choice) {
    case 'departments':
      const departmentQuery = 'SELECT name AS Departments FROM department';
      connection.query(departmentQuery, (err, res) => {
        if (err) throw err;
        const departmentTable = cTable.getTable(res);
        console.log('\n' + departmentTable);
        prompt();
      });
      break;
    case 'roles':
      const roleQuery = 'SELECT title AS Roles FROM role';
      connection.query(roleQuery, (err, res) => {
        if (err) throw err;
        const roleTable = cTable.getTable(res);
        console.log('\n' + roleTable);
        prompt();
      });
      break;
    case 'employees':
      break;
    default:
      throw new Error('Unexpected choice, resulting in an error.');
  }
}

function addEmployee() {
  employeeChoices.push('NULL');

  inquirer
    .prompt([
      {
        name: 'firstName',
        type: 'input',
        message: "What is the employee's first name?"
      },
      {
        name: 'lastName',
        type: 'input',
        message: "What is the employee's last name?"
      },
      {
        name: 'role',
        type: 'rawlist',
        message: "What is the employee's role?",
        choices: roleChoices
      },
      {
        name: 'manager',
        type: 'rawlist',
        message: "Who is the employee's manager?",
        choices: employeeChoices
      }
    ])
    .then(answer => {
      let roleId = roleChoices.indexOf(answer.role) + 1;
      let managerIdIndex = employeeChoices.indexOf(answer.manager);
      let managerId = employeeIds[managerIdIndex];

      const query = connection.query(
        'INSERT INTO employee SET ?',
        {
          first_name: answer.firstName,
          last_name: answer.lastName,
          role_id: roleId,
          manager_id: managerId
        },
        (err, res) => {
          if (err) throw err;
          console.log('-- New employee was added! --');
          prompt();
        }
      );
    });
}

function addDepartment() {
  inquirer
    .prompt([
      {
        name: 'departmentName',
        type: 'input',
        message: 'What is the name of the department?'
      }
    ])
    .then(answer => {
      const query = connection.query(
        'INSERT INTO department SET ?',
        {
          name: answer.departmentName
        },
        (err, res) => {
          if (err) throw err;
          console.log('-- New department was added! --');
          prompt();
        }
      );
    });
}

function addRole() {
  inquirer
    .prompt([
      {
        name: 'roleName',
        type: 'input',
        message: 'What is the name of the role?'
      },
      {
        name: 'salary',
        type: 'input',
        message: 'What is the salary for this role?',
        validate: answer => {
          const check = answer.match(/^[1-9][0-9]*([.][0-9]{2}|)$/);
          if (check) {
            return true;
          } else {
            return 'Please enter a valid salary.';
          }
        }
      },
      {
        name: 'roleDepartment',
        type: 'list',
        message: 'What department is this role in?',
        choices: departmentChoices
      }
    ])
    .then(answer => {
      let departmentId = departmentChoices.indexOf(answer.roleDepartment) + 1;

      const query = connection.query(
        'INSERT INTO role SET ?',
        {
          title: answer.roleName,
          salary: answer.salary,
          department_id: departmentId
        },
        (err, res) => {
          if (err) throw err;
          console.log('-- New role was added! --');
          prompt();
        }
      );
    });
}

function updateEmployeeRole() {
  inquirer
    .prompt([
      {
        name: 'updateEmployee',
        type: 'list',
        message: "Which employee's role would you like to update?",
        choices: employeeChoices
      },
      {
        name: 'roleUpdate',
        type: 'rawlist',
        message: "What is the employee's new role?",
        choices: roleChoices
      }
    ])
    .then(answer => {
      let employeeIdIndex = employeeChoices.indexOf(answer.updateEmployee);
      let employeeId = employeeIds[employeeIdIndex];
      let newRole = roleChoices.indexOf(answer.roleUpdate) + 1;

      const query = connection.query(
        'UPDATE employee SET ? WHERE ?',
        [
          {
            role_id: newRole
          },
          {
            id: employeeId
          }
        ],
        (err, res) => {
          if (err) throw err;
          console.log('-- Successfully updated employee! --');
          prompt();
        }
      );
    });
}

function getDatabaseInfo(table, column) {
  let choiceArr;

  switch (table) {
    case 'department':
      choiceArr = departmentChoices;
      break;
    case 'role':
      choiceArr = roleChoices;
      break;
    case 'employee':
      choiceArr = employeeChoices;
      break;
    default:
      throw new Error('Unknown table, unexpected case.');
  }

  if (table === 'employee' && column === 'full_name') {
    employeeChoices.length = 0;

    const query = connection.query(
      `SELECT concat(first_name, ' ', last_name) AS full_name FROM employee`,
      (err, res) => {
        if (err) throw err;
        for (const employees of res) {
          choiceArr.push(employees.full_name);
        }
      }
    );
  } else {
    const query = connection.query(
      `SELECT ${column} FROM ${table}`,
      (err, res) => {
        if (err) throw err;

        switch (column) {
          case 'name':
            departmentChoices.length = 0;

            for (const department of res) {
              choiceArr.push(department.name);
            }
            break;
          case 'title':
            roleChoices.length = 0;

            for (const role of res) {
              choiceArr.push(role.title);
            }
            break;
          case 'id':
            employeeIds.length = 0;

            for (const ids of res) {
              employeeIds.push(ids.id);
            }
            employeeIds.sort((a, b) => a - b);
            break;
          default:
            throw new Error('Unknown column, unexpected case.');
        }
      }
    );
  }
}

function updateInfo(callback) {
  callback('role', 'title');
  callback('department', 'name');
  callback('employee', 'full_name');
  callback('employee', 'id');
}

// TODO: validate all answers, extract prompts to different file
