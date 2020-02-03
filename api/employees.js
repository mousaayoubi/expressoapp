const express = require('express');
const employeesRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

employeesRouter.param("employeeId", (req, res, next, employeeId) => {
    db.get("SELECT * FROM Employee WHERE id = $id", {
        $id: employeeId
    }, (error, row) => {
        if (error) {
            next(error);
        } else if (row) {
            req.employee = row;
            next();
        } else {
            res.sendStatus(404);
        }
    });
});

const timesheetsRouter = require('./timesheets');

employeesRouter.use("/:employeeId/timesheets", timesheetsRouter);

const validateEmployee = (req, res, next) => {
    const newEmployee = req.body.employee;
    if (!newEmployee.name || !newEmployee.position || !newEmployee.wage) {
        res.sendStatus(400);
    } else {
        next();
    }
};

employeesRouter.get("/", (req, res, next) => {
    db.all("SELECT * FROM Employee WHERE is_current_employee = 1", (error, row) => {
        if (error) {
            next(error);
        } else {
            res.status(200).json({employees: row})
        }
    });
});

employeesRouter.post("/", validateEmployee, (req, res, next) => {
    const newEmployee = req.body.employee;
    const isCurrentEmployee = req.body.employee.is_current_employee === 0 ? 0 : 1;
    db.run("INSERT INTO Employee (name, position, wage, is_current_employee) VALUES ($name, $position, $wage, $isCurrentEmployee)", {
        $name: newEmployee.name,
        $position: newEmployee.position,
        $wage: newEmployee.wage,
        $isCurrentEmployee: isCurrentEmployee
    }, function (error) {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Employee WHERE id = ${this.lastID}`, (error, row) => {
                if (error) {
                    next(error);
                } else {
                    res.status(201).json({employee: row});
                }
            });
        }
    });
});

employeesRouter.get("/:employeeId", (req, res, next) => {
    res.status(200).json({employee: req.employee});
});

employeesRouter.put("/:employeeId", validateEmployee, (req, res, next) => {
    const updatedEmployee = req.body.employee;
    const isCurrentEmployee = req.body.employee.is_current_employee === 0 ? 0 : 1;
    db.run("UPDATE Employee SET name = $name, position = $position, wage = $wage, is_current_employee = $isCurrentEmployee WHERE id = $id", {
        $name: updatedEmployee.name,
        $position: updatedEmployee.position,
        $wage: updatedEmployee.wage,
        $isCurrentEmployee: isCurrentEmployee,
        $id: req.params.employeeId
    }, (error, row) => {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Employee WHERE id = ${req.params.employeeId}`, (error, row) => {
                if (error) {
                    next(error);
                } else {
                    res.status(200).json({employee: row});
                }
            });
        }
    });
});

employeesRouter.delete("/:employeeId", (req, res, next) => {
    db.run("UPDATE Employee SET is_current_employee = 0 WHERE id = $id", {
        $id: req.params.employeeId
    }, (error, row) => {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Employee WHERE id = ${req.params.employeeId}`, (error, row) => {
                if (error) {
                    next(error);
                } else {
                    res.status(200).json({employee: row});
                }
            });
        }
    });
});

module.exports = employeesRouter;