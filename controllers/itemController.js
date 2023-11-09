const Item = require("../models/item");
const Category = require("../models/category");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

exports.index = asyncHandler(async (req, res, next) => {
    // Get quantities of Items and Categories in database
    const [numItems, numCategories] = await Promise.all([
        Item.countDocuments({}).exec(),
        Category.countDocuments({}).exec(),
    ]);

    res.render("index", {
        itemCount: numItems,
        categoryCount: numCategories,
    });
});

exports.itemList = asyncHandler(async (req, res, next) => {
    const allItems = await Item.find().exec();
    res.render("itemList", {
        title: "All Items",
        itemList: allItems,
    });
});

exports.itemDetail = asyncHandler(async (req, res, next) => {
    const item = await Item.findById(req.params.id).populate("category").exec();
    if (item === null) {
        const err = new Error("Item not found");
        err.status = 404;
        return next(err);
    }
    res.render("itemDetail", {
        title: "Item: ",
        item: item,
    });
});

exports.itemCreateGet = asyncHandler(async (req, res, next) => {
    const categoryList = await Category.find().sort({ name: 1 }).exec();
    categoryList.forEach((category) => (category.checked = false));
    res.render("itemForm", {
        title: "Create New Item",
        categoryList: categoryList,
        buttonText: "Create",
    });
});

exports.itemCreatePost = [
    (req, res, next) => {
        if (!Array.isArray(req.body.category)) {
            if (typeof req.body.category === "undefined")
                req.body.category = [];
            else req.body.category = new Array(req.body.category);
        }
        next();
    },
    body("name", "The 'Name' field must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("description").trim().escape(),
    body("category.*").escape(),
    body("price")
        .isInt({ min: 0 })
        .withMessage(
            "Price must be an integer value greater than or equal to 0."
        ),
    body("quantity")
        .isInt({ min: 0 })
        .withMessage(
            "Quantity must be an integer value greater than or equal to 0."
        ),
    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);
        const item = new Item({
            name: req.body.name,
            description: req.body.description,
            category: req.body.category,
            price: req.body.price,
            quantity: req.body.quantity,
        });
        if (!errors.isEmpty()) {
            const categoryList = await Category.find().sort({ name: 1 }).exec();
            categoryList.forEach((category) => {
                if (item.category.includes(category._id)) {
                    category.checked = "true";
                }
            });
            res.render("itemForm", {
                title: "Create New Item",
                item: item,
                categoryList: categoryList,
                buttonText: "Create",
                errors: errors.array(),
            });
        } else {
            await item.save();
            res.redirect(item.url);
        }
    }),
];

exports.itemUpdateGet = asyncHandler(async (req, res, next) => {
    const [item, categoryList] = await Promise.all([
        Item.findById(req.params.id),
        Category.find().sort({ name: 1 }).exec(),
    ]);
    categoryList.forEach((category) => {
        if (item.category.includes(category._id)) {
            category.checked = "true";
        }
    });
    if (item === null) {
        const err = new Error("Item not found");
        err.status = 404;
        return next(err);
    }
    res.render("itemForm", {
        title: "Update Item Information",
        item: item,
        categoryList: categoryList,
        buttonText: "Update",
    });
});

exports.itemUpdatePost = [
    (req, res, next) => {
        if (!Array.isArray(req.body.category)) {
            if (typeof req.body.category === "undefined")
                req.body.category = [];
            else req.body.category = new Array(req.body.category);
        }
        next();
    },
    body("name", "The 'Name' field must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("description").trim().escape(),
    body("category.*").escape(),
    body("price")
        .isInt({ min: 0 })
        .withMessage(
            "Price must be an integer value greater than or equal to 0."
        ),
    body("quantity")
        .isInt({ min: 0 })
        .withMessage(
            "Quantity must be an integer value greater than or equal to 0."
        ),
    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);
        const item = new Item({
            name: req.body.name,
            description: req.body.description,
            category: req.body.category,
            price: req.body.price,
            quantity: req.body.quantity,
            _id: req.params.id, // Use specified _id to overwrite existing record in database on save
        });
        if (!errors.isEmpty()) {
            const categoryList = await Category.find().sort({ name: 1 }).exec();
            categoryList.forEach((category) => {
                if (item.category.includes(category._id)) {
                    category.checked = "true";
                }
            });
            res.render("itemForm", {
                title: "Update Item Information",
                item: item,
                categoryList: categoryList,
                buttonText: "Create",
                errors: errors.array(),
            });
        } else {
            const updatedItem = await Item.findByIdAndUpdate(
                req.params.id,
                item,
                {}
            );
            res.redirect(item.url);
        }
    }),
];

exports.itemDeleteGet = asyncHandler(async (req, res, next) => {
    const item = await Item.findById(req.params.id).exec();
    if (item === null) {
        const err = new Error("Item not found");
        err.status = 404;
        return next(err);
    }
    res.render("itemDelete", {
        title: "Delete the item: ",
        item: item,
    });
});

exports.itemDeletePost = asyncHandler(async (req, res, next) => {
    await Item.findByIdAndDelete(req.body.itemid);
    res.redirect("/catalog/items");
});
