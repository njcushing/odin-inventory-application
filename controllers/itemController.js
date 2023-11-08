const Item = require("../models/item");
const Category = require("../models/category");
const asyncHandler = require("express-async-handler");

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
    res.send("Not yet implemented: Item Create GET");
});

exports.itemCreatePost = asyncHandler(async (req, res, next) => {
    res.send("Not yet implemented: Item Create POST");
});

exports.itemUpdateGet = asyncHandler(async (req, res, next) => {
    res.send("Not yet implemented: Item Update GET");
});

exports.itemUpdatePost = asyncHandler(async (req, res, next) => {
    res.send("Not yet implemented: Item Update POST");
});

exports.itemDeleteGet = asyncHandler(async (req, res, next) => {
    res.send("Not yet implemented: Item Delete GET");
});

exports.itemDeletePost = asyncHandler(async (req, res, next) => {
    res.send("Not yet implemented: Item Delete POST");
});
