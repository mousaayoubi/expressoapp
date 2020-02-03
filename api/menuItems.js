const express = require('express');
const menuItemsRouter = express.Router({mergeParams: true});
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menuItemsRouter.param("menuItemId", (req, res, next, menuItemId) => {
    db.get("SELECT * FROM MenuItem WHERE id = $menuItemId", {
        $menuItemId: menuItemId
    }, (error, row) => {
        if (error) {
            next(error);
        } else if (row) {
            req.menuItem = row;
            next();
        } else {
            res.sendStatus(404);
        }
    });
});

const validateMenuItem = (req, res, next) => {
    const newMenuItem = req.body.menuItem;
    if (!newMenuItem.name || !newMenuItem.description || !newMenuItem.inventory || !newMenuItem.price) {
        res.sendStatus(400);
    } else {
        next();
    }
};

menuItemsRouter.get("/", (req, res, next) => {
    db.all("SELECT * FROM MenuItem WHERE menu_id = $menuId", {
        $menuId: req.params.menuId
    }, (error, row) => {
        if (error) {
            next(error);
        } else if (row) {
            res.status(200).json({menuItems: row})
        } else {
            res.json({menuItems: []});
        }
    });
});

menuItemsRouter.post("/", validateMenuItem, (req, res, next) => {
    const newMenuItem = req.body.menuItem;
    db.run("INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES ($name, $description, $inventory, $price, $menuId)", {
        $name: newMenuItem.name,
        $description: newMenuItem.description,
        $inventory: newMenuItem.inventory,
        $price: newMenuItem.price,
        $menuId: req.params.menuId
    }, function (error) {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM MenuItem WHERE id = ${this.lastID}`, (error, row) => {
                if (error) {
                    next(error);
                } else {
                    res.status(201).json({menuItem: row});
                }
            });
        }
    });
});

menuItemsRouter.put("/:menuItemId", validateMenuItem, (req, res, next) => {
    const updatedMenuItem = req.body.menuItem;
    db.run("UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price, menu_id = $menuId WHERE id = $menuItemId", {
        $name: updatedMenuItem.name,
        $description: updatedMenuItem.description,
        $inventory: updatedMenuItem.inventory,
        $price: updatedMenuItem.price,
        $menuId: req.params.menuId,
        $menuItemId: req.params.menuItemId
    }, (error, row) => {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM MenuItem WHERE id = ${req.params.menuItemId}`, (error, row) => {
                if (error) {
                    next(error)
                } else {
                    res.status(200).json({menuItem: row});
                }
            });
        }
    });
});

menuItemsRouter.delete("/:menuItemId", (req, res, next) => {
    db.run("DELETE FROM MenuItem WHERE id = $menuItemId", {
        $menuItemId: req.params.menuItemId
    }, (error, row) => {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM MenuItem WHERE id = ${req.params.menuItemId}`, (error, row) => {
                if (error) {
                    next(error);
                } else {
                    res.status(204).json({menuItem: row});
                }
            });
        }
    });
});

module.exports = menuItemsRouter;