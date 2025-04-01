d3.csv("project_heart_disease.csv").then(data => {
    const filtered = data.filter(d => d["Gender"] && d["Heart Disease Status"]);
    const genderOrder = ["Female", "Male"];

    const counts = d3.rollup(
      filtered,
      v => ({
        Yes: v.filter(d => d["Heart Disease Status"] === "Yes").length,
        No: v.filter(d => d["Heart Disease Status"] === "No").length
      }),
      d => d["Gender"]
    );

    const processedData = genderOrder.map(key => {
      const value = counts.get(key);
      const total = value ? value.Yes + value.No : 1;
      return {
        group: key,
        Yes: value ? (value.Yes / total) * 100 : 0,
        No: value ? (value.No / total) * 100 : 0
      };
    });

    const svg = d3.select("#chartGender"),
          margin = {top: 40, right: 200, bottom: 70, left: 80},
          width = 700,
          height = 370;

    const x = d3.scaleBand()
      .domain(processedData.map(d => d.group))
      .range([margin.left, margin.left + width])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([margin.top + height, margin.top]);

    const color = d3.scaleOrdinal()
      .domain(["No", "Yes"])
      .range(["#5bc0de", "#d9534f"]);

    const stackedData = d3.stack().keys(["No", "Yes"])(processedData);

    const tooltip = d3.select("#tooltip");

    const bars = svg.append("g")
      .selectAll("g")
      .data(stackedData)
      .join("g")
      .attr("fill", d => color(d.key));

    bars.selectAll("rect")
      .data(d => d)
      .join("rect")
      .attr("x", d => x(d.data.group))
      .attr("y", d => y(d[1]))
      .attr("height", d => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth())
      .attr("class", "bar")
      .on("mouseover", function(event, d) {
        const key = this.parentNode.__data__.key;
        tooltip.style("opacity", 1)
          .html(`
            <strong>Giới tính:</strong> ${d.data.group}<br/>
            <strong>Tình trạng:</strong> ${key === "Yes" ? "Mắc bệnh tim" : "Không mắc bệnh"}<br/>
            <strong>Tỉ lệ:</strong> ${(d[1] - d[0]).toFixed(2)}%
          `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 40) + "px");
        d3.select(this).attr("opacity", 0.8);
      })
      .on("mousemove", function(event) {
        tooltip.style("left", (event.pageX + 10) + "px")
               .style("top", (event.pageY - 40) + "px");
      })
      .on("mouseout", function() {
        tooltip.style("opacity", 0);
        d3.select(this)
          .attr("opacity", 1)
          .style("transition", "opacity 0.3s ease");
      });

    // Add value labels on bars
    bars.selectAll("text")
      .data(d => d)
      .join("text")
      .attr("x", d => x(d.data.group) + x.bandwidth() / 2)
      .attr("y", d => (y(d[1]) + y(d[0])) / 2)
      .text(d => `${(d[1] - d[0]).toFixed(2)}%`)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .style("font-size", "15px");

    svg.append("text")
      .attr("x", margin.left + width / 2)
      .attr("y", margin.top + height + 40)
      .style("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Gender");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", margin.left - 70)
      .attr("x", -(margin.top + height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("% Heart Disease Proportion");

    svg.append("g")
      .attr("transform", `translate(0,${margin.top + height})`)
      .call(d3.axisBottom(x).tickSizeOuter(0))
      .selectAll("text")
      .style("font-size", "14px");

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => d + "%"))
      .selectAll("text")
      .style("font-size", "14px");

    const legend = svg.append("g")
      .attr("transform", `translate(${margin.left + width + 30}, ${margin.top})`);

    legend.append("rect")
      .attr("x", -10)
      .attr("y", -30)
      .attr("width", 160)
      .attr("height", 90)
      .attr("fill", "#fff")
      .attr("stroke", "#ccc")
      .attr("rx", 8)
      .attr("filter", "drop-shadow(0 0 3px rgba(0,0,0,0.1))");

    legend.append("text")
      .attr("x", 0)
      .attr("y", -10)
      .text("Heart Disease Status")
      .style("font-weight", "bold")
      .style("font-size", "15px");

    ["No", "Yes"].forEach((key, i) => {
      const g = legend.append("g").attr("transform", `translate(0, ${i * 30})`);
      g.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", color(key));

      g.append("text")
        .attr("x", 24)
        .attr("y", 14)
        .style("font-size", "14px")
        .text(key);
    });
  });