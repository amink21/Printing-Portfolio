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
   listed         The date you listed it, as YYYY-MM-DD. Drives the newest-first
                  sort and the "Just listed" badge, which shows for 14 days.
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

/* ----------------------------------------------------------------------------
   FILAMENT COLOURS
   ----------------------------------------------------------------------------
   The colours you can print in. These show on a product as "Available in", so a
   buyer knows they are not stuck with whatever colour the photo happens to be.

   Add, remove or rename freely. The hex only draws the little dot, so pick
   whatever looks closest to the real spool.

   To say one product comes in only some of these, give that product a colors
   list naming them:  colors: ['Black', 'Red'].  A product with no colors list
   offers everything below.
   -------------------------------------------------------------------------- */

const FILAMENT_COLORS = [
  { name: 'Black', hex: '#1c1c1e' },
  { name: 'White', hex: '#f2f2f4' },
  { name: 'Grey', hex: '#8a8a91' },
  { name: 'Red', hex: '#d62828' },
  { name: 'Blue', hex: '#1f5fd6' },
  { name: 'Green', hex: '#1f9d55' },
  { name: 'Orange', hex: '#f26b21' },
  { name: 'Yellow', hex: '#f5c518' },
  { name: 'Purple', hex: '#7b3fe4' },
  { name: 'Silver', hex: '#b9bcc4' },
  { name: 'Gold', hex: '#c9a227' },
];

/* ----------------------------------------------------------------------------
   FEATURED
   ----------------------------------------------------------------------------
   The pieces in the showcase at the top of the page.

   Leave it empty and the site picks for you: photographed pieces first, then the
   most recently listed. Put ids in it to take control, for example
   FEATURED = ['porsche-gt3-rs-key-holder', 'batman-layered-sculpture'].
   -------------------------------------------------------------------------- */

const FEATURED = [];

