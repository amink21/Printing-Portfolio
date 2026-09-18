# Kad Prints

A browsable catalog of the 3D printed work. Not a shop: there is no cart and no
payment. People browse here, then buy through Facebook Marketplace.

Plain HTML, CSS and JavaScript. No build step, no framework, no server. Open
`index.html` in a browser and it runs.

## Linking your Marketplace profile

Open `products.js` and paste your seller profile link into `SELLER`:

```js
const SELLER = {
  marketplaceProfileUrl: 'https://www.facebook.com/marketplace/profile/1000.../',
  messengerUrl: '',
};
```

Find it by opening Marketplace, going to Your account, then Your listings, and
copying the address bar.

That one value drives the Listings link in the header, the footer link, the
contact button (whose label becomes "See all my listings"), and the fallback
button inside any product that has no listing of its own. Leave it blank and all
of those quietly point at Marketplace search instead of at a dead link.

## The editor at /admin

Open `/admin/` on the site (or `http://localhost:4173/admin/` locally), type the
password from `admin/config.js`, and you get a form for every product: name,
price, category, link id, listing date, print hours, description, Marketplace
link, and photos.

When you are done, hit **Download products.js**, then replace `products.js` in
GitHub with the file your browser saved and commit. The site updates itself.

### Save and publish

On Vercel the editor has a real **Save and publish** button. It posts the catalog
to `api/save.js`, which checks the password and commits `products.js` to GitHub
for you. Vercel sees the commit and redeploys, so the change is live in about half
a minute, with full version history behind it. There is nothing to download and
nothing to do in GitHub.

Three environment variables make that work, under Vercel > Project > Settings >
Environment Variables:

```
ADMIN_PASSWORD   what you type in the editor
GITHUB_TOKEN     fine-grained token, Contents: Read and write, this repo only
GITHUB_REPO      optional, defaults to amink21/Printing-Portfolio
```

The token never leaves the server, and the password is checked there too, so
neither is in anything the browser downloads.

### Running it locally

Off a plain local server there is no `/api`, so the editor notices and falls back:
it uses the password in `admin/config.js` and the button becomes **Download
products.js**, which you then commit yourself. Same editor, same data, just the
manual route.

That fallback is also why the password in `config.js` is acceptable: in that mode
the editor cannot reach the live site at all. Do not reuse a password you use
elsewhere.

Your work is saved in the browser as you type, so closing the tab by accident
does not lose it. "Discard my changes" throws the draft away and reloads the
published catalog.

The editor also refuses to export two products sharing a link id, since that
would break links you had already sent.

## Adding a product

Open `products.js`. Copy one block, paste it, fill it in. That is the whole job,
and it is the only file you need to touch.

```js
{
  id: 'audi-rs3-key-holder',          // unique, lowercase, dashes
  name: 'Audi RS3 Key Holder',
  category: 'key-holders',            // see the list at the top of products.js
  price: '$40',
  description: 'One plain sentence.', // leave as '' and it is simply omitted
  printHours: 7,
  images: ['images/rs3-1.jpg'],       // first one shows on the grid
  marketplaceUrl: 'https://...',      // leave as '' and no button appears
},
```

Nothing breaks if a field is empty. A product with no photo gets a designed
placeholder tile instead of a broken image box, and a product with no Marketplace
link simply does not show the button.

## Photos

Two options, and you can mix them:

1. **Drop files in `images/`** and write `images/whatever.jpg`.
2. **Cloudinary free tier.** Upload there, paste the link it gives you. Better once
   you pass thirty or forty products, since it resizes and compresses for you and
   serves from a CDN. Your repo stays small.

Square photos look best. The grid crops to a square, so anything roughly square
avoids surprises.

Every product currently has an empty `images` list, so the whole site is showing
placeholders. They are built to look deliberate rather than broken, but they are
placeholders. The site gets good when the real photos land.

Do not attach them one at a time. See **Photos, the fast way** below: drop the
whole folder into the editor and let the filenames do the work.

The showcase at the top of the page stays hidden until at least two pieces have
photos, because a screen-sized placeholder is worse than no showcase at all. It
appears on its own once they do.

## Making it update itself

`products.js` is a file you edit. If you would rather edit a spreadsheet and have
the site follow, put a published Google Sheet CSV link in `SHEET_CSV_URL` at the
bottom of `products.js`. Give the sheet these column headings, spelled exactly:

```
id | name | category | price | description | printHours | images | marketplaceUrl
```

Several photos in one cell: separate the links with commas. If the sheet cannot be
reached the site falls back to the list in `products.js` rather than going blank.

### On reading Facebook Marketplace directly

