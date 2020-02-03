const express = require('express');
const timesheetsRouter = express.Router({mergeParams: true});
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

timesheetsRouter.param("timesheetId", (req, res, next, timesheetId) => {
    db.get("SELECT * FROM Timesheet WHERE id = $timesheetId", {
        $timesheetId: timesheetId
    }, (error, row) => {
        if (error) {
            next(error);
        } else if (row) {
            req.timesheet = row;
            next();
        } else {
            res.sendStatus(404);
        }
    });
});

timesheetsRouter.get("/", (req, res, next) => {
    db.all("SELECT * FROM Timesheet WHERE employee_id = $employeeId", {
        $employeeId: req.params.employeeId
    }, (error, row) => {
        if (error) {
            next(error);
        } else if (row) {
            res.status(200).json({timesheets: row});
        } else {
            res.json({timesheets: []});
        }
    });
});

const validateTimesheet = (req, res, next) => {
    const newTimesheet = req.body.timesheet;
    if (!newTimesheet.hours || !newTimesheet.rate || !newTimesheet.date) {
        res.sendStatus(400);
    } else {
        next();
    }
}

timesheetsRouter.post("/", validateTimesheet, (req, res, next) => {
    const newTimesheet = req.body.timesheet;
    db.run("INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employeeId)", {
        $hours: newTimesheet.hours,
        $rate: newTimesheet.rate,
        $date: newTimesheet.date,
        $employeeId: req.params.employeeId
    }, function (error) {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Timesheet where id = ${this.lastID}`, (error, row) => {
                if (error) {
                    next(error);
                } else {
                    res.status(201).json({timesheet: row})
                }
            });
        }
    });
});

timesheetsRouter.put("/:timesheetId", validateTimesheet, (req, res, next) => {
    const updatedTimesheet = req.body.timesheet;
    db.run("UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date, employee_id = $employeeId WHERE id = $timesheetId", {
        $hours: updatedTimesheet.hours,
        $rate: updatedTimesheet.rate,
        $date: updatedTimesheet.date,
        $employeeId: req.params.employeeId,
        $timesheetId: req.params.timesheetId
    }, (error, row) => {
        if (error) {
            next(error)
        } else {
            db.get(`SELECT * FROM Timesheet WHERE id = ${req.params.timesheetId}`, (error, row) => {
                if (error) {
                    next(error);
                } else {
                    res.status(200).json({timesheet: row});
                }
            });
        }
    });
});

timesheetsRouter.delete("/:timesheetId", (req, res, next) => {
    db.run("DELETE FROM Timesheet WHERE id = $id", {
        $id: req.params.timesheetId
    }, (error, row) => {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Timesheet WHERE id = ${req.params.timesheetId}`, (error, row) => {
                if (error) {
                    next(error);
                } else {
                    res.status(204).json({timesheet: row});
                }
            });
        }
    });
});

module.exports = timesheetsRouter;