//TODO: Set width and height by percentage, then set use viewbox to set it to be the size of the
//whole image, and allow zooming in.

var width =  60000,
    height = 40000;

var zoomMax = 80;

var flagShowZoom = 10;

zoomBehevior = d3.behavior.zoom().scaleExtent([1, zoomMax]).on("zoom", zoom);

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

function getMargin(s) {
  var svgDimensions = $('svg')[0].getBoundingClientRect();
  var uDimensions = $('svg>.underlay')[0].getBoundingClientRect();
  pageXMargin = svgDimensions["width"] - uDimensions["width"]
  pageYMargin = svgDimensions["height"] - uDimensions["height"]
  if(pageXMargin > pageYMargin){
    ratio = uDimensions["width"]/width
    return [pageXMargin/2/ratio,0] // width/2 * (svgDim/gDim - 1)
  } else {
    ratio = uDimensions["height"]/height
    return [0,pageYMargin/2/ratio] // height/2 * (svgDim/gDim - 1)
  }
}

function zoom() {
  var t = d3.event.translate,
      s = d3.event.scale;
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

  m = getMargin(s);
  xMin = m[0] + width * (1 - s);
  xMax = -m[0];
  if(xMax < xMin)
    t[0] = (xMax + xMin)/2;
  else
    t[0] = Math.min(xMax, Math.max(t[0], xMin));
  yMin = m[1] + height * (1 - s);
  yMax = -m[1];
  if(yMax < yMin){
    console.log("Clamping t[1] to" + ((yMin+yMax)/2/s));
    t[1] = (yMax + yMin)/2;
  }
  else
    t[1] = Math.min(yMax, Math.max(t[1], yMin));
  if(s > flagShowZoom) showFlags();
  if(s < flagShowZoom) hideFlags();
  zoomBehevior.translate(t);
  svg.attr("transform", "translate(" + t + ")scale(" + s + ")");
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
    edgesList.push(data["edges"][k]);
  }
  svg
    .append("g")
    .attr("fill", "yellow")
    .selectAll("rect")
    .data(nodesList)
    .enter().append("rect")
    .attr("x", function(d) { return d["Geometry"]["x"]} )
    .attr("y", function(d) { return d["Geometry"]["y"]} )
    .attr("width", function(d) { return d["Geometry"]["w"]} )
    .attr("height", function(d) { return d["Geometry"]["h"]} );
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

  svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "black")
    .selectAll("path")
    .data(edgesList)
    .enter().append("path")
    .attr("d", function(d) {
      var pathD = "";
      var prefix = "M "
      for(i in d){
        pathD = pathD + prefix + (d[i][0]) + " " + (d[i][1])
        prefix = " L "
      }
      return pathD;
    });
  });
