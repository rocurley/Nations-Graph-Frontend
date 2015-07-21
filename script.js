//TODO: Set width and height by percentage, then set use viewbox to set it to be the size of the
//whole image, and allow zooming in.

var width =  60000,
    height = 40000;

var frameWidth = 750,
    frameHeight = 500;

var zoomMin = 1/80;

zoomBehevior = d3.behavior.zoom().scaleExtent([zoomMin, 1]).scale(zoomMin).on("zoom", zoom);

var svg = d3.select("svg")
    .attr("viewBox", "0 0 " + frameWidth + " " + frameHeight)
    .call(zoomBehevior)
  .append("g")//Putting the event handler on the thing being zoomed produces erratic results.
    .attr("transform", "scale("+zoomMin+")");

svg.append("rect")
    .attr("class", "overlay")
    .attr("width", width)
    .attr("height", height);

function zoom() {
  var t = d3.event.translate,
      s = d3.event.scale;
  t[0] = Math.max(frameWidth-width*s, Math.min(t[0],0));
  t[1] = Math.max(frameHeight-height*s, Math.min(t[1],0));
  //t[0] = Math.max(-width * (s - 1), Math.min(t[0], 0));
  //t[1] = Math.max(-height * (s - 1), Math.min(t[1], 0));
  zoomBehevior.translate(t);
  svg.attr("transform", "translate(" + t + ")scale(" + s + ")");
}

$.getJSON("nations.js", function(data) {
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
    .append("img")
    .attr("class", "flag")
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
      console.log(d);
      for(i in d){
        pathD = pathD + prefix + (d[i][0]) + " " + (d[i][1])
        prefix = " L "
      }
      return pathD;
    });
  });
