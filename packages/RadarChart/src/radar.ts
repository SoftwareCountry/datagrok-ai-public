/////////////////////////////////////////////////////////
/////////////// The Radar Chart Function ////////////////
/// mthh - 2017 /////////////////////////////////////////
// Inspired by the code of alangrafu and Nadieh Bremer //
// (VisualCinnamon.com) and modified for d3 v4 //////////
/////////////////////////////////////////////////////////
import * as d3 from 'd3';

const sin = Math.sin;
const cos = Math.cos;
const HALF_PI = Math.PI / 2;

type RadarChartScaleFunc = {(x: RadarChartValue): number | undefined}

type RadarChartValue = string | number | Date | undefined;

type RadarChartLegend = false |
	{
		title: string,
		translateX: number,
		translateY: number
	}

export interface RadarChartAxis {
	axis: string,
	value: RadarChartValue
}

export interface RadarChartData {
	axes: RadarChartAxis[],
	name: string
}

export interface RadarChartConfig  {
	w?: number,				//Width of the circle
	h?: number,				//Height of the circle
	margin?: {top: number, right: number, bottom: number, left: number}, //The margins of the SVG
	levels?: number,				//How many levels or inner circles should there be drawn
	labelFactor?: number, 	//How much farther than the radius of the outer circle should the labels be placed
	wrapWidth?: number, 		//The number of pixels after which a label needs to be given a new line
	opacityArea?: number, 	//The opacity of the area of the blob
	dotRadius?: number, 			//The size of the colored circles of each blog
	opacityCircles?: number, 	//The opacity of the circles of each blob
	strokeWidth?: number, 		//The width of the stroke around each blob
	roundStrokes?: boolean,	//If true the area and stroke will follow a round path (cardinal-closed)
	color?: d3.ScaleOrdinal<number, string>,	//Color function,
	format?: string,
	unit?: string,
	legend?: RadarChartLegend,
	[key: string]: any
}

export class RadarChart {
	private readonly cfg = {
		w: 600,				//Width of the circle
		h: 600,				//Height of the circle
		margin: {top: 40, right: 50, bottom: 40, left: 50}, //The margins of the SVG
		levels: 3,				//How many levels or inner circles should there be drawn
		labelFactor: 1.1, 	//How much farther than the radius of the outer circle should the labels be placed
		wrapWidth: 60, 		//The number of pixels after which a label needs to be given a new line
		opacityArea: 0.35, 	//The opacity of the area of the blob
		dotRadius: 4, 			//The size of the colored circles of each blog
		opacityCircles: 0.1, 	//The opacity of the circles of each blob
		strokeWidth: 2, 		//The width of the stroke around each blob
		roundStrokes: false,	//If true the area and stroke will follow a round path (cardinal-closed)
		color: d3.scaleOrdinal<number, string>(d3.schemeCategory10),	//Color function,
		format: '.2%',
		unit: '',
		legend: false as RadarChartLegend
	};

	private readonly axisNames: string[];
	private readonly radius: number;
	private readonly angleSlice: number;
	private readonly rScales: {[key: string]: RadarChartScaleFunc};

	constructor(
		public readonly parent_selector: string,
		public readonly data: RadarChartData[],
		public readonly options?: RadarChartConfig
	) {
		this.updateConfig();

		this.axisNames = this.data[0].axes.map((i, _) => i.axis);
		const total = this.axisNames.length;
		this.radius = Math.min(
				this.cfg.w/2 - this.cfg.margin.left - this.cfg.margin.right,
				this.cfg.h/2 - this.cfg.margin.top - this.cfg.margin.bottom);
		this.angleSlice = Math.PI * 2 / total;
		this.rScales = this.getAxisScales();
	}

