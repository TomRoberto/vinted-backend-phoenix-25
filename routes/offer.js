const express = require("express");
const cloudinary = require("cloudinary").v2;
const router = express.Router();
const fileUpload = require("express-fileupload");
const Offer = require("../models/Offer");
const isAuthenticated = require("../middlewares/isAuthenticated");

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      // console.log("BODY", req.body);
      // console.log("FILES", req.files);

      // const title = req.body.title;
      // const description = req.body.description;
      // const price = req.body.price;

      const { title, description, price, condition, city, brand, size, color } =
        req.body;

      const cloudinaryResponse = await cloudinary.uploader.upload(
        convertToBase64(req.files.picture)
      );

      console.log("CLOUDINARY RESPONSE", cloudinaryResponse);

      console.log("DANS LA ROUTE - USER", req.user);

      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          {
            MARQUE: brand,
          },
          {
            TAILLE: size,
          },
          {
            ÉTAT: condition,
          },
          {
            COULEUR: color,
          },
          {
            EMPLACEMENT: city,
          },
        ],
        product_image: cloudinaryResponse,
        owner: req.user._id,
      });

      await newOffer.save();

      //   const theOffer = await Offer.findById(newOffer._id).populate("owner");
      await newOffer.populate("owner", "account");

      res.status(201).json(newOffer);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  }
);

router.get("/offers", async (req, res) => {
  try {
    // console.log(req.query);
    // console.log(new RegExp(req.query.title, "i"));

    const filters = {};

    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
    }

    if (req.query.priceMin) {
      filters.product_price = {
        $gte: req.query.priceMin,
      };
      // console.log("filters in if", filters);
    }

    // console.log("test", filters);

    if (req.query.priceMax) {
      if (filters.product_price) {
        filters.product_price.$lte = req.query.priceMax;
      } else {
        filters.product_price = {
          $lte: req.query.priceMax,
        };
      }
    }

    // console.log("filters", filters);

    const sortFilter = {};

    if (req.query.sort === "price-asc") {
      sortFilter.product_price = "ascending";
    } else if (req.query.sort === "price-desc") {
      sortFilter.product_price = "descending";
    }

    // console.log("sortFilter", sortFilter);

    // 5 résultats par page : 1 => 0 ; 2 => 5 ; 3 => 10 ; 4 => 15
    // 3 résultats par page : 1 => 0 ; 2 => 3 ; 3 => 6 ; 4 => 9

    let page = 1;

    if (req.query.page) {
      page = req.query.page;
    }

    const limit = 5;
    const skip = (page - 1) * limit;

    // console.log(skip);

    const offers = await Offer.find(filters)
      .populate("owner", "account")
      // .select("product_name product_price")
      .sort(sortFilter)
      .skip(skip)
      .limit(limit);

    const count = await Offer.countDocuments(filters);

    res.json({ count: count, offers: offers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
