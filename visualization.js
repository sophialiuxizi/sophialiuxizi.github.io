// Parameters
let currentScene = 0;
let selectedCountry = null;
let selectedYear = 2022; // Default year

const data = {
    world: "https://unpkg.com/world-atlas@1/world/110m.json",
    population: "world_population.csv",
    countries: "country_codes.json"
};


// Initial setup
d3.select("#prevScene").on("click", () => changeScene(-1));
d3.select("#nextScene").on("click", () => changeScene(1));
d3.select("#yearSelect").on("change", function () {
    selectedYear = +this.value;
    updateScene();
});

const years = [2022, 2020, 2015, 2010, 2000, 1990, 1980, 1970];
d3.select("#yearSelect")
    .selectAll("option")
    .data(years)
    .enter()
    .append("option")
    .text(d => d)
    .attr("value", d => d);

function changeScene(delta) {
    currentScene = Math.max(0, Math.min(2, currentScene + delta));
    updateScene();
}

function updateScene() {
    d3.select("#visualization").html("");
    d3.select("#title").html("");

    if (currentScene === 0) {
        scene1();
    } else if (currentScene === 1) {
        scene2();
    } else if (currentScene === 2) {
        scene3();
    }
}

// Scene 1: Global Overview
function scene1() {
    Promise.all([
        d3.json(data.world), // Load the world map
        d3.csv(data.population), // Load the population data
        d3.json(data.countries)
    ]).then(([world, populationData, countryCodes]) => {
        const countries = topojson.feature(world, world.objects.countries).features;

        // Create a map for country population
        const populationMap = new Map();
        populationData.forEach(d => {
            populationMap.set(d["CCA3"].toLowerCase(), +d[selectedYear + " Population"]); // Convert population to a number
        });

        // Create a color scale
        const colorScale = d3.scaleThreshold()
            .domain([1e6, 1e7, 5e7, 1e8, 5e8, 1e9]) // Population thresholds
            .range(d3.schemeBlues[7]);

        const svg = d3.select("#visualization").append("svg")
            .attr("width", "100%")
            .attr("height", '100%');

        const projection = d3.geoMercator().fitSize([800, 500], { type: "Sphere" });
        const path = d3.geoPath().projection(projection);

        svg.selectAll("path")
            .data(countries)
            .enter().append("path")
            .attr("d", path)
            .attr("fill", d => {
                const code = countryCodes.find(c => c.id === +d.id);
                const population = code ? populationMap.get(code.alpha3) : 0;
                return colorScale(population);
            })
            .attr("stroke", "#333");

        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", "translate(700, 360)");

        const legendData = colorScale.range().map((color, i) => {
            const d = colorScale.invertExtent(color);
            if (!d[0]) d[0] = 0; // Handle the first threshold case
            return {
                color,
                value: d[0],
                range: d[1] - d[0]
            };
        });

        legend.selectAll("rect")
            .data(legendData)
            .enter().append("rect")
            .attr("x", 0)
            .attr("y", (d, i) => i * 20)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", d => d.color);

        legend.selectAll("text")
            .data(legendData)
            .enter().append("text")
            .attr("x", 30)
            .attr("y", (d, i) => i * 20 + 15)
            .text(d => `${d.value.toLocaleString()}${d.range ? " - " + (d.value + d.range).toLocaleString() : "+"}`);

        d3.select("#title").text("Global population distribution by country.");
    });
}


// Scene 2: Most Populous Countries
function scene2() {
}

// Scene 3: Historical Trends
function scene3() {
}

// Initial scene
updateScene();
