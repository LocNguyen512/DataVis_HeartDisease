// Set up the dimensions and margins of the graph
var margin = {top: 30, right: 180, bottom: 40, left: 60}; // Increased right margin for legend
var width = 700 - margin.left - margin.right; // Fixed width for the chart
var height = 400 - margin.top - margin.bottom;

// Select the container div
const container = d3.select("#chart_6");

// Function to normalize column names
function normalizeColumnName(name) {
  return name.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

// Function to draw the chart with a given number of bins
function drawChart(numBins) {
	// Remove any existing SVG
	container.selectAll("svg").remove();

	// Append SVG object to the page
	var svg4 = container
		.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	// Append tooltip div
	var tooltip = d3.select("body")
		.append("div")
		.style("position", "absolute")
		.style("background", "white")
		.style("border", "1px solid #ccc")
		.style("padding", "5px")
		.style("border-radius", "5px")
		.style("box-shadow", "0px 0px 5px rgba(0,0,0,0.2)")
		.style("opacity", 0)
		.style("pointer-events", "none");

	d3.csv("project_heart_disease.csv").then(function(data) {
		// Normalize column names
		data.forEach(d => {
			Object.keys(d).forEach(key => {
				let newKey = normalizeColumnName(key);
				if (newKey !== key) {
					d[newKey] = d[key];
					delete d[key];
				}
			});
		});

		// Remove rows with missing BMI or heart disease status
		data = data.filter(d => d.bmi && d.heart_disease_status);
		data.forEach(d => d.bmi = +d.bmi);

		// Group data into BMI bins
		var bins = d3.histogram()
			.value(d => d.bmi)
			.domain([d3.min(data, d => d.bmi), d3.max(data, d => d.bmi)])
			.thresholds(numBins)(data);

		// Prepare stacked data
		var stackedData = bins.map(bin => {
			return {
				bmi: bin.x0,
				x1: bin.x1, // Add the end of the bin
				No: bin.filter(d => d.heart_disease_status === "No").length,
				Yes: bin.filter(d => d.heart_disease_status === "Yes").length
			};
		});

		// X scale
		var x = d3.scaleBand()
			.domain(stackedData.map(d => d.bmi))
			.range([0, width])
			.padding(0.1);

		// Y scale
		var y = d3.scaleLinear()
			.domain([0, d3.max(stackedData, d => d.No + d.Yes)])
			.nice()
			.range([height, 0]);

		// Add faint horizontal grid lines for the y-axis **(Appended first)**
		svg4.append("g")
			.attr("class", "grid")
			.call(d3.axisLeft(y)
			.tickSize(-width)
			.tickFormat(""));

		svg4.append("g")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(x).tickFormat(d3.format("d")))
			.selectAll("text").style("text-anchor", "middle");

		svg4.append("g")
		.call(d3.axisLeft(y));	

		// Colors
		var color = d3.scaleOrdinal()
			.domain(["No", "Yes"])
			.range(["#5bc0de", "#d9534f"]);

		// Stack the data
		var series = d3.stack()
			.keys(["No", "Yes"])(stackedData);

		// Draw the bars
		svg4.append("g")
			.selectAll("g")
			.data(series)
			.enter().append("g")
			.attr("fill", d => color(d.key))
			.selectAll("rect")
			.data(d => d)
			.enter().append("rect")
			.attr("x", d => x(d.data.bmi))
			.attr("y", d => y(d[1]))
			.attr("height", d => y(d[0]) - y(d[1]))
			.attr("width", x.bandwidth())
			.on("mouseover", function(event, index) {
				const d = this.__data__;
				const heartDiseaseStatus = d3.select(this.parentNode).datum().key;
				const count = d.data[heartDiseaseStatus];
				const bmiStart = d.data.bmi.toFixed(1);
				const bmiEnd = d.data.x1.toFixed(1);
				const total = d.data.No + d.data.Yes;
				const percentage = ((count / total) * 100).toFixed(1);

				let statusText = "";
				if (heartDiseaseStatus === "Yes") {
					statusText = "Has Heart Disease";
				} else {
					statusText = "No Heart Disease";
				}

				tooltip.transition()
					.duration(200)
					.style("opacity", 1);
				tooltip.html(`
				<strong>BMI:</strong> ${bmiStart} to ${bmiEnd}<br>
				<strong>${statusText}:</strong> ${count} (${percentage}%)`)
					.style("left", (event.pageX + 10) + "px")
					.style("top", (event.pageY - 10) + "px");
				d3.select(this).style("stroke", "black").style("opacity", 0.8);
			})
			.on("mousemove", function(event) {
				tooltip.style("left", (event.pageX + 10) + "px")
				.style("top", (event.pageY - 10) + "px");
			})
			.on("mouseleave", function() {
				tooltip.transition()
				.duration(500)
				.style("opacity", 0);
				d3.select(this).style("stroke", "none").style("opacity", 1);
			});

		// Add legend
		const legend = svg4.append("g")
			.attr("transform", `translate(${width + 20}, ${margin.top})`);

		legend.append("rect")
			.attr("width", 150)
			.attr("height", 70)
			.attr("fill", "#fff")
			.attr("stroke", "#ccc")
			.attr("stroke-width", 1)
			.attr("rx", 8);

		legend.append("text")
			.attr("x", 10)
			.attr("y", 20)
			.attr("font-size", "13px")
			.attr("font-weight", "bold")
			.text("Heart Disease Status?");

		["Yes", "No"].forEach((key, i) => {
			const row = legend.append("g")
				.attr("transform", `translate(10, ${(i + 1) * 20 + 10})`);

			row.append("rect")
				.attr("width", 15)
				.attr("height", 15)
				.attr("fill", color(key));

			row.append("text")
				.attr("x", 20)
				.attr("y", 12)
				.style("font-size", "12px")
				.text(key);
		});

		// Add Y axis label
		svg4.append("text")
			.attr("transform", "rotate(-90)")
			.attr("x", -height / 2)
			.attr("y", -margin.left + 15)
			.attr("text-anchor", "middle")
			.style("font-size", "14px")
			.text("Number of Individuals");

		// Add X axis label
		svg4.append("text")
			.attr("x", width / 2)
			.attr("y", height + margin.bottom - 5)
			.attr("text-anchor", "middle")
			.style("font-size", "14px")
			.text("BMI bins"); // Changed X axis label to BMI
	});
}

// Initial draw with 10 bins
drawChart(10);

// Update chart on slider change
const binSlider = document.getElementById("binSlider");
const binCountSpan = document.getElementById("binCount");

binSlider.addEventListener("input", function() {
	const numBins = +this.value;
	binCountSpan.textContent = numBins;
	drawChart(numBins);
});