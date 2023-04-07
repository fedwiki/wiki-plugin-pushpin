/*
 * Federated Wiki : Pushpin Pushpin
 *
 * Licensed under the MIT license.
 * https://github.com/fedwiki/wiki-plugin-pushpin/blob/master/LICENSE.txt
 */

const width = 426
const height = 300

const fy = 'FY09'       // [ 'FY05', 'FY06', 'FY07', 'FY08', 'FY09' ]
const region = 'N ASIA' // [ 'N ASIA', 'S ASIA', 'AMERICAS', 'EMEA' ]
const brand = 'NIKE'    // [ 'AFFILIATE', 'NIKE' ]
const bu = 'APRL'       // [ 'EQUIP', 'FTWR', 'APRL', '_NA' ]s

const display = (d3, div, item, vis, collection, locations, factories) => {

  const xy = d3.geoMercator().scale(350).translate([-550, 300])
  const path = d3.geoPath().projection(xy)
  const fill =  d3.schemeCategory10

  const countries = {}

  factories = factories.filter((o) => {
    return o.fy === fy && o.region === region && o.brand === brand && o.bu === bu
  })

  factories = factories.map((f) => {
    f.coordinates = []
    f.coordinates[0] = xy([locations[f.country].location.lng, locations[f.country].location.lat])[0]
    f.coordinates[1] = xy([locations[f.country].location.lng, locations[f.country].location.lat])[1]
    // Set starting position
    f.x = f.coordinates[0]
    f.y = f.coordinates[1]
    // remove fy, as it's used in d3.force
    delete f.fy
    // Build hash of country coordinates for future use.
    countries[f.country] = xy(f.coordinates)
    return f
  })

  // Create the paths for countries
  const states = vis.append('svg')
    .attr('id', 'states')

  states.selectAll('path')
    .data(collection.features)
    .enter()
    .append('path')
      .attr('d', path)
      .append('title')
        .text(d => d.properties.name)

  let sim = d3.forceSimulation(factories)
    .force("x", d3.forceX().x(d => d.coordinates[0]))
    .force('y', d3.forceY().y(d => d.coordinates[1]))
    .force('collide', d3.forceCollide().strength(.1).radius(3))
    .on('tick', ticked)

  let node = vis.selectAll('.node')
    .data(sim.nodes())
    .enter()
    .append('circle')
      .classed('node', true)
      .attr('r', 3)
      .style('fill', (d, i) => d3.rgb(fill[((Object.keys(countries).indexOf(d.country)) % 10)]).darker(Math.random()) )

  function ticked () {
    node
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
  }
}

async function emit (div, item) {
  const d3 = await import('https://cdn.jsdelivr.net/npm/d3@7/+esm')

  div.append(`
    <style type='text/css'>
      .pushpin path {
        fill: #ccc;
        stroke: #fff;
      }
      .pushpin svg {
        border: solid 1px #ccc;
        background: #eee;
      }
    </style>
  `)

  const vis = d3.select(div.get(0))
    .append('svg')
      .attr('width', width)
      .attr('height', height)

  
  const [collection, locations, factories] = await Promise.all([
    d3.json('/plugins/pushpin/world-countries.json'),
    d3.json('/plugins/pushpin/factories-locations.json'),
    d3.json('/plugins/pushpin/factories.json')
  ])
  
  display(d3, div, item, vis, collection, locations, factories)
}

function bind($item, item) {}

if (typeof window !== "undefined" && window !== null) {
  window.plugins.pushpin = {
    emit: emit,
    bind: bind
  }
}
