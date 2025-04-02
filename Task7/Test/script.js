d3.csv("project_heart_disease.csv").then(function (data) {
    console.log("Dữ liệu CSV:", data);

    // Chuyển đổi dữ liệu cần thiết
    data.forEach(d => {
        d.Age = +d.Age;
        d["Blood Pressure"] = +d["Blood Pressure"];
        d["Cholesterol Level"] = +d["Cholesterol Level"];
        d.BMI = +d.BMI;
    });

    // Nhóm dữ liệu theo Family History
    let groupedData = d3.rollups(
        data,
        v => ({
            "Yes": v.filter(d => d["Heart Disease Status"] === "Yes").length,
            "No": v.filter(d => d["Heart Disease Status"] === "No").length
        }),
        d => d["Family Heart Disease"]
    );

    let transformedData = groupedData.map(d => ({
        "Family History": d[0],
        "Yes": d[1]["Yes"],
        "No": d[1]["No"],
        "Total": d[1]["Yes"] + d[1]["No"]
    }));

    console.log("Dữ liệu đã nhóm:", transformedData);

    const width = 800, height = 600;
    const margin = { top: 50, right: 30, bottom: 50, left: 70 };

    const svg = d3.select("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("transform", "translate(200, 0)"); // Điều chỉnh vị trí bằng transform

    // Scale trục X
    const xScale = d3.scaleBand()
        .domain(transformedData.map(d => d["Family History"]))
        .range([margin.left, width - margin.right])
        .padding(0.2);

    // Scale con cho nhóm cột
    const subXScale = d3.scaleBand()
        .domain(["No", "Yes"])
        .range([0, xScale.bandwidth()])
        .padding(0.1);

    // Scale trục Y
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(transformedData, d => d.Total)])
        .nice()
        .range([height - margin.bottom, margin.top]);

    // Màu sắc cột
    const color = d3.scaleOrdinal()
        .domain(["No", "Yes"])
        .range(["green", "red"]);

    // Tooltip
    const tooltip = d3.select(".tooltip");

    // Nhóm các cột
    const group = svg.selectAll("g.bar-group")
        .data(transformedData)
        .enter().append("g")
        .attr("class", "bar-group")
        .attr("transform", d => `translate(${xScale(d["Family History"])},0)`);

    // Vẽ cột
    group.selectAll("rect")
        .data(d => ["No", "Yes"].map(key => ({
            key, 
            value: d[key], 
            percent: ((d[key] / d.Total) * 100).toFixed(1),
            total: d.Total
        })))
        .enter().append("rect")
        .attr("x", d => subXScale(d.key))
        .attr("y", d => yScale(d.value))
        .attr("height", d => height - margin.bottom - yScale(d.value))
        .attr("width", subXScale.bandwidth())
        .attr("fill", d => color(d.key))
        .attr("class", "bar")
        .on("mouseover", function(event, d) {
            tooltip.style("display", "block")
                .html(`<strong>${d.key === "Yes" ? "Heart Disease" : "No Heart Disease"}</strong><br>
                    Count: ${d.value}<br>
                    Percentage: ${d.percent}%`);
            d3.select(this).style("opacity", 0.7);
        })
        .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("display", "none");
            d3.select(this).style("opacity", 1);
        })
        .on("click", function(event, d) {
            d3.selectAll(".bar").classed("selected", false);
            d3.select(this).classed("selected", true);

            d3.select("#details-content").html(`
                <strong>Heart Disease:</strong> ${d.key}<br>
                <strong>Number of people:</strong> ${d.value}<br>
                <strong>Percentage:</strong> ${d.percent}%<br>
                <strong>Total in group:</strong> ${d.total}
            `);
        });

    // Thêm trục X
    svg.append("g")
        .attr("class", "axis") 
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .attr("class", "axis") 
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale));

    // Thêm tên trục X
    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .text("Family Heart Disease");

    // Thêm tên trục Y
    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", -height / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .style("font-weight", "bold")
        .text("Number of People");

    // Thêm chú thích (Legend)
    const legend = svg.append("g")
        .attr("transform", `translate(${width - 200}, 20)`);

    legend.selectAll("rect")
        .data(["No", "Yes"])
        .enter().append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 20)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", d => color(d));

    legend.selectAll("text")
        .data(["No", "Yes"])
        .enter().append("text")
        .attr("x", 20)
        .attr("y", (d, i) => i * 20 + 12)
        .text(d => `Heart Disease: ${d}`)
        .style("font-weight", "bold")
        .style("font-size", "16px");

}).catch(function(error) {
    console.error("Lỗi khi tải CSV:", error);
});
