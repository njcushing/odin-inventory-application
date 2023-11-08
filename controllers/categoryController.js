const Category = require("../models/category");
const Item = require("../models/item");
const asyncHandler = require("express-async-handler");

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

        // Find all items that reference the specified category id
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
    res.send("Not yet implemented: Category Create GET");
});

exports.categoryCreatePost = asyncHandler(async (req, res, next) => {
    res.send("Not yet implemented: Category Create POST");
});

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
