const express = require('express');
const menusRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const menuItemsRouter = require('./menuItems');

menusRouter.use("/:menuId/menu-items", menuItemsRouter);

menusRouter.param("menuId", (req, res, next, menuId) => {
    db.get("SELECT * FROM Menu WHERE id = $menuId", {
        $menuId: menuId
    }, (error, row) => {
        if (error) {
            next(error);
        } else if (row) {
            req.menu = row;
            next();
        } else {
            res.sendStatus(404);
        }
    });
});

const validateMenu = (req, res, next) => {
    const newMenu = req.body.menu;
    if (!newMenu.title) {
        res.sendStatus(400);
    } else {
        next();
    }
};

menusRouter.get("/", (req, res, next) => {
    db.all("SELECT * FROM Menu", (error, row) => {
        if (error) {
            next(error);
        } else {
            res.status(200).json({menus: row});
        }
    });
});

menusRouter.post("/", validateMenu, (req, res, next) => {
    const newMenu = req.body.menu;
    db.run("INSERT INTO Menu (title) VALUES ($title)", {
        $title: newMenu.title
    }, function (error) {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Menu WHERE id = ${this.lastID}`, (error, row) => {
                if (error) {
                    next(error);
                } else {
                    res.status(201).json({menu: row});
                }
            });
        }
    });
});

menusRouter.get("/:menuId", (req, res, next) => {
    res.status(200).json({menu: req.menu});
});

menusRouter.put("/:menuId", validateMenu, (req, res, next) => {
    const newMenu = req.body.menu;
    db.run("UPDATE Menu SET title = $title WHERE id = $menuId", {
        $title: newMenu.title,
        $menuId: req.params.menuId
    }, (error, row) => {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Menu WHERE id = ${req.params.menuId}`, (error, row) => {
                if (error) {
                    next(error);
                } else {
                    res.status(200).json({menu: row});
                }
            });
        }
    });
});

menusRouter.delete("/:menuId", (req, res, next) => {
    db.get("SELECT * FROM MenuItem WHERE menu_id = $menuId", {
        $menuId: req.params.menuId
    }, (error, row) => {
        if (error) {
            next(error);
        } else if (row) {
            res.sendStatus(400);
        } else {
            db.run(`DELETE FROM Menu WHERE id = ${req.params.menuId}`, (error, row) => {
                if (error) {
                    next(error);
                } else {
                    db.get(`SELECT * FROM Menu WHERE id = ${req.params.menuId}`, (error, row) => {
                        if (error) {
                            next(error);
                        } else {
                            res.status(204).json({menu: row});
                        }
                    });
                }
            });
        }
    });
});

module.exports = menusRouter;