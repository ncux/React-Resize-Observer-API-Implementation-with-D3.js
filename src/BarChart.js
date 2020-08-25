import React, { useRef, useEffect, useState } from "react";
import { select, axisBottom, axisRight, scaleLinear, scaleBand } from "d3";
// I test on Firefox and Chrome only, but the next package may be necessary for Edge and Safari
// npm i resize-observer-polyfill
import ResizeObserver from "resize-observer-polyfill";

// custom hook to resize our chart; put in a separate file
export const useResizeObserver = ref => {

  const [dimensions, setDimensions] = useState(null);  // dimensions refers to the width & height

  useEffect(() => {

    const observee = ref.current; // grab the svg

    const resizeObserver = new ResizeObserver(entries => {
      entries.forEach(entry => setDimensions(entry.contentRect));
    });

    resizeObserver.observe(observee);

    // cancel the listener to avoid memory leak
    return () => {
      resizeObserver.unobserve(observee);
    };
  }, [ref]);

  return dimensions;
};


// use any chart component (except the Pie chart)
const BarChart = ({ data }) => {

  const svgRef = useRef();
  const divContainerRef = useRef(); // will nest svgRef inside divContainerRef
  const dimensions = useResizeObserver(divContainerRef);

  const resizeChart = () => {

    const svg = select(svgRef.current);
    // console.log(dimensions);

    if (!dimensions) return;

    // scales
    const xScale = scaleBand()
        .domain(data.map((value, index) => index))
        .range([0, dimensions.width]) // change
        .padding(0.5);

    const yScale = scaleLinear()
        .domain([0, 150]) // todo
        .range([dimensions.height, 0]); // change

    const colorScale = scaleLinear()
        .domain([75, 100, 150])
        .range(["green", "orange", "red"])
        .clamp(true);

    // create x-axis
    const xAxis = axisBottom(xScale).ticks(data.length);
    svg.select(".x-axis").style("transform", `translateY(${dimensions.height}px)`).call(xAxis);

    // create y-axis
    const yAxis = axisRight(yScale);
    svg.select(".y-axis").style("transform", `translateX(${dimensions.width}px)`).call(yAxis);

    // plot the bars
    svg
        .selectAll(".bar")
        .data(data)
        .join("rect")
        .attr("class", "bar")
        .style("transform", "scale(1, -1)")
        .attr("x", (value, index) => xScale(index))
        .attr("y", -dimensions.height)
        .attr("width", xScale.bandwidth())
        .on("mouseenter", (value, index) => {
          svg
              .selectAll(".tooltip")
              .data([value])
              .join(enter => enter.append("text").attr("y", yScale(value) - 4))
              .attr("class", "tooltip")
              .text(value)
              .attr("x", xScale(index) + xScale.bandwidth() / 2)
              .attr("text-anchor", "middle")
              .transition()
              .attr("y", yScale(value) - 8)
              .attr("opacity", 1);
        })
        .on("mouseleave", () => svg.select(".tooltip").remove())
        .transition()
        .attr("fill", colorScale)
        .attr("height", value => dimensions.height - yScale(value));

  };

  // will be called on page load and on after every data change
  useEffect(() => {
    resizeChart();
  }, [data, dimensions]);

  return (
    // wrap the svg in a div because the API fails to recognize the svg; it's a bug, I guess
    <div ref={ divContainerRef } style={{ marginBottom: "2rem" }}>
      <svg ref={ svgRef }>
        <g className="x-axis" />
        <g className="y-axis" />
      </svg>
    </div>
  );
}

export default BarChart;
