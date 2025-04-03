d3.csv("project_heart_disease.csv").then(function (data) {
    console.log("Dữ liệu CSV:", data);
    
    // Lọc dữ liệu, loại bỏ những dòng có "Family Heart Disease" trống
    data = data.filter(d => d["Family Heart Disease"] !== "");
    
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
        .attr("height", height);

    // Scale trục X
    const xScale = d3.scaleBand()
        .domain(transformedData.map(d => d["Family History"]))
        .range([margin.left, width - margin.right - 200])
        .padding(0.4);

    // Scale trục Y
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(transformedData, d => d.Total)])
        .nice()
        .range([height - margin.bottom, margin.top]);

    // Màu sắc cột
    const color = d3.scaleOrdinal()
        .domain(["Yes", "No"])
        .range(["#d9534f", "#5bc0de"]);

    // Tooltip
    const tooltip = d3.select(".tooltip");

    // Thêm lưới cho trục Y và thay đổi màu sắc
    svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale)
            .tickSize(-width + 300 )
            .tickFormat("")
        )
        .selectAll(".tick line")  // Chọn các đường kẻ (line) của trục Y
        .style("stroke", "#cccccc")  // Màu sắc đường lưới
        .style("stroke-width", "1px");  // Độ dày của đường lưới

    // Vẽ cột chồng
    const group = svg.selectAll("g.bar-group")
        .data(transformedData)
        .enter().append("g")
        .attr("class", "bar-group")
        .attr("transform", d => `translate(${xScale(d["Family History"])} ,0)`);

    // Vẽ cột chồng
    group.each(function (d) {
        let yStart = height - margin.bottom;
        let parent = d3.select(this);

        ["No", "Yes"].forEach(key => {
            let barHeight = height - margin.bottom - yScale(d[key]);

            parent.append("rect")
                .attr("x", 0)
                .attr("y", yStart - barHeight)
                .attr("height", barHeight)
                .attr("width", xScale.bandwidth())
                .attr("fill", color(key))
                .attr("class", "bar")
                .on("mouseover", function (event) {
                    tooltip.style("display", "block")
                        .html(`<strong> Category: </strong>${key === "Yes" ? "Heart Disease" : "No Heart Disease"}<br>
                            <strong>Family Heart Disease:</strong> ${d["Family History"]}<br>
                            <strong> Count:</strong> ${d[key]}<br>
                            <strong> Percentage: </strong> ${((d[key] / d.Total) * 100).toFixed(1)}%<br>
                            <strong>Total in group:</strong> ${d.Total}`);
                    
                    d3.select(this).style("opacity", 0.7);
                })
                .on("mousemove", function (event) {
                    tooltip.style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 20) + "px");
                })
                .on("mouseout", function () {
                    tooltip.style("display", "none");
                    d3.select(this).style("opacity", 1);
                });

            yStart -= barHeight;
        });
    });

    // Thêm trục X
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale));

    // Thêm trục Y
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

    // Thêm nhãn phần trăm vào cột
    group.each(function (d) {
        let yStart = height - margin.bottom;
        let parent = d3.select(this);

        ["No", "Yes"].forEach(key => {
            let barHeight = height - margin.bottom - yScale(d[key]);

            parent.append("text")
                .attr("x", xScale.bandwidth() / 2) // Canh giữa theo cột
                .attr("y", yStart - barHeight / 2) // Đặt ở giữa cột
                .attr("text-anchor", "middle") // Căn giữa text
                .attr("dy", "0.35em") // Điều chỉnh để chữ hiển thị chính xác hơn
                .style("fill", "white") // Màu chữ
                .style("font-size", "16px")
                .style("font-weight", "bold")
                .text(`${((d[key] / d.Total) * 100).toFixed(1)}%`);
            
            yStart -= barHeight;
        });
    });

    // Thêm chú thích (Legend)
    const legendContainer = svg.append("g")
        .attr("transform", `translate(${width - 210}, 70)`); // Điều chỉnh vị trí cho phù hợp

    // Thêm nền cho Legend (như trong phần trước)
    legendContainer.append("rect")
        .attr("width", 210)
        .attr("height", 110) 
        .attr("fill", "#ffffff")
        .attr("stroke", "#999")
        .attr("stroke-width", 1.5)
        .attr("rx", 12)
        .attr("ry", 12) 
        .attr("x", -10)
        .attr("y", -10);

    // Thêm tiêu đề cho Legend
    legendContainer.append("text")
        .attr("x", 10)
        .attr("y", 20)
        .attr("text-anchor", "start")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text("Heart Disease Status");

    // Thêm các mục Legend
    const legend = legendContainer.append("g")
        .attr("transform", "translate(10, 30)"); // Dịch xuống dưới tiêu đề

    legend.selectAll("rect")
        .data(["No", "Yes"])
        .enter().append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 30)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", d => color(d)); // Màu sắc cho các mục

    legend.selectAll("text")
        .data(["No", "Yes"])
        .enter().append("text")
        .attr("x", 30) // Cách chữ ra khỏi hình chữ nhật
        .attr("y", (d, i) => i * 30 + 15) // Điều chỉnh vị trí văn bản cho phù hợp
        .text(d => `Heart Disease: ${d}`)
        .style("font-weight", "bold")
        .style("font-size", "12px"); // Cỡ chữ nhỏ hơn
    
    // Thêm tiêu đề cho biểu đồ
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .text("Distribution of Heart Disease by Family History");
}).catch(function(error) {
    console.error("Lỗi khi tải CSV:", error);
});