It cannot be done, and it is worth knowing why rather than trying. Your selling
page lives behind your login, and there is no public API for an individual
seller's Marketplace listings. The Commerce API covers business catalogs in
Commerce Manager, which is a different thing. Anything that "reads your listings"
would have to hold your Facebook session and scrape a page that is auth-walled and
bot-detected, which breaks their terms, breaks whenever they change their markup,
and puts the account at risk. The sheet above gets you the same live-updating
result without any of that.

## Publishing it

Static files, so anywhere works and all of these are free:

- **Netlify or Vercel:** drag the folder onto their dashboard. Done.
- **GitHub Pages:** push the folder, turn on Pages in the repo settings.

No build command and no environment variables. Whatever host you pick, you are
uploading these files as they are.

## What is in here

```
index.html          the page
styles.css          all styling, design tokens at the top
app.js              filtering, search, the detail view, the saved list
products.js         YOUR DATA. the only file you need to edit
vercel.json         the /p/<id> and /sitemap.xml routes, and cache headers
robots.txt          keeps crawlers out of /admin and /api
favicon.svg         the tab icon. favicon.ico and apple-touch-icon.png match it

admin/              the editor. index.html, admin.css, admin.js, config.js
                    (bulk photos, Marketplace import, description drafts)
api/save.js         commits products.js to GitHub when you press publish
api/product.js      renders /p/<id> for link previews and for Google
api/sitemap.js      builds sitemap.xml from products.js

fonts/              Manrope, self-hosted so nothing calls out to Google
images/             put product photos here if you are not using Cloudinary
```

## Design notes: the look

Light, calm, and built around the two references: the roominess and type scale of
an Apple product page, with the card mechanics of Facebook Marketplace. White
cards on a soft grey ground, round filter chips, price set bold above the product
name the way a Marketplace tile does it.

One accent, `#0866ff`, and it only ever appears on things you can act on:
buttons, the selected chip, the focus ring. Prices and headings stay near-black.
Colour on the buttons and nowhere else is what keeps a catalog calm while the
photos do the talking.

Categories came from the real catalog rather than from guesswork. Of the
sixty-nine pieces, forty-six are car key holders, eighteen are sculptures and
paintings, and five are desk pieces, which is why those are the filters that
appear. A category with nothing in it is never shown, so the filter row can
never offer a dead end.

The prices and print times in `products.js` are real, taken from what these
actually sold for in the order sheet. Change any of them freely.

## Sharing one product

Every product has its own address. Open a piece and the bar reads
`.../#lexus-lc500-key-holder-hanger`, so you can send one item into a chat rather
than telling someone to scroll. Opening that link goes straight to the product,
and the back button closes it the way people expect.

The id is the part after the `#`, and it comes from `products.js`. Change an id
and any link you already sent stops working, so it is worth leaving them alone
once a product has been shared.

## Sorting and the "Just listed" flag

The sort control does newest first (the default), price low to high, and price
high to low. Newest uses the `listed` date on each product.

Anything listed in the last 14 days gets a "Just listed" flag on its tile. It
appears and disappears by itself as those dates age, so there is nothing to turn
off later.

## Importing your Marketplace listings

Facebook will give you your own listings as a file, and the editor can read it.

**Getting the file.** On Facebook: Settings > Your information > Download your
information. Tick **Marketplace**, choose **HTML** rather than JSON, and request
it. Facebook takes a while and then emails you a download. Inside it, the file
you want is `your_marketplace_items.html`.

**Using it.** In the editor, press **Import from Marketplace** and drop that file
on the box. Nothing is uploaded: the file is read in your browser.

It sorts every listing into three piles and shows you all of them before anything
changes:

- **New pieces to add** — printed things the catalog does not have.
- **Already here** — a piece the catalog has, where the export fills in a gap,
  usually the description you already wrote on Facebook.
- **Left out** — resale items like chargers and watches, and listings where there
  is nothing to add. Untick and tick anything you disagree with.

The same piece cross-posted to four groups arrives four times in the export. Those
are merged into one, and the row says how many copies it found.

**What it cannot do.** The export has no prices, no photos and no listing links.
So an imported piece arrives without a price, and the editor says so in a note
rather than treating it as an error. Add the price, then use **Add photos in bulk**
for the pictures.

**Why it is not automatic.** Facebook only produces an export when you ask for
one, by hand, and the download link is tied to your account. Nothing can fetch it
on a schedule. The editor keeps the date of your last import and reminds you after
two weeks, which is as close to automatic as this can honestly get.

## Photos, the fast way