	public draw() {
		/////////////////////////////////////////////////////////
		//////////// Create the container SVG and g /////////////
		/////////////////////////////////////////////////////////
		const parent = d3.select(this.parent_selector);

		//Remove whatever chart with the same id/class was present before
		parent.select('svg').remove();

		//Initiate the radar chart SVG
		let svg = parent.append('svg')
				.attr('width',  this.cfg.w)
				.attr('height', this.cfg.h)
				.attr('class', 'radar');

		//Append a g element
		let g = svg.append('g')
				.attr('transform', 'translate(' + (this.cfg.w /2 + this.cfg.margin?.left) + ',' + (this.cfg.h/2 + this.cfg.margin.top) + ')');

		/////////////////////////////////////////////////////////
		////////// Glow filter for some extra pizzazz ///////////
		/////////////////////////////////////////////////////////

		//Filter for the outside glow
		let filter = g.append('defs').append('filter').attr('id','glow'),
			feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation','2.5').attr('result','coloredBlur'),
			feMerge = filter.append('feMerge'),
			feMergeNode_1 = feMerge.append('feMergeNode').attr('in','coloredBlur'),
			feMergeNode_2 = feMerge.append('feMergeNode').attr('in','SourceGraphic');

		/////////////////////////////////////////////////////////
		/////////////// Draw the Circular grid //////////////////
		/////////////////////////////////////////////////////////

		//Wrapper for the grid & axes
		let axisGrid = g.append('g').attr('class', 'axisWrapper');

		//Draw the background circles
		axisGrid.selectAll('.levels')
			.data(d3.range(1,(this.cfg.levels+1)).reverse())
			.enter()
				.append('circle')
				.attr('class', 'gridCircle')
				.attr('r', d => this.radius / this.cfg.levels * d)
				.style('fill', '#CDCDCD')
				.style('stroke', '#CDCDCD')
				.style('fill-opacity', this.cfg.opacityCircles)
				.style('filter' , 'url(#glow)');

		//Text indicating at what % each level is
		axisGrid.selectAll('.axisLabel')
			.data(d3.range(1,(this.cfg.levels+1)).reverse())
			.enter().append('text')
				.attr('class', 'axisLabel')
				.attr('x', 4)
				.attr('y', d => -d * this.radius / this.cfg.levels)
				.attr('dy', '0.4em')
				.style('font-size', '10px')
				.attr('fill', '#737373')
				.text(d => this.format(d / this.cfg.levels));

		/////////////////////////////////////////////////////////
		//////////////////// Draw the axes //////////////////////
		/////////////////////////////////////////////////////////

		//Create the straight lines radiating outward from the center
		const axis = axisGrid.selectAll('.axis')
			.data(this.axisNames)
			.enter()
			.append('g')
			.attr('class', 'axis');
		//Append the lines
		axis.append('line')
			.attr('x1', 0)
			.attr('y1', 0)
			.attr('x2', (d, i) => this.radius * 1.1 * cos(this.angleSlice * i - HALF_PI))
			.attr('y2', (d, i) => this.radius * 1.1 * sin(this.angleSlice * i - HALF_PI))
			.attr('class', 'line')
			.style('stroke', 'white')
			.style('stroke-width', '2px');

		//Append the labels at each axis
		axis.append('text')
			.attr('class', 'legend')
			.style('font-size', '11px')
			.attr('text-anchor', 'middle')
			.attr('dy', '0.35em')
			.attr('x', (d,i) => this.radius * 1.1 * cos(this.angleSlice * i - HALF_PI))
			.attr('y', (d,i) => this.radius * 1.1 * sin(this.angleSlice * i - HALF_PI))
			.text(d => d)
			.call(this.wrap, this.cfg.wrapWidth);

		/////////////////////////////////////////////////////////
		///////////// Draw the radar chart blobs ////////////////
		/////////////////////////////////////////////////////////

		//The radial line function
		const radarLine = d3.lineRadial<RadarChartAxis>()
			.curve(d3.curveLinearClosed)
			.radius(d => this.rScales[d.axis](d.value) || 0)
			.angle((d,i) => i * this.angleSlice);

		if(this.cfg.roundStrokes) {
			radarLine.curve(d3.curveCardinalClosed)
		}

		//Create a wrapper for the blobs
		const blobWrapper = g.selectAll('.radarWrapper')
			.data(this.data)
			.enter().append('g')
			.attr('class', 'radarWrapper');

		//Append the backgrounds
		blobWrapper
			.append('path')
			.attr('class', 'radarArea')
			.attr('d', d => radarLine(d.axes))
			.style('fill', (d,i) => this.cfg.color(i))
			.style('fill-opacity', this.cfg.opacityArea)
			.on('mouseover', function(d, i) {
				//Dim all blobs
				parent.selectAll('.radarArea')
					.transition().duration(200)
					.style('fill-opacity', 0.1);
				//Bring back the hovered over blob
				d3.select(this)
					.transition().duration(200)
					.style('fill-opacity', 0.7);
			})
			.on('mouseout', () => {
				//Bring back all blobs
				parent.selectAll('.radarArea')
					.transition().duration(200)
					.style('fill-opacity', this.cfg.opacityArea);
			});

		//Create the outlines
		blobWrapper.append('path')
			.attr('class', 'radarStroke')
			.attr('d', function(d,i) { return radarLine(d.axes); })
			.style('stroke-width', this.cfg.strokeWidth + 'px')
			.style('stroke', (d,i) => this.cfg.color(i))
			.style('fill', 'none')
			.style('filter' , 'url(#glow)');

		//Append the circles
		blobWrapper.selectAll('.radarCircle')
			.data(d => d.axes)
			.enter()
			.append('circle')
			.attr('class', 'radarCircle')
			.attr('r', this.cfg.dotRadius)
			.attr('cx', (d,i) => (this.rScales[d.axis](d.value) || 0) * cos(this.angleSlice * i - HALF_PI))
			.attr('cy', (d,i) => (this.rScales[d.axis](d.value) || 0) * sin(this.angleSlice * i - HALF_PI))
			.style('fill', (d, i) => this.cfg.color(i))
			.style('fill-opacity', 0.8);

		/////////////////////////////////////////////////////////
		//////// Append invisible circles for tooltip ///////////
		/////////////////////////////////////////////////////////

		//Wrapper for the invisible circles on top
		const blobCircleWrapper = g.selectAll('.radarCircleWrapper')
			.data(this.data)
			.enter().append('g')
			.attr('class', 'radarCircleWrapper');

		//Append a set of invisible circles on top for the mouseover pop-up
		blobCircleWrapper.selectAll('.radarInvisibleCircle')
			.data(d => d.axes)
			.enter().append('circle')
			.attr('class', 'radarInvisibleCircle')
			.attr('r', this.cfg.dotRadius * 1.5)
			.attr('cx', (d,i) => (this.rScales[d.axis](d.value) || 0) * cos(this.angleSlice*i - HALF_PI))
			.attr('cy', (d,i) => (this.rScales[d.axis](d.value) || 0) * sin(this.angleSlice*i - HALF_PI))
			.style('fill', 'none')
			.style('pointer-events', 'all')
			.on('mouseover', function(d,i) {
				tooltip
					.attr('x', this.cx.baseVal.value - 10)
					.attr('y', this.cy.baseVal.value - 10)
					.transition()
					.style('display', 'block');
				if (d.value === undefined || d.value === null) {
					tooltip.text(0);
				} else if (typeof d.value === 'string') {
					tooltip.text(d.value);
				} else if (typeof d.value === 'number') {
					tooltip.text(d3.format('.2f')(d.value));
				} else if (d.value instanceof Date) {
					tooltip.text(d.value.toString())
				}
			})
			.on('mouseout', function(){
				tooltip.transition()
					.style('display', 'none').text('');
			});

		const tooltip = g.append('text')
			.attr('class', 'tooltip')
			.attr('x', 0)
			.attr('y', 0)
			.style('font-size', '12px')
			.style('display', 'none')
			.attr('text-anchor', 'middle')
			.attr('dy', '0.35em');

		if (this.cfg.legend !== false && typeof this.cfg.legend === 'object') {
			let legendZone = svg.append('g');
			let names = this.data.map(el => el.name);
			if (this.cfg.legend.title) {
				let title = legendZone.append('text')
					.attr('class', 'title')
					.attr('transform', `translate(${this.cfg.legend.translateX},${this.cfg.legend.translateY})`)
					.attr('x', this.cfg.w - 70)
					.attr('y', 10)
					.attr('font-size', '12px')
					.attr('fill', '#404040')
					.text(this.cfg.legend.title);
			}
			const legend = legendZone.append('g')
				.attr('class', 'legend')
				.attr('height', 100)
				.attr('width', 200)
				.attr('transform', `translate(${this.cfg.legend.translateX},${this.cfg.legend.translateY + 20})`);
			// Create rectangles markers
			legend.selectAll('rect')
				.data(names)
				.enter()
					.append('rect')
					.attr('x', this.cfg.w - 65)
					.attr('y', (d,i) => i * 20)
					.attr('width', 10)
					.attr('height', 10)
					.style('fill', (d,i) => this.cfg.color(i));
			// Create labels
			legend.selectAll('text')
				.data(names)
				.enter()
					.append('text')
					.attr('x', this.cfg.w - 52)
					.attr('y', (d,i) => i * 20 + 9)
					.attr('font-size', '11px')
					.attr('fill', '#737373')
					.text(d => d);
		}
		return svg;
	}

