$(function() {
var version = "v1.1.0";
var baseUrl = "//cdn.rawgit.com/ento/ingress-shaper-glyphs/" + version + "/dist/";
var langs = [{
  "code": "ja",
  "local": "日本語"
}];

_.each(langs, function(each) {
  var $option = $("<option/>");
  $option.attr("value", each.code);
  $option.text(each.local);
  $("#lang").append($option);
});

$("<link/>")
  .attr("rel", "icon")
  .attr("href", baseUrl + "course-logo.png")
  .appendTo("head");

// backgrid extensions

var ImageCell = Backgrid.Cell.extend({

  /** @property */
  className: "image-cell",

  /**
     @property {string} [alt] The alt attribute of the generated image.
  */
  alt: null,

  /**
     @property {string} [altAttr] The model attribute to use as the
     alt attribute of the generated image. Takes precedence over [alt].
  */
  altAttr: null,

  /**
     @property {function} [src] Function to produce the src attribute
     of the image. Takes precedence over the column's name.
  */
  src: null,

  /**
     @property {function} [width] Width attribute of the image.
  */
  width: null,

  /**
     @property {function} [height] Height attribute of the image.
  */
  height: null,

  initialize: function (options) {
    ImageCell.__super__.initialize.apply(this, arguments);
    this.alt = options.alt || this.alt;
    this.altAttr = options.altAttr || this.altAttr;
    this.width = options.width || this.width;
    this.height = options.height || this.height;
  },

  render: function () {
    this.$el.empty();
    var rawValue = this.model.get(this.column.get("name"));
    if (this.src) {
      rawValue = this.src(this.model, this.column.get("name"));
    }
    var altValue = this.altAttr ? this.model.get(this.altAttr) : this.alt;
    this.$el.append($("<img>", {
      tabIndex: -1,
      src: rawValue,
      alt: altValue,
      width: this.width,
      height: this.height
    }));
    this.delegateEvents();
    return this;
  }

});

// models

var Glyph = Backbone.Model.extend({});

var Glyphs = Backbone.Collection.extend({
  model: Glyph,
  url: baseUrl + "glyphs.json",
  setFlatten: function(flatten) {
    this.flatten = flatten;
  },
  parse: function(items) {
    if (!this.flatten) {
      return items;
    }
    var flattened = [];
    _.each(items, function(each) {
      var alts = each.en_alts;
      var omitted = _.omit(each, "en_alts");
      flattened.push(omitted);
      _.each(alts, function(alt) {
        flattened.push($.extend({}, omitted, {en: alt}));
      })
    });
    return flattened;
  }
});

var glyphs = new Glyphs();
var columns = [{
    name: "memrise_index",
    label: "Memrise lvl",
    editable: false,
    cell: Backgrid.StringCell.extend({className: "memrise-index-cell"})
  }, {
    name: "glyph",
    label: "Glyph",
    editable: false,
    cell: ImageCell.extend({
      altAttr: "en",
      width: "64",
      src: function(model) {
        return baseUrl + "images/" + model.get("code") + ".png";
      }
    })
  }, {
    name: "en",
    label: "Name",
    editable: false,
    cell: "string"
  }, {
    name: "",
    label: "",
    editable: false,
    renderable: false,
    cell: "string",
    l10n: true,
    alts: false
  }, {
    name: "en_alts",
    label: "Alts",
    editable: false,
    cell: "string"
  }, {
    name: "",
    label: "",
    editable: false,
    renderable: false,
    cell: "string",
    l10n: true,
    alts: true
  }, {
    name: "code",
    label: "Code",
    editable: false,
    cell: "string",
    renderable: false
  }, {
    name: "node_count",
    label: "Node count",
    editable: false,
    cell: "integer"
  }];

// Initialize a new Grid instance
var grid = new Backgrid.Grid({
  columns: columns,
  collection: glyphs
});

glyphs.on("reset", function() {
  $("#length").text(glyphs.length);
})

// Render the grid and attach the root to your HTML document
$("#table").append(grid.render().sort("en", "ascending").el);

// settings

function updateColumnsVisibility() {
  var altsColumn = grid.columns.findWhere({"name": "en_alts"});
  var l10nAltsColumn = grid.columns.findWhere({"l10n": true, "alts": true});
  var l10nColumn = grid.columns.findWhere({"l10n": true, "alts": false});
  var flatten = $("#flatten").is(":checked");
  var translate = !_.isUndefined(_.findWhere(langs, {"code": $("#lang").val()}));
  altsColumn.set("renderable", !flatten);
  l10nAltsColumn.set("renderable", !flatten && translate);
  l10nColumn.set("renderable", translate);
}

$("#flatten").on("change", function() {
  glyphs.setFlatten($(this).is(":checked"));
  updateColumnsVisibility();
  grid.render();
});

$("#lang").on("change", function() {
  var lang = _.findWhere(langs, {"code": $("#lang").val()});
  if (!_.isUndefined(lang)) {
    var l10nColumn = grid.columns.findWhere({"l10n": true, "alts": false});
    var l10nAltsColumn = grid.columns.findWhere({"l10n": true, "alts": true});
    l10nColumn.set("name", lang.code);
    l10nColumn.set("label", lang.local);

    l10nAltsColumn.set("name", lang.code + "_alts");
    l10nAltsColumn.set("label", lang.local);
  }
  updateColumnsVisibility();
  grid.render();
})

var clientSideFilter = new Backgrid.Extension.ClientSideFilter({
  collection: glyphs,
  placeholder: "Search",
  fields: ['en', 'en_alts'],
  wait: 150
});
$("#settings").after(clientSideFilter.render().el);

// router

var Workspace = Backbone.Router.extend({
  routes: {
    "*actions": "index"
  },

  index: function(actions, params) {
    // Fetch glyphs from the url
    glyphs.fetch({reset: true});
    if (!_.isUndefined(params.lang)) {
      $("#lang").val(params.lang).trigger("change");
    }
    if (!_.isUndefined(params.flatten)) {
      $("#flatten").prop("checked", true).trigger("change");
    }
  }
});
var router = new Workspace;
Backbone.history.start();

});
