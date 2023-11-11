const Item = require("../models/item");
const Category = require("../models/category");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const fs = require("fs");
const debug = require("debug")("item");

const path = require("path");
const multer = require("multer");
const limits = {
    fileSize: 1_000_000, // 1MB file size maximum
    files: 1,
};
const authorisedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/tiff",
    "image/gif",
];
const fileFilter = (req, file, cb) => {
    if (authorisedMimeTypes.includes(file.mimetype)) return cb(null, true);
    return cb(null, false);
};
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/images");
    },
    filename: function (req, file, cb) {
        const prefix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, prefix + path.extname(file.originalname));
    },
});
const upload = multer({
    limits: limits,
    fileFilter: fileFilter,
    storage: storage,
});

const validatePassword = body("password", "Password is incorrect")
    .trim()
    .escape()
    .equals(process.env.ADMIN_PASS);

const checkFieldValidation = [
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
    validatePassword,
];

const debugResponse = (req, res, next) => {
    debug(`item not found: ${req.params.id}`);
    const err = new Error("Item not found");
    err.status = 404;
    return next(err);
};

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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        debugResponse(req, res, next);
    }
    const item = await Item.findById(req.params.id).populate("category").exec();
    if (item === null) debugResponse(req, res, next);
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
    upload.single("image"),
    (req, res, next) => {
        if (!Array.isArray(req.body.category)) {
            if (typeof req.body.category === "undefined")
                req.body.category = [];
            else req.body.category = new Array(req.body.category);
        }
        next();
    },
    checkFieldValidation,
    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);
        const item = new Item({
            name: req.body.name,
            description: req.body.description,
            category: req.body.category,
            price: req.body.price,
            quantity: req.body.quantity,
            image: req.file ? req.file.filename : null,
        });
        if (!errors.isEmpty()) {
            fs.unlink(`./public/images/${item.image}`, (err) => {
                return;
            });
            item.image = null;
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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        debugResponse(req, res, next);
    }
    const [item, categoryList] = await Promise.all([
        Item.findById(req.params.id),
        Category.find().sort({ name: 1 }).exec(),
    ]);
    if (item === null) debugResponse(req, res, next);
    categoryList.forEach((category) => {
        if (item.category.includes(category._id)) {
            category.checked = "true";
        }
    });
    res.render("itemForm", {
        title: "Update Item Information",
        item: item,
        categoryList: categoryList,
        buttonText: "Update",
    });
});

exports.itemUpdatePost = [
    upload.single("image"),
    (req, res, next) => {
        if (!Array.isArray(req.body.category)) {
            if (typeof req.body.category === "undefined")
                req.body.category = [];
            else req.body.category = new Array(req.body.category);
        }
        next();
    },
    checkFieldValidation,
    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);
        const item = new Item({
            name: req.body.name,
            description: req.body.description,
            category: req.body.category,
            price: req.body.price,
            quantity: req.body.quantity,
            image: req.file ? req.file.filename : null,
            _id: req.params.id, // Use specified _id to overwrite existing record in database on save
        });
        if (!errors.isEmpty()) {
            fs.unlink(`./public/images/${item.image}`, (err) => {
                return;
            });
            item.image = null;
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
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                debugResponse(req, res, next);
            }
            const originalItem = await Item.findById(req.params.id);
            if (originalItem === null) debugResponse(req, res, next);
            if (originalItem.image !== null) {
                fs.unlink(`./public/images/${originalItem.image}`, (err) => {
                    return;
                });
            }
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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        debugResponse(req, res, next);
    }
    const item = await Item.findById(req.params.id).exec();
    if (item === null) debugResponse(req, res, next);
    res.render("itemDelete", {
        title: "Delete the item: ",
        item: item,
    });
});

exports.itemDeletePost = [
    validatePassword,
    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            debugResponse(req, res, next);
        }
        const item = await Item.findById(req.params.id).exec();
        if (item === null) debugResponse(req, res, next);
        if (!errors.isEmpty()) {
            res.render("itemDelete", {
                title: "Delete the item: ",
                item: item,
                errors: errors.array(),
            });
        } else {
            fs.unlink(`./public/images/${item.image}`, (err) => {
                return;
            });
            await Item.findByIdAndDelete(req.body.itemid);
            res.redirect("/catalog/items");
        }
    }),
];
