/* ============================================================================
   PRODUCTS
   ============================================================================

   This is the only file you need to edit to add, change, or remove a product.
   You do not need to touch any other file.

   TO ADD A PRODUCT
   ----------------
   Copy one whole block below (from the opening { to the closing },) paste it,
   and fill in the fields. Order does not matter, the site sorts them.

   FIELD BY FIELD
   --------------
   id             Short unique tag. Lowercase, dashes, no spaces. Never reuse one.
   name           What it is called on the site.
   category       One of: "key-holders", "desk", "pop-culture", "custom"
                  (the list of categories lives in CATEGORIES further down)
   price          Write it however you want it shown: "$40" or "$40 each" or "From $35"
   description    One plain sentence. Leave as "" and the site simply omits it.
   printHours     Roughly how long it takes to print. Leave out if you do not know.
   images         A list of photo links. The FIRST one is the one shown on the grid.
                  Leave it as [] and the site draws a placeholder tile instead,
                  so an unphotographed product still looks deliberate.
   marketplaceUrl Link to the Facebook Marketplace listing. Leave as "" when there
                  is no live listing and the button simply will not appear.

   WHERE PHOTOS GO
   ---------------
   Two options, both fine:
     1. Drop the file in the images/ folder next to this file, then write
        "images/porsche-shelf-1.jpg"
     2. Upload to Cloudinary (free tier) and paste the link it gives you.
        Better at 80+ products: it resizes and compresses for you.

   Both work, and you can mix them.

   WHERE THIS CAME FROM
   --------------------
   Every product below is one of your live Facebook Marketplace listings, with the
   price you currently have on it. Where a listing showed a reduced price, the
   lower (current) one was taken. Print times were carried across from your order
   sheet for the pieces that have actually sold, so some have one and some do not.
   Change anything freely, nothing depends on these being right.
   ========================================================================== */

/* ----------------------------------------------------------------------------
   YOU
   ----------------------------------------------------------------------------
   Paste your Facebook Marketplace seller profile link here and every "see my
   listings" button on the site points at it.

   To find it: open Marketplace, go to Your account, then Your listings. Copy the
   address bar. It looks like
   https://www.facebook.com/marketplace/profile/100012345678901/

   Leave it as '' and those buttons quietly fall back to Marketplace search
   instead of sending anyone to a dead link.
   -------------------------------------------------------------------------- */

const SELLER = {
  marketplaceProfileUrl: 'https://www.facebook.com/marketplace/profile/100009784339501/',
  // Optional. Your m.me link if you want "message me" to open a chat directly.
  // Find it at facebook.com/settings, or leave it blank.
  messengerUrl: '',
};

const CATEGORIES = [
  // "all" is added automatically, you do not need to list it.
  // A category with no products in it is hidden, so you can leave these here
  // and "Custom Work" will appear by itself the first time you add one.
  { id: 'key-holders', label: 'Key Holders' },
  { id: 'art', label: 'Art & Sculpture' },
  { id: 'desk', label: 'Desk & Display' },
  { id: 'custom', label: 'Custom Work' },
];