	//Wraps SVG text - Taken from http://bl.ocks.org/mbostock/7555321
	private wrap (text: d3.Selection<SVGTextElement, string, SVGGElement, unknown>, width: number) {
		text.each(function() {
			var text = d3.select(this),
				words = text.text().split(/\s+/).reverse(),
				word,
				line: string[] = [],
				lineNumber = 0,
				lineHeight = 1.4, // ems
				y = text.attr('y'),
				x = text.attr('x'),
				dy = parseFloat(text.attr('dy')),
				tspan = text.text(null).append('tspan').attr('x', x).attr('y', y).attr('dy', dy + 'em');

			while (word = words.pop()) {
				line.push(word);
				tspan.text(line.join(' '));
				const node = tspan.node();
				if (node && node.getComputedTextLength() > width) {
						line.pop();
						tspan.text(line.join(' '));
						line = [word];
						tspan = text.append('tspan').attr('x', x).attr('y', y).attr('dy', ++lineNumber * lineHeight + dy + 'em').text(word);
				}
			}
		});
	}

	private format(n: number) {
		return d3.format(this.cfg.format)(n);
	}

	private updateConfig() {
		if(undefined !== this.options){
			for(const [k, v] of Object.entries(this.options)){
				if(v !== undefined){ (<any>this.cfg)[k] = v }
			}
		}
	}

