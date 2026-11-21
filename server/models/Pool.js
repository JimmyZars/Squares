const mongoose = require("mongoose");
const PoolSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    members: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    memberLabels: {
      type: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, required: true },
          label: { type: String, required: true },
        },
      ],
      default: [],
    },
    squareUsers: {
      type: [mongoose.Schema.Types.ObjectId],
      default: () => Array(100).fill(null),
    },
    passwordHash: { type: String, default: null, select: false },
    name: { type: String, required: true, maxlength: 80, trim: true },
    home: { type: String, required: true, maxlength: 45 },
    away: { type: String, required: true, maxlength: 45 },
    price: { type: Number, required: true, min: 0, max: 100000 },
    squares: {
      type: [{ type: String, default: null }],
      default: () => Array(100).fill(null),
      validate: {
        validator: (a) => a.length === 100,
        message: "Exactly 100 squares required",
      },
    },
    rows: {
      type: [Number],
      default: () => ["?", "?", "?", "?", "?", "?", "?", "?", "?", "?"],
    },
    cols: {
      type: [Number],
      default: () => ["?", "?", "?", "?", "?", "?", "?", "?", "?", "?"],
    },
  },
  { timestamps: true },
);
PoolSchema.set("toJSON", {
  transform: (_doc, obj) => {
    obj.id = obj._id.toString();
    delete obj._id;
    delete obj.__v;
    delete obj.passwordHash;
    obj.isLocked = Boolean(_doc.passwordHash);
    return obj;
  },
});
module.exports = mongoose.model("Pool", PoolSchema);
