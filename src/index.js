const isPlainObject = require('lodash.isplainobject');
const Canvas = require('canvas-prebuilt');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
/**
 * Hotfix to calculate text width/height so Google Charts
 * can separate labels into different lines
 * 
 * @param {window} window 
 * @param {element} element 
 * @returns {JSON}
 */
function measureTextSize(window, element) {
    const canvas = new Canvas(0, 0);
    const ctx = canvas.getContext("2d");
    const fontSize = window.getComputedStyle(element).fontSize || 13;
    const fontFamily = window.getComputedStyle(element).fontFamily || 'arial';

    ctx.font = `${fontSize}px ${fontFamily}`;  // This can be set programmaticly from the element's font-style if desired
    return { width: ctx.measureText(element.innerHTML).width, height: fontSize + 1 };
}

/**
* offsetWidth && offsetHeight weren't implemented. The implementation is taken from
* https://github.com/tmpvar/jsdom/issues/135#issuecomment-68191941
* clientWidth && clientHeight had the same issue (the implementation is wrong but it's good enough for Google Chart)
*/
function applyJsdomWorkaround(window, forceUncutLine) {
    Object.defineProperties(window.HTMLElement.prototype, {
        clientHeight: {
            configurable: true,
            get: function () {
                return (forceUncutLine) ? 0 : measureTextSize(window, this).height || 0;
            }
        },
        offsetHeight: {
            configurable: true,
            get: function () {
                return parseFloat(window.getComputedStyle(this).height) || 0;
            }
        },
        clientWidth: {
            configurable: true,
            get: function () {
                return (forceUncutLine) ? 0 : measureTextSize(window, this).width || 0;
            }
        },
        offsetWidth: {
            configurable: true,
            get: function () {
                return parseFloat(window.getComputedStyle(this).width) || 0;
            }
        },
    });
}

/**
 * Pre-Generates GoogleChart with given options 
 * 
 * @param {args} Object {chartOptions, format} 
 * @returns {Promise}
 */
function generateChart(args) {
    return new Promise((resolve, reject) => {

        //Generate Virtual JS DOM
        const { window } = new JSDOM(
            `<html><head>
             <script src="https://www.gstatic.com/charts/loader.js"></script>
             </head><body></body></html>`,
            { resources: "usable", runScripts: "dangerously" }
        );

        //JSDOM document load event
        window.addEventListener('load', event => {
            //Load GoogleCharts lib
            window.google.charts.load("current", { packages: ['corechart'] });
            window.google.charts.setOnLoadCallback(() => {
                applyJsdomWorkaround(window, args.forceUncutLine)
                resolve({
                    window,
                    chartOptions: args.chartOptions,
                    format: args.format
                })
            });
        }, false);
    })
        .catch(error =>
            Promise.reject(new Error('[ChartInitError] ' + error.message))
        );
}

/**
 * Render GoogleChart at JSDOM
 * 
 * @param {args} Object {window, chartOptions, format}
 * @returns {Promise}
 */
function renderChart(args) {
    return new Promise((resolve, reject) => {
        const window = args.window,
            chartOptions = args.chartOptions,
            format = args.format,
            container = window.document.createElement('div');

        container.id = chartOptions.containerId;
        container.setAttribute(
            'style',
            `width:${chartOptions.options.width}px;height:${chartOptions.options.height}px;`
        );
        window.document.body.appendChild(container);

        // Render chart
        const wrapper = new window.google.visualization.ChartWrapper(chartOptions);
        window.google.visualization.events.addListener(wrapper, 'ready', () => {
            if (format === 'png')
                args.b64 = wrapper.getChart().getImageURI();

            resolve(args);
        });
        window.google.visualization.events.addListener(wrapper, 'error', error => {
            reject(error);
        });
        wrapper.draw();
    })
        .catch(error =>
            Promise.reject(new Error('[RenderingError] ' + error.message))
        );
}

/**
 * Extract either svg or png base64 from JSDOM
 * 
 * @param {args} Object {window, chartOptions, format}
 * @returns {Promise}
 */
function extractImage(args) {
    const window = args.window,
        chartOptions = args.chartOptions,
        format = args.format;

    return (format === 'png') ? args.b64 : window.document
        .querySelector('#' + chartOptions.containerId + ' svg').outerHTML;
}

/**
 * Render a Google Chart to a svg/png image
 * 
 * @param {chartOptions} Object Google ChartWrapper options
 * @param {format} String 'svg' || 'png(b64)' 
 * @returns {Promise}
 */
function render(chartOptions, format, forceUncutLine) {
    format = format || 'svg';

    if (format !== 'svg' && format !== 'png') {
        return Promise.reject(new Error('[InputError] unsupported format'));
    }
    if (!isPlainObject(chartOptions)) {
        return Promise.reject(new Error('[InputError] chartOptions should be an object containing Google ChartWrapper options'));
    }

    // Default chartOptions
    chartOptions.containerId = 'vis_div';
    chartOptions.options = chartOptions.options || {};
    chartOptions.options.width = chartOptions.options.width || 600;
    chartOptions.options.height = chartOptions.options.height || 400;

    return generateChart({ chartOptions, format, forceUncutLine })
        .then(renderChart)
        .then(extractImage)
}

module.exports = render;