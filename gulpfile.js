var fs = require('fs');
var Stream = require('stream');
var through2 = require('through2');
var lodash = require('lodash');
var langs = require('langs');
var csv = require('csv');
var Canvas = require('canvas');
var gulp = require('gulp');
var gutil = require('gulp-util');
var gm9 = require('./support/ingress-glyph-tools/glyph-tools').gm9;
global.gm9 = gm9;
require('./support/ingress-glyph-tools/glyph-dic');
var gm9igt = gm9.IngressGlyphTools;


function createGlyphStream(glyphString) {
  var glyphSize = 190;
  var glyphCenter = glyphSize * 0.5;
  var glyphRadius = glyphSize * 0.35;
  var glyph = gm9igt.Glyph.fromString(glyphString);
  var canvas = new Canvas(glyphSize, glyphSize);
  var ctx = canvas.getContext("2d");
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.strokeStyle = "#555";
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.lineWidth = Math.max(1, glyphSize * 0.01);
  gm9igt.drawGrid(ctx, glyphCenter, glyphCenter, glyphRadius, 4, function(ctx, x, y, r){
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2*Math.PI, false);
    ctx.stroke();
    ctx.fill();
  });

  ctx.strokeStyle = "#444";
  ctx.shadowBlur = Math.max(3, glyphSize * 0.01);
  ctx.shadowColor = "#333";
  ctx.shadowOffsetX = 1.5;
  ctx.shadowOffsetY = 1.5;
  ctx.lineWidth = Math.max(3, glyphSize * 0.03);
  gm9igt.drawGlyph(ctx, glyphCenter, glyphCenter, glyphRadius, glyph);
  return canvas.pngStream();
}

function createPngFile(path, pngStream) {
  var file = new gutil.File({
      base: "",
      path: path,
      contents: through2(function(chunk, enc, callback) {
        this.push(chunk);
        callback();
      })
    });
  pngStream.pipe(file.contents);
  return file;
}

gulp.task('course-data', function(opt) {
  var dest = gulp.dest('dist');
  var outputs = {};
  function createOutput(filename, columns) {
    var file = new gutil.File({
        base: "",
        path: filename + ".tsv",
        contents: through2(function(chunk, enc, callback) {
          this.push(chunk);
          callback();
        })
      });
    var stringifier = csv.stringify({columns: columns, delimiter: '\t'});
    stringifier.pipe(file.contents);
    dest.write(file);
    // write headers
    stringifier.write(lodash.reduce(columns, function(memo, each) {
      memo[each] = each;
      return memo;
    }, {}));
    return stringifier;
  }
  function getOutput(filename, columns) {
    if (!outputs.hasOwnProperty(filename)) {
      outputs[filename] = createOutput(filename, columns);;
    }
    return outputs[filename];
  }
  function languages(record) {
    return Object.keys(record).filter(function(each) {
      return langs.has("1", each);
    });
  }

  var parser = csv.parse({"columns": true});
  parser.on('readable', function() {
    var record;
    while(record = parser.read()) {
      dest.write(createPngFile(
        "images/" + record.code + ".png",
        createGlyphStream(record.code)));
      languages(record).forEach(function(langCode) {
        var langLabel = langs.where("1", langCode).local;
        var columns = ["Code", "English", langLabel];
        var row = {"Code": record.code, "English": record.en};
        row[langLabel] = record[langCode];
        getOutput(langCode, columns).write(row);

        var altColumn = langCode + " alts";
        if (record.hasOwnProperty(altColumn) && record[altColumn].length > 0) {
          var altColumns = [langLabel, "Alts"];
          var altRow = {"Alts": record[altColumn]};
          altRow[langLabel] = record[langCode];
          getOutput(altColumn.replace(" ", "-"), altColumns).write(altRow);
        }
    });
  }});
  parser.on('error', function(err) {
    gutil.log(gutil.colors.red(err.message));
  });
  parser.on('finish', function() {
    Object.keys(outputs).forEach(function(key) {
      outputs[key].end();
    });
  });

  fs.createReadStream('src/glyphs.csv').pipe(parser);
});

function createLogoStream(glyphs) {
  var colors = {
    nightBlue: "#0c2e36",
    lightYellow: "#ffffe5",
    xmHighlight: "#68d3b0",
    xmGreen: "#569d88",
    white: '#fff'
  };
  var canvasSize = 190;
  var glyphSize = canvasSize / glyphs.length;
  var glyphRadius = glyphSize * 0.25;
  var glyphCenterY = canvasSize * 0.5;

  var canvas = new Canvas(canvasSize, canvasSize);
  var ctx = canvas.getContext("2d");
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.rect(0, 0, canvasSize, canvasSize);
  ctx.fillStyle = colors.nightBlue;
  ctx.fill();

  for(var i = 0; i < glyphs.length; ++i){
      var query = glyphs[i];
      var glyph = gm9igt.glyphtionaryIndex[query.key][query.index];
      var entry = {keyGlyph: glyph, value: gm9igt.glyphtionary.get(glyph)};
      var glyphCenterX = glyphSize * 0.5 + glyphSize * i;

      ctx.lineWidth = Math.max(1, glyphSize * 0.01);

      // outer border
      ctx.strokeStyle = colors.xmHighlight;
      ctx.fillStyle = colors.xmGreen;
      gm9igt.drawHexagon(ctx, glyphCenterX, glyphCenterY, glyphRadius * 1.5);
      ctx.stroke();
      ctx.fill();

      // inner gap
      ctx.strokeStyle = colors.nightBlue;
      ctx.fillStyle = colors.nightBlue;
      gm9igt.drawHexagon(ctx, glyphCenterX, glyphCenterY, glyphRadius * 1.4);
      ctx.stroke();
      ctx.fill();

      // inner hexagon
      ctx.strokeStyle = colors.xmGreen;
      ctx.fillStyle = colors.xmGreen;
      gm9igt.drawHexagon(ctx, glyphCenterX, glyphCenterY, glyphRadius * 1.3);
      ctx.stroke();
      ctx.fill();

      // content
      ctx.strokeStyle = colors.white;
      ctx.lineWidth = Math.max(4, glyphSize * 0.05);
      gm9igt.drawGlyph(ctx, glyphCenterX, glyphCenterY, glyphRadius, entry.keyGlyph);
  }
  return canvas.pngStream();
}

gulp.task('course-logo', function() {
  var glyphs = [
      {key: "shaper", index: 0}];
  gulp.dest('dist').write(createPngFile(
    "course-logo.png",
    createLogoStream(glyphs)));
});