The editor at `/admin` has **Add photos in bulk**. Drop a whole folder of photos
on it at once and each one finds its own product by filename:

    lamborghini-urus-1.jpg   ->  Lamborghini Urus Key Holder
    batmobile 2.png          ->  Batmobile Key holder
    marshall.jpg             ->  Marshall Key Holder (Custom Built)

Dashes, spaces and capitals all work. A trailing number is read as "which photo",
not as part of the name, so `supra-1.jpg` and `supra-2.jpg` both land on the
Supra and stay in that order.

Matching ignores words that appear all over the catalog. "Key" and "holder" are
in most of the products, so they barely count; "lamborghini" decides it. Each row
says how sure it is, and anything it cannot place is left on **Skip this photo**
rather than guessed at. Correct whatever is wrong with the dropdown, then press
**Upload and attach** once. Four upload at a time.

Nothing is attached until every upload has finished, so the photos end up in
filename order rather than in whichever order the network happened to return.

## Descriptions

**Suggest descriptions** writes a first draft for every product that has none. It
never touches one you wrote yourself. They are drafts: read them and fix anything
that is not true before you publish.

## Colours

The site says you print in any colour, because you do. `FILAMENT_COLORS` in
`products.js` is not a menu of what is allowed: it is the handful usually on the
shelf, shown as dots so a buyer has something to point at. The colour box in the
request form is free text with those as suggestions, so "racing green with bronze
wheels" goes straight through.

The one exception is a product that genuinely is limited. Give it a `colors` list
in the editor, for example `Black, Red`, and that product says "Available in Black
or Red" instead of promising anything.

## Pickup and delivery

`DELIVERY` in `products.js`:

```js
const DELIVERY = { offered: true, price: '', pickup: 'Montreal' };
```

Set `price` to whatever you charge, written how you want it read, for example
`'$10'`. Leave it empty and the site says "for a fee, depending on where you are"
rather than inventing a number.

Set `offered: false` and every mention of delivery disappears: the how-it-works
line, the stats strip, the spec on each piece, and the question in the request
form.

## The saved list

A visitor can tap the heart on any piece. A bar appears at the bottom, and **Send
my list** copies a message naming everything they saved, with prices and any
colour they picked, ready to paste into a chat. The list lives in their own
browser and is never sent anywhere on its own.

## The custom request form

The form at the bottom of the page writes the message rather than sending it.
Whatever is typed appears in the grey box exactly as it will be sent, and the
button copies it and opens Marketplace. Nothing is hidden behind the button.

## Product pages, link previews and Google

Every piece has a real address: `/p/<id>`.

Pasting one into Messenger used to show a generic card, because the whole catalog
was a single page. Now `/p/<id>` is rendered by `api/product.js`, which serves the
same page with that product's title, description, photo and `Product` structured
data in the head. In the browser it behaves exactly as before: the page notices
the address and opens that piece.

`/sitemap.xml` is generated from `products.js` by `api/sitemap.js`, so it cannot
fall out of step with the catalog.

Both come from `products.js` at request time. There is nothing to regenerate and
nothing to keep in sync.

The old `#<id>` links still work, so anything already sent to a buyer keeps
working.

## Dark mode

The site follows the system setting, and the moon in the header overrides it. The
choice is remembered in that browser. The theme is set before the first paint, so
a dark-mode visitor never gets a white flash.

## Image sizes

Photos uploaded through the editor go to Cloudinary, and the site rewrites those
URLs to ask for the size it actually needs, in a modern format, with a `srcset` so
a phone gets a small file and a desktop gets a large one. A photo written as
`images/whatever.jpg` is left exactly as typed.

## Design notes: the motion

Motion, and what each piece is for:

- The hero arranges itself in reading order on arrival, so the eye gets headline,
  then sub, then buttons, instead of all three at once.
- The header sits flat at the top and lifts once the page moves under it, which
  is how you can tell it is floating rather than painted on.
- Cards fade up as they enter view, and the photo leans in under the pointer,
  which says "this opens" without a badge saying so.
- The detail view grows out of the page rather than appearing on top of it. Where
  the browser supports View Transitions the tapped photo physically morphs into
  the detail image; elsewhere it simply fades.
- Changing category or sort slides the surviving cards to their new positions
  instead of tearing the grid down and rebuilding it.
- On modern browsers the scroll reveal is pure CSS running off the main thread.
  The JavaScript observer is only a fallback.
- Real photos shimmer while they load, so a slow connection shows a surface that
  is clearly loading rather than a hole.

Nothing loops, nothing decorates, and all of it switches off under
`prefers-reduced-motion`. Most people open this from a Messenger link on a phone,
where motion that does not earn its place just costs battery.
