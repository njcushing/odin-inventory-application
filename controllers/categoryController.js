const Category = require("../models/category");
const Item = require("../models/item");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

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
    res.render("categoryForm", { title: "Create New Category" });
});

exports.categoryCreatePost = [
    body(
        "name",
        "Category name must be between 3 and 100 characters in length."
    )
        .trim()
        .isLength({ min: 3, max: 100 })
        .escape(),
    body("description").escape(),
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
    res.send("Not yet implemented: Category Update GET");
});

exports.categoryUpdatePost = asyncHandler(async (req, res, next) => {
    res.send("Not yet implemented: Category Update POST");
});

exports.categoryDeleteGet = asyncHandler(async (req, res, next) => {
    res.send("Not yet implemented: Category Delete GET");
});

exports.categoryDeletePost = asyncHandler(async (req, res, next) => {
    res.send("Not yet implemented: Category Delete POST");
});
