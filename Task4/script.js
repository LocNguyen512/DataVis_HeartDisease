d3.csv("project_heart_disease.csv").then(data => {
    const svg = d3.select("#chart2"),
        margin = { top: 30, right: 30, bottom: 50, left: 60 },
        width = 700,
        height = +svg.attr("height") - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const filtered = data.filter(d => d["Exercise Habits"] && d["Heart Disease Status"]);
    const groupOrder = ["Low", "Medium", "High"];

    const counts = d3.rollup(
        filtered,
        v => ({
            Yes: v.filter(d => d["Heart Disease Status"] === "Yes").length,
            No: v.filter(d => d["Heart Disease Status"] === "No").length
        }),
        d => d["Exercise Habits"]
    );

    const processedData = groupOrder.map(key => {
        const value = counts.get(key);
        const total = value ? value.Yes + value.No : 1;
        return {
            group: key,
            Yes: value ? value.Yes : 0,
            No: value ? value.No : 0,
            total: value ? value.Yes + value.No : 0
        };
    });

    const x0 = d3.scaleBand().domain(groupOrder).range([0, width]).padding(0.1);
    const maxCount = d3.max(processedData, d => d.total);
    const y = d3.scaleLinear().domain([0, maxCount]).nice().range([height, 0]);
    const color = d3.scaleOrdinal().domain(["Yes", "No"]).range(["#d9534f", "#5bc0de"]);

    g.append("g").attr("transform", `translate(0,${height})`)
     .call(d3.axisBottom(x0)).selectAll("text").style("font-size", "14px");

    g.append("g").call(d3.axisLeft(y).ticks(10))
     .selectAll("text").style("font-size", "14px");

    svg.append("text").attr("transform", "rotate(-90)")
        .attr("x", - (margin.top + height / 2)).attr("y", 13)
        .attr("text-anchor", "middle")
        .style("font-size", "18px").style("font-weight", "bold")
        .text("Heart Disease Count");

    g.append("g").attr("class", "grid")
     .call(d3.axisLeft(y).tickSize(-width).tickFormat(""));

    svg.append("text")
        .attr("x", margin.left + width / 2)
        .attr("y", height + margin.top + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "18px").style("font-weight", "bold")
        .text("Exercise Habits");

    const stack = d3.stack().keys(["No", "Yes"]);
    const series = stack(processedData);

    g.selectAll(".serie")
        .data(series)
        .join("g")
        .attr("fill", d => color(d.key))
        .selectAll("rect")
        .data(d => d)
        .join("rect")
        .attr("x", d => x0(d.data.group))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x0.bandwidth())
        .on("mouseover", function (event, d) {
            const key = d3.select(this.parentNode).datum().key;
            const value = d.data[key];
            const percent = (value / d.data.total * 100).toFixed(1);
            d3.select("#tooltip").style("opacity", 1)
                .html(`
                    <strong>Exercise: </strong> ${d.data.group}<br/>
                    <strong>Heart Disease Status:</strong> ${key}<br/>
                    <strong>Count:</strong> ${value}<br/>
                    <strong>Percentage:</strong> ${percent}%<br/>
                    <strong>Total in group:</strong> ${d.data.total}
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 40) + "px");
            d3.select(this).attr("opacity", 0.85);
        })
        .on("mousemove", function(event) {
            d3.select("#tooltip")
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 40) + "px");
        })
        .on("mouseout", function() {
            d3.select("#tooltip").style("opacity", 0);
            d3.select(this).attr("opacity", 1);
        });

    g.selectAll(".percent-label")
        .data(series.flatMap(s => s.map(d => ({
            key: s.key,
            x: x0(d.data.group) + x0.bandwidth() / 2,
            y: y((d[0] + d[1]) / 2),
            value: (d.data[s.key] / d.data.total * 100).toFixed(1) + "%"
        }))))
        .join("text")
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .attr("text-anchor", "middle")
        .attr("fill", "#fff")
        .style("font-size", "14px")
        .text(d => d.value);

    const legend = svg.append("g")
        .attr("transform", `translate(${margin.left + width + 30}, ${margin.top})`);

    legend.append("rect")
        .attr("x", -10).attr("y", -20)
        .attr("width", 200).attr("height", 90)
        .attr("fill", "#fff").attr("stroke", "#ccc")
        .attr("stroke-width", 1).attr("rx", 8);

    legend.append("text")
        .attr("x", 0).attr("y", 0)
        .attr("font-size", "18px").attr("font-weight", "bold")
        .text("Heart Disease Status");

    ["Yes", "No"].forEach((key, i) => {
        const row = legend.append("g").attr("transform", `translate(0, ${(i + 1) * 20})`);
        row.append("rect").attr("width", 18).attr("height", 15).attr("fill", color(key));
        row.append("text").attr("x", 20).attr("y", 12).text(key);
    });
});