const PRODUCTS = [
  {
    id: 'lexus-lc500-key-holder-hanger',
    name: "Lexus LC500 Key Holder/Hanger",
    category: 'key-holders',
    price: "$40",
    listed: '2026-09-15',
    description: "",
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789685871/kad-prints/xunrlshirywupryq557h.png", "https://res.cloudinary.com/uhuni38t/image/upload/v1789685872/kad-prints/of2jkotlcabwfr6ffqvn.png", "https://res.cloudinary.com/uhuni38t/image/upload/v1789685873/kad-prints/yx35qukfyxuytvdnxgaq.png"],
    marketplaceUrl: "",
  },
  {
    id: 'marshall-key-holder-custom-built',
    name: "Marshall Key Holder (Custom Built)",
    category: 'key-holders',
    price: "$30",
    listed: '2026-09-11',
    description: "",
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789685942/kad-prints/ct4viwhwf4oklqlohq6k.png", "https://res.cloudinary.com/uhuni38t/image/upload/v1789685943/kad-prints/mljjddqfwrbd7ecixj5f.png"],
    marketplaceUrl: "",
  },
  {
    id: 'lamborghini-urus-key-holder',
    name: "Lamborghini Urus Key Holder",
    category: 'key-holders',
    price: "$40",
    listed: '2026-09-10',
    description: "",
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789685957/kad-prints/wfr5au2bfmsz41fcopwa.jpg", "https://res.cloudinary.com/uhuni38t/image/upload/v1789685959/kad-prints/vzslpakyh152sedsoker.jpg"],
    marketplaceUrl: "",
  },
  {
    id: 'g63-key-holder-key-hanger',
    name: "G63 Key Holder / Key Hanger",
    category: 'key-holders',
    price: "$40",
    listed: '2026-09-08',
    description: "",
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789685973/kad-prints/ynoqesqhidjmoaugclc7.png", "https://res.cloudinary.com/uhuni38t/image/upload/v1789685975/kad-prints/egri0yvbxikrggbj2tls.jpg", "https://res.cloudinary.com/uhuni38t/image/upload/v1789685976/kad-prints/zqvbvtbkswfxk2ppx3i8.jpg"],
    marketplaceUrl: "",
  },
  {
    id: 'f1-type-spoiler-shelf',
    name: "F1 Type Spoiler Shelf",
    category: 'desk',
    price: "$125",
    listed: '2026-09-07',
    description: "",
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789685993/kad-prints/enueszyxuoqyvkx5fghm.png", "https://res.cloudinary.com/uhuni38t/image/upload/v1789685995/kad-prints/atoixrc6yu64xfcqizbz.png", "https://res.cloudinary.com/uhuni38t/image/upload/v1789685995/kad-prints/aj6kahsrtfljwihvinsu.png"],
    marketplaceUrl: "",
  },
  {
    id: 'ferrari-812-key-holder-chain',
    name: "Ferrari 812 Key Holder / Chain",
    category: 'key-holders',
    price: "$40",
    listed: '2026-09-06',
    description: "",
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789686017/kad-prints/g4bhhb7kxrluvvsernld.png", "https://res.cloudinary.com/uhuni38t/image/upload/v1789686018/kad-prints/c9ksnokj8lrnkqba18ak.png"],
    marketplaceUrl: "",
  },
  {
    id: 'porsche-spoiler-shelf-custom-made',
    name: "Porsche Spoiler Shelf (Custom made)",
    category: 'desk',
    price: "$150",
    listed: '2026-09-06',
    description: "",
    printHours: 2.5,
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789686051/kad-prints/onurkpiche6i6bsuy37l.jpg", "https://res.cloudinary.com/uhuni38t/image/upload/v1789686052/kad-prints/l6qixew0as4ibizye61w.png"],
    marketplaceUrl: "",
  },
  {
    id: 'vintage-cars-key-holder',
    name: "Vintage Cars Key Holder",
    category: 'key-holders',
    price: "$40",
    listed: '2026-09-06',
    description: "",
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789686069/kad-prints/dmeoxshf0zkiqgu2ab1a.png", "https://res.cloudinary.com/uhuni38t/image/upload/v1789686070/kad-prints/ng5agxqlvhndhb8f3iws.png", "https://res.cloudinary.com/uhuni38t/image/upload/v1789686070/kad-prints/spqj0yxisotyhyo4egut.png", "https://res.cloudinary.com/uhuni38t/image/upload/v1789686071/kad-prints/vxp56tudl230kvzjjj3b.jpg"],
    marketplaceUrl: "",
  },
  {
    id: 'cybertruck-key-holder-organizer',
    name: "Cybertruck Key holder & organizer",
    category: 'key-holders',
    price: "$40",
    listed: '2026-09-04',
    description: "",
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789686088/kad-prints/t259nh3wapuawy3xgu4n.jpg", "https://res.cloudinary.com/uhuni38t/image/upload/v1789686089/kad-prints/oslsnruokerhirak3blh.jpg"],
    marketplaceUrl: "",
  },
  {
    id: 'poker-series-layered-painting',
    name: "Poker series Layered Painting",
    category: 'art',
    price: "$85",
    listed: '2026-09-02',
    description: "",
    images: [],
    marketplaceUrl: "",
  },
  {
    id: 'custom-lamborghini-svj-key-holder',
    name: "Custom Lamborghini SVJ Key Holder",
    category: 'key-holders',
    price: "$40",
    listed: '2026-09-02',
    description: "",
    printHours: 6.7,
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789686142/kad-prints/lpyxokhcd7rfz9mv6vdo.jpg", "https://res.cloudinary.com/uhuni38t/image/upload/v1789686143/kad-prints/kxgo62guu4nvofwxa3sa.jpg"],
    marketplaceUrl: "",
  },
  {
    id: 'porsche-918-key-holder',
    name: "Porsche 918 Key Holder",
    category: 'key-holders',
    price: "$40",
    listed: '2026-09-02',
    description: "",
    images: [],
    marketplaceUrl: "",
  },
  {
    id: 'truck-key-holders-chevy-ford-ram',
    name: "Truck Key Holders (Chevy, Ford, Ram)",
    category: 'key-holders',
    price: "$40",
    listed: '2026-09-02',
    description: "",
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789686164/kad-prints/f2dbpkuhgz9tda00uggb.png", "https://res.cloudinary.com/uhuni38t/image/upload/v1789686165/kad-prints/oqvzmzx6cphfhss6gtac.png", "https://res.cloudinary.com/uhuni38t/image/upload/v1789686166/kad-prints/aeewpdzriurm28pxdxtq.png"],
    marketplaceUrl: "",
  },
  {
    id: 'porsche-turbo-key-holders',
    name: "Porsche Turbo Key holders",
    category: 'key-holders',
    price: "$40",
    listed: '2026-09-02',
    description: "",
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789686180/kad-prints/hx0tcgmhw0jc24q3hdqd.png", "https://res.cloudinary.com/uhuni38t/image/upload/v1789686180/kad-prints/phn1nlxxh58xzbjk01bf.jpg"],
    marketplaceUrl: "",
  },
  {
    id: 'f1-key-holder',
    name: "F1 Key Holder",
    category: 'key-holders',
    price: "$45",
    listed: '2026-09-02',
    description: "",
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789686200/kad-prints/ar8nvmvzao0g7czeixa1.png"],
    marketplaceUrl: "",
  },
  {
    id: 'bentley-continental-gt-key-holder',
    name: "Bentley Continental GT Key Holder",
    category: 'key-holders',
    price: "$40",
    listed: '2026-09-02',
    description: "",
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789686212/kad-prints/rj0kdevdt3qpq6f4k7br.jpg"],
    marketplaceUrl: "",
  },
  {
    id: 'nissan-gtr-key-holder',
    name: "Nissan GTR Key Holder",
    category: 'key-holders',
    price: "$40",
    listed: '2026-09-02',
    description: "",
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789686226/kad-prints/junfzmyzgi2jfksesxcv.jpg", "https://res.cloudinary.com/uhuni38t/image/upload/v1789686227/kad-prints/vng2gvz1vst7bt6wgad9.png"],
    marketplaceUrl: "",
  },
  {
    id: 'custom-porsche-wall-frame',
    name: "Custom Porsche Wall Frame",
    category: 'art',
    price: "$60",
    listed: '2026-09-02',
    description: "",
    images: [],
    marketplaceUrl: "",
  },
  {
    id: 'rs6-key-holder',
    name: "RS6 Key Holder",
    category: 'key-holders',
    price: "$40",
    listed: '2026-08-26',
    description: "",
    printHours: 7,
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789689586/kad-prints/nadj9ig1l6ksnby08id7.png", "https://res.cloudinary.com/uhuni38t/image/upload/v1789689587/kad-prints/nm9xufh566snfigdxzza.png"],
    marketplaceUrl: "",
  },
  {
    id: 'm3-key-holder',
    name: "M3 Key holder",
    category: 'key-holders',
    price: "$40",
    listed: '2026-08-26',
    description: "",
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789686272/kad-prints/mek1b5j2qqpkqftprrsq.png"],
    marketplaceUrl: "",
  },
  {
    id: 'ford-bronco-key-holder',
    name: "Ford Bronco Key Holder",
    category: 'key-holders',
    price: "$40",
    listed: '2026-08-24',
    description: "",
    printHours: 20,
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789689607/kad-prints/i49komjivj3me5qncjr0.jpg"],
    marketplaceUrl: "",
  },
  {
    id: 'mazda-key-holder-and-hanger',
    name: "Mazda key holder and hanger",
    category: 'key-holders',
    price: "$40",
    listed: '2026-08-24',
    description: "",
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789689630/kad-prints/vcpmswhnjwsmrjfbj0qj.jpg", "https://res.cloudinary.com/uhuni38t/image/upload/v1789689631/kad-prints/ad2r8hxemjx55ldpogkp.jpg"],
    marketplaceUrl: "",
  },
  {
    id: 'dodge-key-holder-hanger',
    name: "Dodge key holder / hanger",
    category: 'key-holders',
    price: "$40",
    listed: '2026-08-24',
    description: "",
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789689658/kad-prints/twxhanp3ec13ppk0hl56.png", "https://res.cloudinary.com/uhuni38t/image/upload/v1789689658/kad-prints/e9fff2a0mxn9vljatryp.png"],
    marketplaceUrl: "",
  },
  {
    id: 'volkswagen-key-holder-hanger',
    name: "Volkswagen key holder / hanger",
    category: 'key-holders',
    price: "$40",
    listed: '2026-08-24',
    description: "",
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789689675/kad-prints/piwzsdpjv48i1zwlkcf2.png"],
    marketplaceUrl: "",
  },
  {
    id: 'bmw-x3-key-hanger-holder',
    name: "BMW X3 key hanger / holder",
    category: 'key-holders',
    price: "$40",
    listed: '2026-08-24',
    description: "",
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789689697/kad-prints/tmrfesvcwyy4lsnrlcqa.png"],
    marketplaceUrl: "",
  },
  {
    id: 'bmw-m4-key-hanger-holder',
    name: "BMW M4 key hanger / holder",
    category: 'key-holders',
    price: "$40",
    listed: '2026-08-24',
    description: "",
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789689708/kad-prints/g4rghu9bnpnfzqr2fso0.png", "https://res.cloudinary.com/uhuni38t/image/upload/v1789689709/kad-prints/yetstloarx9ybcn8eitg.jpg"],
    marketplaceUrl: "",
  },
  {
    id: 'lamborghini-huracan-key-holder-hanger',
    name: "Lamborghini huracan key holder / hanger",
    category: 'key-holders',
    price: "$40",
    listed: '2026-08-24',
    description: "",
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789689728/kad-prints/asvgxvxbwm6auqpqhcdn.png", "https://res.cloudinary.com/uhuni38t/image/upload/v1789689729/kad-prints/cnw9soesdjaops2ofb0m.png"],
    marketplaceUrl: "",
  },
  {
    id: 'audi-r8-key-holder-hanger',
    name: "Audi R8 key holder / hanger",
    category: 'key-holders',
    price: "$40",
    listed: '2026-08-24',
    description: "",
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789689752/kad-prints/zfdluusjum0yd12rmsrm.png", "https://res.cloudinary.com/uhuni38t/image/upload/v1789689753/kad-prints/rky6yunz8evwbr2nr27k.png", "https://res.cloudinary.com/uhuni38t/image/upload/v1789689754/kad-prints/goiw19g2voo6inihp407.png", "https://res.cloudinary.com/uhuni38t/image/upload/v1789689755/kad-prints/hqxtco10men9l6unp59r.png"],
    marketplaceUrl: "",
  },
  {
    id: 'mercedes-c63-key-holder',
    name: "Mercedes c63 key holder",
    category: 'key-holders',
    price: "$35",
    listed: '2026-08-24',
    description: "",
    printHours: 10,
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789689795/kad-prints/sc4li8fx2ymlapseradb.jpg", "https://res.cloudinary.com/uhuni38t/image/upload/v1789689796/kad-prints/oax6pzcdgj71c0ygv9rb.png"],
    marketplaceUrl: "",
  },
  {
    id: 'bmw-most-wanted-car-key-hanger-holder',
    name: "BMW most wanted car key hanger holder",
    category: 'key-holders',
    price: "$40",
    listed: '2026-08-24',
    description: "",
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789689821/kad-prints/nlvn9ytcmgatkrsgymlv.png", "https://res.cloudinary.com/uhuni38t/image/upload/v1789689822/kad-prints/tdo6vw8sp9k4ebhqjv8y.jpg"],
    marketplaceUrl: "",
  },
  {
    id: 'porsche-turbo-key-holder',
    name: "Porsche Turbo Key Holder",
    category: 'key-holders',
    price: "$40",
    listed: '2026-08-24',
    description: "",
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789689841/kad-prints/sszo5pqnrovakxwylk1i.png", "https://res.cloudinary.com/uhuni38t/image/upload/v1789689842/kad-prints/zwkdojmnhxlpcjydursj.png"],
    marketplaceUrl: "",
  },
  {
    id: 'amg-gt-key-holder',
    name: "AMG GT, key holder",
    category: 'key-holders',
    price: "$30",
    listed: '2026-08-24',
    description: "",
    images: [],
    marketplaceUrl: "",
  },
  {
    id: 'batman-layered-sculpture-2',
    name: "Batman layered sculpture",
    category: 'art',
    price: "$25",
    listed: '2026-08-06',
    description: "",
    images: [],
    marketplaceUrl: "",
  },
  {
    id: 'nintendo-key-holder',
    name: "Nintendo key holder",
    category: 'key-holders',
    price: "$40",
    listed: '2026-06-19',
    description: "",
    images: [],
    marketplaceUrl: "",
  },
  {
    id: 'mount-everest-layered-painting',
    name: "Mount Everest layered painting",
    category: 'art',
    price: "$40",
    listed: '2026-06-19',
    description: "",
    images: [],
    marketplaceUrl: "",
  },
  {
    id: 'f1-standing-logo',
    name: "F1 standing logo",
    category: 'desk',
    price: "$25",
    listed: '2026-06-19',
    description: "",
    images: [],
    marketplaceUrl: "",
  },
  {
    id: 'wolverine-layered-sculpture-painting',
    name: "Wolverine layered sculpture painting",
    category: 'art',
    price: "$40",
    listed: '2026-06-19',
    description: "",
    images: [],
    marketplaceUrl: "",
  },
  {
    id: 'minimalist-face-sculpture',
    name: "Minimalist face sculpture",
    category: 'art',
    price: "$40",
    listed: '2026-06-19',
    description: "",
    images: [],
    marketplaceUrl: "",
  },
  {
    id: 'black-panther-full-layered-sculpture',
    name: "Black panther full layered sculpture",
    category: 'art',
    price: "$30",
    listed: '2026-06-19',
    description: "",
    images: [],
    marketplaceUrl: "",
  },
  {
    id: 'pokemon-layered-sculpture',
    name: "Pokemon layered sculpture",
    category: 'art',
    price: "$30",
    listed: '2026-06-18',
    description: "",
    images: [],
    marketplaceUrl: "",
  },
  {
    id: 'porsche-3d-frame',
    name: "Porsche 3d frame",
    category: 'art',
    price: "$40",
    listed: '2026-06-18',
    description: "",
    images: [],
    marketplaceUrl: "",
  },
  {
    id: 'porsche-keychain',
    name: "Porsche keychain",
    category: 'key-holders',
    price: "$5",
    listed: '2026-06-18',
    description: "",
    images: [],
    marketplaceUrl: "",
  },
  {
    id: 'ferrari-key-holder',
    name: "Ferrari key holder",
    category: 'key-holders',
    price: "$40",
    listed: '2026-06-18',
    description: "",
    images: [],
    marketplaceUrl: "",
  },
  {
    id: 'darthvader-layered-sculpture',
    name: "Darthvader layered sculpture",
    category: 'art',
    price: "$35",
    listed: '2026-06-18',
    description: "",
    images: [],
    marketplaceUrl: "",
  },
  {
    id: 'supra-key-holder',
    name: "Supra key holder",
    category: 'key-holders',
    price: "$30",
    listed: '2026-06-18',
    description: "",
    printHours: 5.5,
    images: [],
    marketplaceUrl: "",
  },
  {
    id: 'shelby-key-holder',
    name: "Shelby key holder",
    category: 'key-holders',
    price: "$40",
    listed: '2026-06-18',
    description: "",
    images: [],
    marketplaceUrl: "",
  },
  {
    id: 'daredevil-layered-structure',
    name: "Daredevil layered structure",
    category: 'art',
    price: "$35",
    listed: '2026-06-18',
    description: "",
    images: [],
    marketplaceUrl: "",
  },
  {
    id: 'toyota-supra-key-holder',
    name: "Toyota supra key holder",
    category: 'key-holders',
    price: "$15",
    listed: '2026-06-18',
    description: "",
    printHours: 5.5,
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789690430/kad-prints/nd01qsuzm44v8aioxpf2.png", "https://res.cloudinary.com/uhuni38t/image/upload/v1789690431/kad-prints/t26kupppomntnvitzqel.jpg"],
    marketplaceUrl: "",
  },
  {
    id: 'lighting-mcqueen-key-holder',
    name: "Lighting McQueen key holder",
    category: 'key-holders',
    price: "$40",
    listed: '2026-06-18',
    description: "",
    printHours: 5.5,
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789690328/kad-prints/m4mamnfy9lpren8dopmw.jpg", "https://res.cloudinary.com/uhuni38t/image/upload/v1789690329/kad-prints/tesju5472uos07il8g71.jpg"],
    marketplaceUrl: "",
  },
  {
    id: 'delorean-back-to-the-future-key-holder',
    name: "DeLorean, back to the future key holder",
    category: 'key-holders',
    price: "$40",
    listed: '2026-06-18',
    description: "",
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789690293/kad-prints/nhivqvlgxsnoq1go4wua.jpg", "https://res.cloudinary.com/uhuni38t/image/upload/v1789690294/kad-prints/xt64gcmnmth64mycyjls.jpg"],
    marketplaceUrl: "",
  },
  {
    id: 'poker-layered-structure-each-30',
    name: "Poker layered structure (each $30)",
    category: 'art',
    price: "$30",
    listed: '2026-06-18',
    description: "",
    printHours: 10,
    images: [],
    marketplaceUrl: "",
  },
  {
    id: 'lamborghini-countach-key-holder',
    name: "Lamborghini countach key holder",
    category: 'key-holders',
    price: "$40",
    listed: '2026-06-18',
    description: "",
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789690239/kad-prints/e5leilzv5u2jrxcguzl7.jpg", "https://res.cloudinary.com/uhuni38t/image/upload/v1789690240/kad-prints/zojcrqrqt7ltemcazmec.jpg"],
    marketplaceUrl: "",
  },
  {
    id: 'porsche-rs-key-holder',
    name: "Porsche RS key holder",
    category: 'key-holders',
    price: "$40",
    listed: '2026-06-18',
    description: "",
    images: [],
    marketplaceUrl: "",
  },
  {
    id: 'key-holder',
    name: "Key holder",
    category: 'key-holders',
    price: "$40",
    listed: '2026-06-16',
    description: "",
    printHours: 6.7,
    images: [],
    marketplaceUrl: "",
  },
  {
    id: 'gt-key-holder',
    name: "GT key holder",
    category: 'key-holders',
    price: "$40",
    listed: '2026-06-16',
    description: "",
    images: [],
    marketplaceUrl: "",
  },
  {
    id: 'bmw-key-holder',
    name: "BMW key holder",
    category: 'key-holders',
    price: "$40",
    listed: '2026-06-16',
    description: "",
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789690192/kad-prints/hwf6g4uchqmazvkf9drv.jpg"],
    marketplaceUrl: "",
  },
  {
    id: 'gtr-key-holder',
    name: "GTR, key holder",
    category: 'key-holders',
    price: "$40",
    listed: '2026-06-16',
    description: "",
    images: [],
    marketplaceUrl: "",
  },
  {
    id: 'volks-beattle-key-holder',
    name: "Volks beattle key holder",
    category: 'key-holders',
    price: "$40",
    listed: '2026-06-16',
    description: "",
    images: [],
    marketplaceUrl: "",
  },
  {
    id: 'nissan-gtr-key-holder-2',
    name: "Nissan GTR key holder",
    category: 'key-holders',
    price: "$40",
    listed: '2026-06-16',
    description: "",
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789690117/kad-prints/gaohxcztfvhiijmw3msg.jpg"],
    marketplaceUrl: "",
  },
  {
    id: 'batmobile-key-holder',
    name: "Batmobile Key holder",
    category: 'key-holders',
    price: "$40",
    listed: '2026-06-16',
    description: "",
    printHours: 10,
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789690089/kad-prints/byvztpymlm5sjetli0mm.png"],
    marketplaceUrl: "",
  },
  {
    id: 'toyota-supra-key-holder-2',
    name: "Toyota Supra Key Holder",
    category: 'key-holders',
    price: "$40",
    listed: '2026-06-11',
    description: "",
    printHours: 5.5,
    images: ["https://res.cloudinary.com/uhuni38t/image/upload/v1789690076/kad-prints/pwkealb05y2uvxngzc6n.jpg", "https://res.cloudinary.com/uhuni38t/image/upload/v1789690077/kad-prints/khzvopxguuarmcq6ofma.jpg"],
    marketplaceUrl: "",
  },
  {
    id: 'jurassic-park-entrance-statue',
    name: "Jurassic park entrance statue",
    category: 'art',
    price: "$40",
    listed: '2026-06-11',
    description: "",
    printHours: 6.3,
    images: [],
    marketplaceUrl: "",
  },
  {
    id: 'soccer-jersey-frames',
    name: "Soccer jersey frames",
    category: 'art',
    price: "$40",
    listed: '2026-06-06',
    description: "",
    images: [],
    marketplaceUrl: "",
  },
  {
    id: 'darthvader-sculpture-painting',
    name: "Darthvader Sculpture painting",
    category: 'art',
    price: "$35",
    listed: '2026-06-06',
    description: "",
    images: [],
    marketplaceUrl: "",
  },
  {
    id: 'sculpture-paintings',
    name: "Sculpture paintings",
    category: 'art',
    price: "$35",
    listed: '2026-06-06',
    description: "",
    images: [],
    marketplaceUrl: "",
  },
  {
    id: 'queen-sculpture-painting',
    name: "Queen sculpture painting",
    category: 'art',
    price: "$35",
    listed: '2026-06-06',
    description: "",
    images: [],
    marketplaceUrl: "",
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

/* ----------------------------------------------------------------------------
   Lets the server read this same file when it renders a product page for a link
   preview or for Google. In a browser this block does nothing at all.
   -------------------------------------------------------------------------- */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PRODUCTS, CATEGORIES, SELLER, FILAMENT_COLORS, FEATURED };
}
