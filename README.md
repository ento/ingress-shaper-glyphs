## ingress-shaper-glyphs

Source data for memrise courses on [Ingress][ingress] Shaper glyphs.

- English: http://www.memrise.com/course/368204/ingress-shaper-glyphs/
- Japanese: http://www.memrise.com/course/369242/ingress/

[ingress]: https://www.ingress.com

### Commands

- `gulp course-data`: generates `dist/*.tsv` and `dist/images/*.png` files suitable for uploading with [Uprise][uprise].
- `gulp course-logo`: generates `dist/course-logo.png`.

[uprise]: http://memrise-users.wikia.com/wiki/Uprise

### How to run locally

Clone and execute:

```
$ npm install
```

If ``node-canvas`` is having trouble finding headers from X11, try:

```
PKG_CONFIG_PATH=/opt/X11/lib/pkgconfig/ npm install --save canvas
```

---- 

Niantic Labs has the authority on glyph names and imagery. Other portions of this repo are released under the MIT license.