	private getAxisScales(): {[key: string]: RadarChartScaleFunc} {
		const rScales: {[key: string]: RadarChartScaleFunc}={}

		this.axisNames.forEach(a => {
			const axisValues = this.data.map(d => d.axes.find(ax => ax.axis === a)?.value);

			if (axisValues.some(v => typeof v === typeof '')) {

				const domain = [...new Set(axisValues as Array<string | undefined>)]
					.map(v => v || '')
					.sort();

				rScales[a] = d3.scalePoint()
					.range([0, this.radius])
					.domain(domain)
					.padding(0.2) as RadarChartScaleFunc;

			} else if (axisValues.some(v => v instanceof Date)){
				const dateValues = axisValues.filter(d => d !== undefined) as Array<Date>
				rScales[a] = d3.scaleTime()
					.range([0, this.radius])
					.domain([
						d3.min(dateValues) || new Date(),
						d3.max(dateValues) || new Date()
					]) as RadarChartScaleFunc;

			} else {
				const numberValues = axisValues.filter(d => d !== undefined) as Array<number>
				rScales[a] = d3.scaleLinear()
					.range([0, this.radius])
					.domain([
						d3.min(numberValues) || 0,
						d3.max(numberValues) || 0
					]) as RadarChartScaleFunc;
			}
		});
		return rScales;
	}
}