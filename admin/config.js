/* ============================================================================
   ADMIN SETTINGS
   ============================================================================

   PASSWORD
   --------
   Change this to whatever you want. Be aware of what it is and is not:

   This is a static site, so this password lives in a file anyone can read. It
   keeps a curious visitor out of the editor. It is not real security.

   That is acceptable here, and only here, because the admin page cannot change
   the live site. All it does is let you edit a copy in your own browser and
   download an updated products.js. The website only changes when YOU commit that
   file to GitHub. So the worst a stranger who gets in can do is look around.

   Never reuse a password here that you use anywhere else.
   ========================================================================== */

const ADMIN_PASSWORD = 'changeme';

/* ----------------------------------------------------------------------------
   CLOUDINARY (optional)
   ----------------------------------------------------------------------------
   Fill these in and the admin page can upload photos straight from your browser,
   no server involved. Leave them blank and you can still add photos by putting
   files in the images/ folder and typing the filename.

   To set it up, once:
     1. Make a free account at cloudinary.com
     2. Settings > Upload > Upload presets > Add upload preset
     3. Set Signing Mode to "Unsigned". Give it a name.
     4. Put your cloud name and that preset name below.

   An unsigned preset is meant to be public, that is the point of it. Restrict it
   in Cloudinary to images only and a sane max file size, so nobody who reads this
   file can dump junk into your account.
   -------------------------------------------------------------------------- */

const CLOUDINARY = {
  // Your cloud name, taken from the CLOUDINARY_URL you were given. This one is
  // public by design: it appears in every image URL the site serves.
  cloudName: 'uhuni38t',

  // The unsigned upload preset, made in the Cloudinary console under
  // Settings > Upload > Upload presets.
  uploadPreset: 'cloud-images',

  folder: 'kad-prints',
};

/* NOTE ON THE API KEY AND SECRET
   ------------------------------
   Neither belongs in this file, and neither is needed. Unsigned uploads use only
   the cloud name and the preset above. The API secret grants full control of the
   account, including deleting everything in it, so it never goes anywhere near a
   file the browser downloads. */
