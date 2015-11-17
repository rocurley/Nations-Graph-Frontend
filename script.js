var width =  60000,
    height = 40000;

var zoomMax = 160;

var flagShowZoom = 10;

var searchZoom = 60;

zoomBehevior = d3.behavior.zoom().scaleExtent([1, zoomMax]).on("zoom", zoomHandler);

var svg = d3.select("svg")
    .attr("viewBox", "0 0 " + width + " " + height)
    .call(zoomBehevior)
  .append("g")//Putting the event handler on the thing being zoomed produces erratic results.


d3.select("svg").append("rect")
    .attr("class", "underlay")
    .attr("fill", "none")
    .attr("width", width)
    .attr("height", height);

svg.append("rect")
    .attr("class", "overlay")
    .attr("width", width)
    .attr("height", height);

function debugLine(fill){
  var line = d3.select("svg")
    .append("rect")
    .attr("width", 100000000)
    .attr("height", 100)
    .attr("x",0)
    .attr("y",0)
    .attr("fill",fill);
  return function(y){line.attr("y",y)}
}

var flagsVisible = false;

function hideFlags() {
  if(flagsVisible){
    $('.flag').addClass('hidden');
    flagsVisible = false;
  }
}

function showFlags() {
  if(!flagsVisible){
    $('.flag').removeClass('hidden');
    flagsVisible = true;
  }
}

function coordinateSystemStuff(){
  var out = {};
  out.svgDimensions = $('svg')[0].getBoundingClientRect();
  out.uDimensions = $('svg>.underlay')[0].getBoundingClientRect();
  pageXMargin = out.svgDimensions["width"] - out.uDimensions["width"]
  pageYMargin = out.svgDimensions["height"] - out.uDimensions["height"]
  if(pageXMargin > pageYMargin){
    out.svgToHtmlRatio = out.uDimensions["width"]/width;
    out.margin = [pageXMargin/2/out.svgToHtmlRatio, 0] // width/2 * (svgDim/gDim - 1)
  } else {
    out.svgToHtmlRatio = out.uDimensions["height"]/height;
    out.margin = [0, pageYMargin/2/out.svgToHtmlRatio] // height/2 * (svgDim/gDim - 1)
  }
  out.svgToHtml = function(r) {
    x = r[0];
    y = r[1];
    return [svgToHtmlRatio*x + pageXMargin/2, svgToHtmlRatio*y + pageYMargin/2];
  }
  return out;
}

function zoomToNode(id) {
  var target = $("#"+id)[0];
  console.log(target);
  zoomTo(target.x.baseVal.value+target.width.baseVal.value/2,
         target.y.baseVal.value+target.height.baseVal.value/2,
         Math.max(zoomBehevior.scale(),searchZoom));
}

function zoomTo(xPos,yPos, s = zoomBehevior.scale()) {
  //The input is in g coordinates
  var cSStuff = coordinateSystemStuff();
  var windowX = cSStuff.uDimensions.width  / cSStuff.svgToHtmlRatio;
  var windowY = cSStuff.uDimensions.height / cSStuff.svgToHtmlRatio;
  var t = [windowX/2 - xPos*s, windowY/2 - yPos*s];
  zoomBehevior.scale(s);
  console.log([windowX,windowY,s,t[0],t[1]]);
  zoom(t,s);
}

function zoomHandler() {
  zoom(d3.event.translate, d3.event.scale);
}

function zoom(t,s) {
  //When zoomed in such that the screen is filled by the image, and that height is the small dimension the
  //screen is too big in, we want
  // w <= s*w+t
  // 0 >= s*0+t
  // If in svg coordinates the initial margin is m
  // w+m <= s*w+t
  // -m >= s*0+t
  // if we're cramped, set the difference equal on both sides:
  // w+m+d=sw+t
  // -m-d = t
  // w-t = sw +t
  // t = (1-s)w/2

  var m = coordinateSystemStuff().margin;
  xMin = m[0] + width * (1 - s);
  xMax = -m[0];
  if(xMax < xMin)
    t[0] = (xMax + xMin)/2;
  else
    t[0] = Math.min(xMax, Math.max(t[0], xMin));
  yMin = m[1] + height * (1 - s);
  yMax = -m[1];
  if(yMax < yMin){
    t[1] = (yMax + yMin)/2;
  }
  else
    t[1] = Math.min(yMax, Math.max(t[1], yMin));
  if(s > flagShowZoom) showFlags();
  if(s < flagShowZoom) hideFlags();
  zoomBehevior.translate(t);
  svg.attr("transform", "translate(" + t + ")scale(" + s + ")");
}

var highlighted;
var search = {};

function highlight(target){
  if(highlighted){
    highlighted.classList.remove("highlighted");
  }
  highlighted = target;
  highlighted.classList.add("highlighted");
}