const PRODUCTS = [
  {
    id: 'lexus-lc500-key-holder-hanger',
    name: "Lexus LC500 Key Holder/Hanger",
    category: 'key-holders',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'marshall-key-holder-custom-built',
    name: "Marshall Key Holder (Custom Built)",
    category: 'key-holders',
    price: '$30',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'lamborghini-urus-key-holder',
    name: "Lamborghini Urus Key Holder",
    category: 'key-holders',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'g63-key-holder-key-hanger',
    name: "G63 Key Holder / Key Hanger",
    category: 'key-holders',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'f1-type-spoiler-shelf',
    name: "F1 Type Spoiler Shelf",
    category: 'desk',
    price: '$125',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'ferrari-812-key-holder-chain',
    name: "Ferrari 812 Key Holder / Chain",
    category: 'key-holders',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'porsche-spoiler-shelf-custom-made',
    name: "Porsche Spoiler Shelf (Custom made)",
    category: 'desk',
    price: '$150',
    description: '',
    printHours: 2.5,
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'vintage-cars-key-holder',
    name: "Vintage Cars Key Holder",
    category: 'key-holders',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'cybertruck-key-holder-organizer',
    name: "Cybertruck Key holder & organizer",
    category: 'key-holders',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'poker-series-layered-painting',
    name: "Poker series Layered Painting",
    category: 'art',
    price: '$85',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'custom-lamborghini-svj-key-holder',
    name: "Custom Lamborghini SVJ Key Holder",
    category: 'key-holders',
    price: '$40',
    description: '',
    printHours: 6.7,
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'porsche-918-key-holder',
    name: "Porsche 918 Key Holder",
    category: 'key-holders',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'truck-key-holders-chevy-ford-ram',
    name: "Truck Key Holders (Chevy, Ford, Ram)",
    category: 'key-holders',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'porsche-turbo-key-holders',
    name: "Porsche Turbo Key holders",
    category: 'key-holders',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'f1-key-holder',
    name: "F1 Key Holder",
    category: 'key-holders',
    price: '$45',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'bentley-continental-gt-key-holder',
    name: "Bentley Continental GT Key Holder",
    category: 'key-holders',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'nissan-gtr-key-holder',
    name: "Nissan GTR Key Holder",
    category: 'key-holders',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'audi-ashtray-or-any-custom-brand',
    name: "Audi Ashtray or any Custom brand",
    category: 'desk',
    price: '$15',
    description: '',
    printHours: 1,
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'custom-porsche-wall-frame',
    name: "Custom Porsche Wall Frame",
    category: 'art',
    price: '$60',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'rs6-key-holder',
    name: "RS6 Key Holder",
    category: 'key-holders',
    price: '$40',
    description: '',
    printHours: 7,
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'm3-key-holder',
    name: "M3 Key holder",
    category: 'key-holders',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'ford-bronco-key-holder',
    name: "Ford Bronco Key Holder",
    category: 'key-holders',
    price: '$40',
    description: '',
    printHours: 20,
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'mazda-key-holder-and-hanger',
    name: "Mazda key holder and hanger",
    category: 'key-holders',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'dodge-key-holder-hanger',
    name: "Dodge key holder / hanger",
    category: 'key-holders',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'volkswagen-key-holder-hanger',
    name: "Volkswagen key holder / hanger",
    category: 'key-holders',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'bmw-x3-key-hanger-holder',
    name: "BMW X3 key hanger / holder",
    category: 'key-holders',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'bmw-m4-key-hanger-holder',
    name: "BMW M4 key hanger / holder",
    category: 'key-holders',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'lamborghini-huracan-key-holder-hanger',
    name: "Lamborghini huracan key holder / hanger",
    category: 'key-holders',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'audi-r8-key-holder-hanger',
    name: "Audi R8 key holder / hanger",
    category: 'key-holders',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'mercedes-c63-key-holder',
    name: "Mercedes c63 key holder",
    category: 'key-holders',
    price: '$35',
    description: '',
    printHours: 10,
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'bmw-most-wanted-car-key-hanger-holder',
    name: "BMW most wanted car key hanger holder",
    category: 'key-holders',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'porsche-turbo-key-holder',
    name: "Porsche Turbo Key Holder",
    category: 'key-holders',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'amg-gt-key-holder',
    name: "AMG GT, key holder",
    category: 'key-holders',
    price: '$30',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'batman-layered-sculpture',
    name: "Batman Layered Sculpture",
    category: 'art',
    price: '$20',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'batman-layered-sculpture-2',
    name: "Batman layered sculpture",
    category: 'art',
    price: '$25',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'nintendo-key-holder',
    name: "Nintendo key holder",
    category: 'key-holders',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'mount-everest-layered-painting',
    name: "Mount Everest layered painting",
    category: 'art',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'f1-standing-logo',
    name: "F1 standing logo",
    category: 'desk',
    price: '$25',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'wolverine-layered-sculpture-painting',
    name: "Wolverine layered sculpture painting",
    category: 'art',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'minimalist-face-sculpture',
    name: "Minimalist face sculpture",
    category: 'art',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'black-panther-full-layered-sculpture',
    name: "Black panther full layered sculpture",
    category: 'art',
    price: '$30',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'pokemon-layered-sculpture',
    name: "Pokemon layered sculpture",
    category: 'art',
    price: '$30',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'porsche-spoiler-shelf',
    name: "Porsche spoiler shelf",
    category: 'desk',
    price: '$150',
    description: '',
    printHours: 2.5,
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'porsche-3d-frame',
    name: "Porsche 3d frame",
    category: 'art',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'porsche-keychain',
    name: "Porsche keychain",
    category: 'key-holders',
    price: '$5',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'ferrari-key-holder',
    name: "Ferrari key holder",
    category: 'key-holders',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'darthvader-layered-sculpture',
    name: "Darthvader layered sculpture",
    category: 'art',
    price: '$35',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'supra-key-holder',
    name: "Supra key holder",
    category: 'key-holders',
    price: '$30',
    description: '',
    printHours: 5.5,
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'shelby-key-holder',
    name: "Shelby key holder",
    category: 'key-holders',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'daredevil-layered-structure',
    name: "Daredevil layered structure",
    category: 'art',
    price: '$35',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'toyota-supra-key-holder',
    name: "Toyota supra key holder",
    category: 'key-holders',
    price: '$15',
    description: '',
    printHours: 5.5,
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'lighting-mcqueen-key-holder',
    name: "Lighting McQueen key holder",
    category: 'key-holders',
    price: '$40',
    description: '',
    printHours: 5.5,
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'delorean-back-to-the-future-key-holder',
    name: "DeLorean, back to the future key holder",
    category: 'key-holders',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'poker-layered-structure-each-30',
    name: "Poker layered structure (each $30)",
    category: 'art',
    price: '$30',
    description: '',
    printHours: 10,
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'lamborghini-countach-key-holder',
    name: "Lamborghini countach key holder",
    category: 'key-holders',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'porsche-rs-key-holder',
    name: "Porsche RS key holder",
    category: 'key-holders',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'key-holder',
    name: "Key holder",
    category: 'key-holders',
    price: '$40',
    description: '',
    printHours: 6.7,
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'gt-key-holder',
    name: "GT key holder",
    category: 'key-holders',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'bmw-key-holder',
    name: "BMW key holder",
    category: 'key-holders',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'gtr-key-holder',
    name: "GTR, key holder",
    category: 'key-holders',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'volks-beattle-key-holder',
    name: "Volks beattle key holder",
    category: 'key-holders',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'nissan-gtr-key-holder-2',
    name: "Nissan GTR key holder",
    category: 'key-holders',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'batmobile-key-holder',
    name: "Batmobile Key holder",
    category: 'key-holders',
    price: '$40',
    description: '',
    printHours: 10,
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'toyota-supra-key-holder-2',
    name: "Toyota Supra Key Holder",
    category: 'key-holders',
    price: '$40',
    description: '',
    printHours: 5.5,
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'jurassic-park-entrance-statue',
    name: "Jurassic park entrance statue",
    category: 'art',
    price: '$40',
    description: '',
    printHours: 6.3,
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'soccer-jersey-frames',
    name: "Soccer jersey frames",
    category: 'art',
    price: '$40',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'darthvader-sculpture-painting',
    name: "Darthvader Sculpture painting",
    category: 'art',
    price: '$35',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'sculpture-paintings',
    name: "Sculpture paintings",
    category: 'art',
    price: '$35',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
  {
    id: 'queen-sculpture-painting',
    name: "Queen sculpture painting",
    category: 'art',
    price: '$35',
    description: '',
    images: [],
    marketplaceUrl: '',
  },
];

/* ----------------------------------------------------------------------------
   LIVE DATA (optional, off by default)
   ----------------------------------------------------------------------------
   Leave SHEET_CSV_URL as "" and the site uses the list above, which works
   offline and needs no internet.

   Set it to a published Google Sheet CSV link and the site reads that instead,
   so editing a row updates the site without touching any file. The sheet needs
   a header row with these column names, spelled exactly:

     id | name | category | price | description | printHours | images | marketplaceUrl

   Put several photo links in one images cell by separating them with commas.
   If the sheet cannot be reached, the site quietly falls back to the list above
   rather than showing an empty page.
   -------------------------------------------------------------------------- */

const SHEET_CSV_URL = '';
