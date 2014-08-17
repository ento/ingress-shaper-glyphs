var fs = require('fs');
var Stream = require('stream');
var through2 = require('through2');
var lodash = require('lodash');
var langs = require('langs');
var csv = require('csv');
var gulp = require('gulp');
var gutil = require('gulp-util');

gulp.task('memrise', function(opt) {
  var dest = gulp.dest('dist');
  var outputs = {};
  function createOutput(filename, columns) {
    var file = new gutil.File({
        base: "",
        path: filename + ".csv",
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
      languages(record).forEach(function(langcode) {
        var langlabel = langs.where("1", langcode).local;
        var columns = ["Code", langlabel];
        var row = {"Code": record.code};
        row[langlabel] = record[langcode];
        getOutput(langcode, columns).write(row);

        var altColumn = langcode + " alts";
        if (record.hasOwnProperty(altColumn) && record[altColumn].length > 0) {
          var altColumns = [langlabel, "Alts"];
          var altRow = {"Alts": record[altColumn]};
          altRow[langlabel] = record[langcode];
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
