// Select the SVG element from the HTML document.
const svg = d3.select("svg"),
    // Define margins for the chart to provide space for axes and labels.
    margin = { top: 30, right: 30, bottom: 50, left: 60 },
    // Define the total width of the SVG container.
    width = 700,
    // Calculate the height of the drawing area within the SVG, considering margins.
    // It subtracts the top and bottom margins from the SVG's specified height.
    height = +svg.attr("height") - margin.top - margin.bottom,
    // Append a 'g' (group) element to the SVG. This group will contain the main chart elements.
    // Translate this group by the left and top margins to position the chart correctly within the SVG.
    g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

// Load data from the specified CSV file asynchronously.
// The '.then()' method executes the provided function once the data is loaded.
d3.csv("project_heart_disease.csv").then(rawData => {
    // Define the age groups that will be used for categorization.
    const ageGroups = ["18–35", "36–55", ">55"];
    // Initialize an object to store the counts and total for each age group and status.
    const grouped = {
        "18–35": { Yes: 0, No: 0, total: 0 },
        "36–55": { Yes: 0, No: 0, total: 0 },
        ">55": { Yes: 0, No: 0, total: 0 }
    };

    // Iterate over each row in the loaded raw data.
    rawData.forEach(d => {
        // Extract the 'Age' value and convert it to a number.
        const age = +d["Age"];
        // Extract the 'Heart Disease Status' value.
        const status = d["Heart Disease Status"];
        // Initialize a variable to hold the determined age group.
        let group = null;
        // Determine the age group based on the age value.
        if (age >= 18 && age <= 35) group = "18–35";
        else if (age >= 36 && age <= 55) group = "36–55";
        else if (age > 55) group = ">55";
        // If a group was determined and the status is either "Yes" or "No",
        // increment the count for that status within the group and the total for the group.
        if (group && (status === "Yes" || status === "No")) {
            grouped[group][status]++;
            grouped[group].total++;
        }
    });

    // Prepare the data in a format suitable for D3 binding, calculating percentages.
    const data = [];
    // Iterate over the defined age groups.
    ageGroups.forEach(group => {
        // Get the total count for the current age group (default to 1 to avoid division by zero if total is 0).
        const total = grouped[group].total || 1;
        // Iterate over the possible statuses ("Yes", "No").
        ["Yes", "No"].forEach(status => {
            // Get the count for the current status within the age group.
            const count = grouped[group][status];
            // Calculate the percentage of this status within the age group.
            const percent = count / total * 100;
            // Push an object into the data array with the age group, status, calculated percentage, count, and total.
            data.push({ ageGroup: group, status, value: percent, count: count, total: total });
        });
    });

    // Define the first x-axis scale (band scale) for the age groups.
    // It maps the age groups to positions along the x-axis.
    const x0 = d3.scaleBand()
        .domain(ageGroups) // The categories are the age groups.
        .range([0, width]) // The output range is from 0 to the width of the chart area.
        .paddingInner(0.1); // Adds padding between the outer groups (age groups).

    // Define the second x-axis scale (band scale) for the statuses ("Yes", "No") within each age group.
    // It maps the statuses to positions within the band allocated for each age group by x0.
    const x1 = d3.scaleBand()
        .domain(["Yes", "No"]) // The categories are the heart disease statuses.
        .range([0, x0.bandwidth()]) // The output range is the width of a single band from x0.
        .padding(0.05); // Adds padding between the inner bands (status bars).

    // Define the y-axis scale (linear scale) for the percentage values.
    const y = d3.scaleLinear()
        .domain([0, 100]) // The input data range is from 0% to 100%.
        .range([height, 0]); // The output range is from the bottom of the chart area (height) to the top (0), as Y=0 is at the top in SVG.

    // Define an ordinal color scale to map "Yes" and "No" statuses to specific colors.
    const color = d3.scaleOrdinal()
        .domain(["Yes", "No"]) // The categories are the heart disease statuses.
        .range(["#d9534f", "#5bc0de"]); // Assigns specific hex colors to "Yes" and "No".

    // Append a group element for the x-axis.
    g.append("g")
        // Position the x-axis at the bottom of the chart area.
        .attr("transform", `translate(0,${height})`)
        // Call the d3.axisBottom function with the x0 scale to generate the x-axis visuals.
        .call(d3.axisBottom(x0))
        // Select all text elements within the x-axis group (the tick labels).
        .selectAll("text")
        // Increase the font size of the x-axis tick labels.
        .style("font-size", "14px");

    // Append a group element for the y-axis.
    g.append("g")
        // Call the d3.axisLeft function with the y scale to generate the y-axis visuals.
        // Specify the number of ticks and format them as percentages.
        .call(d3.axisLeft(y).ticks(10).tickFormat(d => d + "%"))
        // Select all text elements within the y-axis group (the tick labels).
        .selectAll("text")
        // Increase the font size of the y-axis tick labels.
        .style("font-size", "14px");

    // Append a text element to the main SVG (outside the 'g' group) for the y-axis label.
    svg.append("text")
        // Rotate the text by -90 degrees for vertical orientation.
        .attr("transform", "rotate(-90)")
        // Position the text horizontally (after rotation, this is the vertical position) centered relative to the chart height.
        .attr("x", - (margin.top + height / 2))
        // Position the text vertically (after rotation, this is the horizontal position) relative to the left margin.
        .attr("y", 13) // Position relative to the SVG's top-left corner.
        // Anchor the text in the middle, ensuring the rotation pivots correctly around the center.
        .attr("text-anchor", "middle")
        // Set the font size for the label.
        .style("font-size", "18px")
        // Set the font weight to bold.
        .style("font-weight", "bold")
        // Set the text content of the label.
        .text("Heart Disease Proportion (%)");

    // Append a group element for the grid lines.
    g.append("g")
        // Add a CSS class for potential styling.
        .attr("class", "grid")
        // Call the d3.axisLeft function using the y scale to generate grid lines.
        .call(
            d3.axisLeft(y)
                // Extend the tick lines across the entire width of the chart.
                .tickSize(-width)
                // Do not display tick labels for the grid lines.
                .tickFormat("")
        );

    // Append a text element to the main SVG for the x-axis label.
    svg.append("text")
        // Position the text horizontally centered below the chart area.
        .attr("x", margin.left + width / 2)
        // Position the text vertically below the chart area, accounting for margins and desired spacing.
        .attr("y", height + margin.top + 40)
        // Anchor the text in the middle for horizontal centering.
        .attr("text-anchor", "middle")
        // Set the font size for the label.
        .style("font-size", "18px")
        // Set the font weight to bold.
        .style("font-weight", "bold")
        // Set the text content of the label.
        .text("Age groups");

    // Create groups for each age group within the main chart group 'g'.
    // Use d3.groups to group the 'data' array by 'ageGroup'.
    // Select elements with class "ageGroup" (which don't exist yet), bind the grouped data, and create new 'g' elements for each group.
    const groups = g.selectAll(".ageGroup")
        .data(d3.groups(data, d => d.ageGroup)) // Data is structured as [key, values_array] for each group.
        .join("g") // Create a 'g' element for each age group.
        // Position each age group 'g' element horizontally based on the x0 scale.
        .attr("transform", d => `translate(${x0(d[0])},0)`); // d[0] is the age group key.

    // Select rectangles within each age group.
    // Bind the inner data (d[1], the array of {ageGroup, status, value, count, total} objects for this group) to the rect elements.
    // Create new 'rect' elements for each data point (i.e., for "Yes" and "No" within each age group).
    groups.selectAll("rect")
        .data(d => d[1]) // Bind the array of data points for the current age group.
        .join("rect") // Create a 'rect' element for each status ("Yes", "No").
        .attr("class", "bar") // Add a class for potential styling.
        // Set the x position of the bar within its age group band using the x1 scale.
        .attr("x", d => x1(d.status))
        // Set the y position (top edge) of the bar using the y scale (percentage).
        .attr("y", d => y(d.value))
        // Set the width of the bar using the bandwidth from the x1 scale.
        .attr("width", x1.bandwidth())
        // Set the height of the bar based on the difference between the chart bottom (height) and the bar's top (y(d.value)).
        .attr("height", d => height - y(d.value))
        // Set the fill color of the bar using the color scale based on the status.
        .attr("fill", d => color(d.status))
        // Add a mouseover event listener for interactivity (tooltip and opacity change).
        .on("mouseover", function (event, d) {
            // Select the tooltip element by its ID.
            d3.select("#tooltip")
                // Make the tooltip visible by setting its opacity to 1.
                .style("opacity", 1)
                // Set the HTML content of the tooltip using data from the hovered bar (d).
                .html(`
                    <strong>Age Group:</strong> ${d.ageGroup}<br/>
                    <strong>Heart Disease Status:</strong> ${d.status}<br/>
                    <strong>Count:</strong> ${d.count}<br/>
                    <strong>Percentage:</strong> ${d.value.toFixed(1)}%<br/>
                    <strong>Total in group:</strong> ${d.total}
                `)
                // Position the tooltip based on the mouse event's page coordinates.
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 40) + "px");
            // Select the hovered bar itself using 'this' and reduce its opacity slightly.
            d3.select(this).attr("opacity", 0.85);
        })
        // Add a mousemove event listener to update the tooltip position as the mouse moves over the bar.
        .on("mousemove", function (event) {
            d3.select("#tooltip")
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 40) + "px");
        })
        // Add a mouseout event listener to hide the tooltip and reset bar opacity when the mouse leaves the bar.
        .on("mouseout", function () {
            // Hide the tooltip by setting its opacity back to 0.
            d3.select("#tooltip").style("opacity", 0);
            // Reset the bar's opacity back to its original value (1).
            d3.select(this).attr("opacity", 1);
        });

    // Add text labels *inside* the bars to show the count.
    // Select text elements with class "label" within each age group (these don't exist initially).
    // Bind the inner data (same as bars) to the text elements.
    // Create new 'text' elements for each data point ("Yes" and "No" within each group).
    groups.selectAll("text.label")
        .data(d => d[1]) // Bind the array of data points for the current age group.
        .join("text") // Create a 'text' element for each status ("Yes", "No").
        // Set the x position of the text label to be centered horizontally within its bar.
        .attr("x", d => x1(d.status) + x1.bandwidth() / 2)
        // Set the y position of the text label to be centered vertically within its bar.
        .attr("y", d => y(d.value) + (height - y(d.value)) / 2 + 5) // y(d.value) is top of bar, height is bottom, +5 is slight vertical adjustment.
        // Anchor the text in the middle horizontally.
        .attr("text-anchor", "middle")
        // Set the text color to white for visibility against the colored bars.
        .attr("fill", "#fff")
        // Set the font size for the labels.
        .style("font-size", "20px")
        // Set the text content of the label to the count value.
        .text(d => `${d.count}`); // Displays the raw count, not the percentage.

    // Add a legend to explain the colors.
    // Append a group element for the legend to the main SVG.
    const legend = svg.append("g")
        // Position the legend group to the right of the chart area.
        .attr("transform", `translate(${margin.left + width + 30}, ${margin.top})`);

    // Add a background rectangle for the legend to give it visual structure.
    legend.append("rect")
        // Set slightly negative x and y to provide padding around the content.
        .attr("x", -10)
        .attr("y", -20)
        // Set the width and height of the background rectangle.
        .attr("width", 200)
        .attr("height", 90)
        // Set the fill color to white.
        .attr("fill", "#fff")
        // Add a light grey stroke border.
        .attr("stroke", "#ccc")
        // Set the stroke width.
        .attr("stroke-width", 1)
        // Add rounded corners to the rectangle.
        .attr("rx", 8);

    // Add a title for the legend.
    legend.append("text")
        .attr("x", 0) // Position relative to the legend group's origin.
        .attr("y", 0) // Position relative to the legend group's origin.
        .attr("font-size", "18px") // Set font size.
        .attr("font-weight", "bold") // Set font weight.
        .text("Heart Disease Status"); // Set text content.

    // Add legend items for "Yes" and "No" statuses.
    ["Yes", "No"].forEach((key, i) => {
        // Create a group element for each legend row.
        const row = legend.append("g")
            // Position each row vertically below the title.
            .attr("transform", `translate(0, ${(i + 1) * 20})`); // Position relative to the legend group, spaced out.

        // Add a colored rectangle (swatch) for the status color.
        row.append("rect")
            .attr("width", 18) // Set width of the color swatch.
            .attr("height", 15) // Set height of the color swatch.
            .attr("fill", color(key)); // Fill with the color corresponding to the status key ("Yes" or "No").

        // Add text label for the status next to the color swatch.
        row.append("text")
            .attr("x", 20) // Position horizontally slightly to the right of the swatch.
            .attr("y", 12) // Position vertically, aligned with the swatch.
            .text(key); // Set the text content to the status key ("Yes" or "No").
    });
}); // End of the d3.csv().then() block.