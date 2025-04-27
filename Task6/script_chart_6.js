// Set up the dimensions and margins of the graph
var margin = { top: 30, right: 180, bottom: 40, left: 60 }; // Increased right margin to accommodate the legend.
var width = 700 - margin.left - margin.right; // Calculate the effective width of the chart area.
var height = 400 - margin.top - margin.bottom; // Calculate the effective height of the chart area.

// Select the container div where the chart will be appended.
const container = d3.select("#chart_6");

// Function to normalize column names by trimming whitespace, converting to lowercase,
// replacing spaces with underscores, and removing any non-alphanumeric characters (except underscore).
function normalizeColumnName(name) {
	return name.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

// Function to draw the stacked bar chart with a specified number of BMI bins.
function drawChart(numBins) {
	// Remove any existing SVG elements from the container to redraw the chart.
	container.selectAll("svg").remove();

	// Append the main SVG element to the container div.
	var svg4 = container
		.append("svg")
		.attr("width", width + margin.left + margin.right) // Set the total width of the SVG.
		.attr("height", height + margin.top + margin.bottom) // Set the total height of the SVG.
		.append("g") // Append a group element to apply margins.
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")"); // Apply the margin translation.

	// Append a tooltip div to the body, styled for displaying information on hover.
	var tooltip = d3.select("body")
		.append("div")
		.style("position", "absolute")
		.style("background", "white")
		.style("border", "1px solid #ccc")
		.style("padding", "5px")
		.style("border-radius", "5px")
		.style("box-shadow", "0px 0px 5px rgba(0,0,0,0.2)")
		.style("opacity", 0) // Initially hidden.
		.style("pointer-events", "none"); // Allows mouse events to pass through.

	// Load the data from the CSV file.
	d3.csv("project_heart_disease.csv").then(function (data) {
		// Normalize the column names in the dataset.
		data.forEach(d => {
			Object.keys(d).forEach(key => {
				let newKey = normalizeColumnName(key);
				if (newKey !== key) {
					d[newKey] = d[key];
					delete d[key];
				}
			});
		});

		// Filter out rows where 'bmi' or 'heart_disease_status' is missing.
		data = data.filter(d => d.bmi && d.heart_disease_status);
		// Convert the 'bmi' values to numbers for calculations.
		data.forEach(d => d.bmi = +d.bmi);

		// Group the data into BMI bins using d3.histogram.
		var bins = d3.histogram()
			.value(d => d.bmi) // Specify the value to bin.
			.domain([d3.min(data, d => d.bmi), d3.max(data, d => d.bmi)]) // Set the domain based on the data range.
			.thresholds(numBins)(data); // Set the number of bins.

		// Prepare the data for stacking. For each bin, count the number of individuals
		// with and without heart disease. Also include the start and end of the BMI range for each bin.
		var stackedData = bins.map(bin => {
			return {
				bmi: bin.x0, // Start of the BMI bin.
				x1: bin.x1, // End of the BMI bin.
				No: bin.filter(d => d.heart_disease_status === "No").length, // Count without heart disease.
				Yes: bin.filter(d => d.heart_disease_status === "Yes").length // Count with heart disease.
			};
		});

		// Set the X scale as a band scale, mapping the BMI bin starts to the chart width.
		var x = d3.scaleBand()
			.domain(stackedData.map(d => d.bmi)) // Use the BMI start values as domain.
			.range([0, width]) // Map to the chart width.
			.padding(0.1); // Add some padding between the bars.

		// Set the Y scale as a linear scale, mapping the total count in each bin to the chart height.
		var y = d3.scaleLinear()
			.domain([0, d3.max(stackedData, d => d.No + d.Yes)]) // Domain is the maximum total count in any bin.
			.nice() // Round the domain to nice numbers.
			.range([height, 0]); // Map to the chart height (inverted).

		// Add faint horizontal grid lines for the y-axis, appended before the actual y-axis
		// to ensure they are in the background.
		svg4.append("g")
			.attr("class", "grid")
			.call(d3.axisLeft(y)
				.tickSize(-width) // Make the grid lines span the entire width.
				.tickFormat("")); // Don't show tick labels for grid lines.

		// Add the X axis to the SVG and position it at the bottom. Format the tick labels as integers
		// and adjust text anchor for better readability.
		svg4.append("g")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(x).tickFormat(d3.format("d")))
			.selectAll("text").style("text-anchor", "middle");

		// Add the Y axis to the SVG.
		svg4.append("g")
			.call(d3.axisLeft(y));

		// Define the color scale for the heart disease status categories.
		var color = d3.scaleOrdinal()
			.domain(["No", "Yes"])
			.range(["#5bc0de", "#d9534f"]); // Blue for "No", Red for "Yes".

		// Stack the data using d3.stack, specifying the keys to stack ("No" and "Yes").
		var series = d3.stack()
			.keys(["No", "Yes"])(stackedData);

		// Create groups for each segment of the stacked bars.
		svg4.append("g")
			.selectAll("g")
			.data(series)
			.enter().append("g")
			.attr("fill", d => color(d.key)) // Set the fill color based on the heart disease status.
			.selectAll("rect")
			.data(d => d) // Bind the data for each segment.
			.enter().append("rect")
			.attr("x", d => x(d.data.bmi)) // Set the x-position based on the BMI bin start.
			.attr("y", d => y(d[1])) // Set the y-position of the top edge of the bar segment.
			.attr("height", d => y(d[0]) - y(d[1])) // Set the height of the bar segment.
			.attr("width", x.bandwidth()) // Set the width of the bar.
			// Add mouseover event to display the tooltip.
			.on("mouseover", function (event, index) {
				const d = this.__data__; // Access the data bound to the current rectangle.
				const heartDiseaseStatus = d3.select(this.parentNode).datum().key; // Get the key ("Yes" or "No").
				const count = d.data[heartDiseaseStatus]; // Get the count for the current status in the bin.
				const bmiStart = d.data.bmi.toFixed(1); // Format BMI start.
				const bmiEnd = d.data.x1.toFixed(1); // Format BMI end.
				const total = d.data.No + d.data.Yes; // Total in the bin.
				const percentage = ((count / total) * 100).toFixed(1); // Calculate percentage.

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
				d3.select(this).style("stroke", "black").style("opacity", 0.8); // Add stroke and reduce opacity on hover.
			})
			// Add mousemove event to update the tooltip position.
			.on("mousemove", function (event) {
				tooltip.style("left", (event.pageX + 10) + "px")
					.style("top", (event.pageY - 10) + "px");
			})
			// Add mouseleave event to hide the tooltip and reset bar style.
			.on("mouseleave", function () {
				tooltip.transition()
					.duration(500)
					.style("opacity", 0);
				d3.select(this).style("stroke", "none").style("opacity", 1); // Remove stroke and reset opacity.
			});

		// Add legend to the chart.
		const legend = svg4.append("g")
			.attr("transform", `translate(${width + 20}, ${margin.top})`);

		// Add a background rectangle for the legend.
		legend.append("rect")
			.attr("width", 150)
			.attr("height", 70)
			.attr("fill", "#fff")
			.attr("stroke", "#ccc")
			.attr("stroke-width", 1)
			.attr("rx", 8);

		// Add the title for the legend.
		legend.append("text")
			.attr("x", 10)
			.attr("y", 20)
			.attr("font-size", "13px")
			.attr("font-weight", "bold")
			.text("Heart Disease Status?");

		// Create legend items for "Yes" and "No" heart disease status.
		["Yes", "No"].forEach((key, i) => {
			const row = legend.append("g")
				.attr("transform", `translate(10, ${(i + 1) * 20 + 10})`);

			row.append("rect")
				.attr("width", 15)
				.attr("height", 15)
				.attr("fill", color(key)); // Use the color corresponding to the status.

			row.append("text")
				.attr("x", 20)
				.attr("y", 12)
				.style("font-size", "12px")
				.text(key);
		});

		// Add label for the Y axis.
		svg4.append("text")
			.attr("transform", "rotate(-90)")
			.attr("x", -height / 2)
			.attr("y", -margin.left + 15)
			.attr("text-anchor", "middle")
			.style("font-size", "14px")
			.text("Number of Individuals");

		// Add label for the X axis.
		svg4.append("text")
			.attr("x", width / 2)
			.attr("y", height + margin.bottom - 5)
			.attr("text-anchor", "middle")
			.style("font-size", "14px")
			.text("BMI bins"); // Label the X axis as BMI bins.
	});
}

// Initial draw of the chart with 10 bins.
drawChart(10);

// Get references to the slider and the span displaying the bin count.
const binSlider = document.getElementById("binSlider");
const binCountSpan = document.getElementById("binCount");

// Add an event listener to the slider to redraw the chart whenever the slider value changes.
binSlider.addEventListener("input", function () {
	const numBins = +this.value; // Get the current value of the slider.
	binCountSpan.textContent = numBins; // Update the displayed bin count.
	drawChart(numBins); // Redraw the chart with the new number of bins.
});