$.getJSON("nations.json", function(data) {
  nodesList = [];
  edgesList = [];
  for(var k in data["nodes"]){
    node = data["nodes"][k];
    node["id"] = k;
    nodesList.push(node);
  }
  for(var k in data["edges"]){
    var path = data["edges"][k];
    var nodes = k.replace('(', "").replace(')', "").split(",").map(Number)
    edgesList.push({path : path, start : nodes[0], end : nodes[1]});
  }

  search.source = function (query, process) {
    console.log("Starting source");
    console.log(query);
    query = escapeRegExp(query);
    var searchRegex = new RegExp(query, 'i');
    var goodRegex = new RegExp("^" + query, 'i');
    var mehRegex = new RegExp(query, 'i');
    matches = [[],[],[],[]]
    nodesList.forEach(function(node){
      if(goodRegex.test(node.Nation.label))
        matches[0].push(node);
      else if(goodRegex.test(node.Nation.wikiArticle))
        matches[1].push(node);
      else if(mehRegex.test(node.Nation.label))
        matches[2].push(node);
      else if(mehRegex.test(node.Nation.wikiArticle))
        matches[3].push(node);
    });
    out = [].concat.apply([],matches)//.map(function(node){return node.Nation.label});
    console.log(out);
    process(out);
  }
  search.display = function(node){
    return node.Nation.label;
  }
  search.name = "nations";
  search.limit = 100;
  search.templates = {};
  search.templates.suggestion = function(node){
    imageStr = node.Nation.flag ? '<img class="previewFlag" src="' + node.Nation.flag.directURL +'"></img>' : '';
    yearStr = '(' + (node.Nation.startYear ? node.Nation.startYear : '???') + ' to ' + (node.Nation.endYear ? node.Nation.endYear : '???') + ')';
    html = '<div>'+ imageStr +'<strong>' + node.Nation.label + '</strong><br/>' + yearStr + '</div>';
    return html;
  }
  $('#header .typeahead').typeahead({
      hint: true,
      //highlight: true,
      minLength: 1
    },
    search
    ).on('typeahead:select', function(ev,node){
      console.log("SELECT");
      console.log(node);
      zoomToNode(node.id);
      highlight(document.getElementById(node.id));
    })
  $('#search input').keypress(function(ev){
    if(ev.which == 13){
      searchQuery = $('#search .tt-input').val();
      console.log("SUBMIT");
      search.source(searchQuery, function(suggestions){
        console.log(suggestions[0]);
        zoomToNode(suggestions[0].id);
        highlight(document.getElementById(suggestions[0].id));
      });
    }
  });

  svg
    .append("g")
    .attr("class", "node")
    .selectAll("rect")
    .data(nodesList)
    .enter().append("rect")
    .attr("x", function(d) { return d["Geometry"]["x"]} )
    .attr("y", function(d) { return d["Geometry"]["y"]} )
    .attr("width", function(d) { return d["Geometry"]["w"]} )
    .attr("height", function(d) { return d["Geometry"]["h"]} )
    .attr("id", function(d) { return d["id"]});
  var miniBody = svg
    .append("g")
    .selectAll("foreignObject")
    .data(nodesList)
    .enter()
    .append("foreignObject")
    .attr("x", function(d) { return d["Geometry"]["x"]} )
    .attr("y", function(d) { return d["Geometry"]["y"]} )
    .attr("width", function(d) { return d["Geometry"]["w"]} )
    .attr("height", function(d) { return d["Geometry"]["h"]} )
    .append("xhtml:body")
  miniBody
    .append("a")
    .attr("href", function(d) {
        return "http://en.wikipedia.org/wiki/" + d["Nation"]["wikiArticle"]})
    .attr("target", "_blank")
    .html(function(d) { return d["Nation"]["label"] });
  miniBody
    .append("br")
  miniBody
    .append("div")
    .html(function(d) {
      var startYear = d["Nation"]["startYear"];
      startYear = startYear ? startYear : "?";
      var endYear = d["Nation"]["endYear"];
      endYear = endYear ? endYear : "?";
      return (startYear + " to " + endYear);
    });
  miniBody
    .filter(function(d) { return d["Nation"]["flag"] })
    .append("a")
    .attr("href", function(d) { return d["Nation"]["flag"]["landingURL"]})
    .attr("target", "_blank")
    .append("img")
    .attr("class", "flag hidden")
    .attr("src", function(d) { return d["Nation"]["flag"]["directURL"] });

  edges = svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", "4")
    .selectAll("g")
    .data(edgesList)
    .enter()
    .append("g");
  edges
    .append("path")
    .attr("d", function(d) {
      var pathD = "";
      var prefix = "M "
      for(i in d["path"]){
        pathD = pathD + prefix + (d["path"][i][0]) + " " + (d["path"][i][1])
        prefix = " L "
      }
      return pathD;
    });
  edges
    .append("circle")
    .attr("cx", function(d) {
      return d["path"][0][0];
    })
    .attr("cy", function(d) {
      return d["path"][0][1];
    })
    .attr("r", "5")
    .attr("class", "pathStart")
    .on("click", function(d){
      highlight(this.parentNode);
      zoomToNode(d["end"]);
    });
  edges
    .append("path")
    .attr("d", "M 0 0 l 5 -10 h -10 z")
    .attr("transform", function(d){
      var end = d.path[d.path.length-1];
      var dx = end[0] - d.path[d.path.length-2][0];
      var dy = end[1] - d.path[d.path.length-2][1];
      var rotation = dx+dy>0 ?
                            (dx-dy>0 ? 270 :   0) :
                            (dx-dy>0 ? 180 :  90)
      return ("translate("+end[0]+", "+end[1]+") rotate("+rotation+")");
    })
    .attr("class", "pathEnd")
    .on("click", function(d){
      highlight(this.parentNode);
      zoomToNode(d["start"]);
    });
  });

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
