// Parameters
let currentScene = 0;
let selectedYear1 = 2022; // Default year
let selectedYear2 = 2022; // Default year
let selectedCountry = "Afghanistan"; // Default country

const data = {
    world: "https://unpkg.com/world-atlas@1/world/110m.json",
    population: "world_population.csv",
    countries: "country_codes.json"
};

const years = [2022, 2020, 2015, 2010, 2000, 1990, 1980, 1970];
const yearsStr = ["1970", "1980", "1990", "2000", "2010", "2015", "2020", "2022"];
let world, population, countries, countryNames;
initialization();

async function initialization() {
    world = await d3.json(data.world);
    population = await d3.csv(data.population);
    countries = await d3.json(data.countries);
    countryNames = population.map(d => d["Country/Territory"]);

    setEventListeners();
    updateScene();
}

function setEventListeners() {
    d3.select("#prevScene").on("click", () => changeScene(-1));
    d3.select("#nextScene").on("click", () => changeScene(1));

    // setup scene1
    d3.select("#yearSelect1").on("change", function () {
        selectedYear1 = +this.value;
        updateScene();
    });
    d3.select("#yearSelect1")
        .selectAll("option")
        .data(years)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);

    // setup scene2
    d3.select("#yearSelect2").on("change", function () {
        selectedYear2 = +this.value;
        updateScene();
    });
    d3.select("#yearSelect2")
        .selectAll("option")
        .data(years)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);

    // setup scene3
    d3.select("#countryDropdown").on("change", function () {
        selectedCountry = this.value;
        updateScene();
    });
    d3.select("#countryDropdown")
        .selectAll("option")
        .data(countryNames)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);
}

function updateScene() {
    d3.select("#visualization").html("");
    d3.select("#title").html("");

    if (currentScene === 0) {
        d3.select("#scene1").style("display", "block");
        d3.select("#scene2").style("display", "none");
        d3.select("#scene3").style("display", "none");
        scene1();
    } else if (currentScene === 1) {
        d3.select("#scene1").style("display", "none");
        d3.select("#scene2").style("display", "block");
        d3.select("#scene3").style("display", "none");
        scene2();
    } else if (currentScene === 2) {
        d3.select("#scene1").style("display", "none");
        d3.select("#scene2").style("display", "none");
        d3.select("#scene3").style("display", "block");
        scene3();
    }
}

function changeScene(delta) {
    currentScene = Math.max(0, Math.min(2, currentScene + delta));
    updateScene();
}

// Scene 1: Global Overview
function scene1() {
    const countriesTopo = topojson.feature(world, world.objects.countries).features;

    // Create a map for country population
    const populationMap = new Map();
    population.forEach(d => {
        populationMap.set(d["CCA3"].toLowerCase(), +d[selectedYear1 + " Population"]);
    });

    const colorScale = d3.scaleThreshold()
        .domain([1e6, 1e7, 5e7, 1e8, 5e8, 1e9])
        .range(d3.schemeBlues[7]);

    const svg = d3.select("#visualization").append("svg")
        .attr("width", "100%")
        .attr("height", "100%");

    const projection = d3.geoMercator().fitSize([800, 500], { type: "Sphere" });
    const path = d3.geoPath().projection(projection);

    svg.selectAll("path")
        .data(countriesTopo)
        .enter().append("path")
        .attr("d", path)
        .attr("fill", d => {
            const code = countries.find(c => c.id === +d.id);
            const populationNum = code ? populationMap.get(code.alpha3) : 0;
            return colorScale(populationNum);
        })
        .attr("stroke", "#333");

    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(700, 360)");

    const legendData = colorScale.range().map((color, i) => {
        const d = colorScale.invertExtent(color);
        if (!d[0]) d[0] = 0;
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

    d3.select("#title").text(`Global population distribution by country in ${selectedYear1}.`);
}

// Scene 2: Most Populous Countries
function scene2() {
    const margin = { top: 20, right: 30, bottom: 50, left: 100 },
        width = 900 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    const svg = d3.select("#visualization").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const sortedData = population.sort((a, b) => +b[selectedYear2 + " Population"] - +a[selectedYear2 + " Population"]).slice(0, 10);

    const x = d3.scaleLinear()
        .domain([0, 1500000000]).nice()
        .range([0, width]);

    const y = d3.scaleBand()
        .domain(sortedData.map(d => d["Country/Territory"]))
        .range([0, height])
        .padding(0.1);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(",.0f")));

    svg.append("g")
        .call(d3.axisLeft(y));

    svg.selectAll(".bar")
        .data(sortedData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", d => y(d["Country/Territory"]))
        .attr("width", d => x(+d[selectedYear2 + " Population"]))
        .attr("height", y.bandwidth())
        .attr("fill", "steelblue");

    svg.selectAll(".label")
        .data(sortedData)
        .enter().append("text")
        .attr("class", "label")
        .attr("x", d => x(+d[selectedYear2 + " Population"]))
        .attr("y", d => y(d["Country/Territory"]) + y.bandwidth() / 2 + 5)
        .text(d => d3.format(",.0f")(d[selectedYear2 + " Population"]));

    d3.select("#title").text(`Top 10 most populous countries in ${selectedYear2}.`);
}

// Scene 3: Historical data
function scene3() {
    d3.select("#countryDropdownText").text("Please select a country to view historical data.");

    const countryData = population.filter(d => d["Country/Territory"] === selectedCountry)[0];
    const cleanData = yearsStr.map(year => ({
        year: +year,
        population: +countryData[`${year} Population`]
    }));

    const margin = { top: 20, right: 30, bottom: 50, left: 60 },
        width = 800 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    const svg = d3.select("#visualization").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
        .domain([1970, 2022])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([d3.min(cleanData, d => d.population), d3.max(cleanData, d => d.population)]).nice()
        .range([height, 0]);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".2s")));

    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.population));

    svg.append("path")
        .datum(cleanData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", line);

    svg.selectAll("circle")
        .data(cleanData)
        .enter().append("circle")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.population))
        .attr("r", 3)
        .attr("fill", "steelblue");

    d3.select("#title").text(`Population trends for ${selectedCountry} from 1970 to 2022.`);
}
