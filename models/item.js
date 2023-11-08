const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const integerValidator = {
    validator: Number.isInteger,
    message: `{VALUE} is not an integer value`,
};

const ItemSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    category: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    price: {
        type: Number,
        required: true,
        validate: integerValidator,
        default: 0,
    },
    quantity: {
        type: Number,
        required: true,
        validate: integerValidator,
        default: 0,
    },
    image: { type: Buffer },
});

ItemSchema.virtual("url").get(function () {
    return `/catalog/item/${this._id}`;
});

ItemSchema.virtual("priceFormattedGBP").get(function () {
    return Intl.NumberFormat("en-UK", {
        style: "currency",
        currency: "GBP",
    }).format(this.price / 100);
});

module.exports = mongoose.model("Item", ItemSchema);
