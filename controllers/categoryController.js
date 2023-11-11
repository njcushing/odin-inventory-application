const Category = require("../models/category");
const Item = require("../models/item");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

const validatePassword = body("password", "Password is incorrect")
    .trim()
    .escape()
    .equals(process.env.ADMIN_PASS);

const checkFieldValidation = [
    body(
        "name",
        "Category name must be between 3 and 100 characters in length."
    )
        .trim()
        .isLength({ min: 3, max: 100 })
        .escape(),
    body("description").trim().escape(),
    validatePassword,
];

exports.categoryList = asyncHandler(async (req, res, next) => {
    const allCategories = await Category.find().exec();
    res.render("categoryList", {
        title: "All Categories",
        categoryList: allCategories,
    });
});

exports.categoryDetail = asyncHandler(async (req, res, next) => {
    const [category, itemsInCategory] = await Promise.all([
        Category.findById(req.params.id).exec(),
        Item.find({ category: req.params.id }, { name: 1, price: 1 }).exec(),
    ]);
    if (category === null) {
        const err = new Error("Category not found");
        err.status = 404;
        return next(err);
    }
    res.render("categoryDetail", {
        title: "Category: ",
        category: category,
        itemsInCategory: itemsInCategory,
    });
});

exports.categoryCreateGet = asyncHandler(async (req, res, next) => {
    res.render("categoryForm", {
        title: "Create New Category",
        buttonText: "Create",
    });
});

exports.categoryCreatePost = [
    ...checkFieldValidation,
    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);
        const category = new Category({
            name: req.body.name,
            description: req.body.description,
        });
        if (!errors.isEmpty()) {
            res.render("categoryForm", {
                title: "Create New Category",
                category: category,
                errors: errors.array(),
            });
        } else {
            await category.save();
            res.redirect(category.url);
        }
    }),
];

exports.categoryUpdateGet = asyncHandler(async (req, res, next) => {
    const category = await Category.findById(req.params.id).exec();
    if (category === null) {
        const err = new Error("Category not found");
        err.status = 404;
        return next(err);
    }
    res.render("categoryForm", {
        title: "Update Category Information",
        category: category,
        buttonText: "Update",
    });
});

exports.categoryUpdatePost = [
    ...checkFieldValidation,
    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);
        const category = new Category({
            name: req.body.name,
            description: req.body.description,
            _id: req.params.id, // Use specified _id to overwrite existing record in database on save
        });
        if (!errors.isEmpty()) {
            res.render("categoryForm", {
                title: "Update Category Information",
                category: category,
                errors: errors.array(),
            });
        } else {
            const updatedCategory = await Category.findByIdAndUpdate(
                req.params.id,
                category,
                {}
            );
            res.redirect(category.url);
        }
    }),
];

exports.categoryDeleteGet = asyncHandler(async (req, res, next) => {
    const category = await Category.findById(req.params.id);
    res.render("categoryDelete", {
        title: "Delete the category: ",
        category: category,
    });
});

exports.categoryDeletePost = [
    validatePassword,
    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);
        const category = await Category.findById(req.params.id).exec();
        if (category === null) {
            const err = new Error("Category not found");
            err.status = 404;
            return next(err);
        }
        if (!errors.isEmpty()) {
            res.render("categoryDelete", {
                title: "Delete the category: ",
                category: category,
                errors: errors.array(),
            });
        } else {
            await Item.updateMany({
                $pull: {
                    category: new mongoose.Types.ObjectId(req.body.categoryid),
                },
            });
            await Category.findByIdAndDelete(req.body.categoryid);
            res.redirect("/catalog/categories");
        }
    }),
];
