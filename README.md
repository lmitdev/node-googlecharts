# Google Chart for Node using jsdom

[![Build Status][travis-image]][travis-url]

## Description
This project is an adaptation of the original [node-googlecharts by zallek](https://travis-ci.org/zallek/node-googlecharts), all credits go to zallek.

The original project uses the old GoogleCharts API so I decided to update it, right now it uses the latest GoogleCharts API and also the last JSDOM version, also I added some new features.

**node-googlecharts** allows you to have a server-side graph generation tool that can than deliver the result to the client via something like an API.

## Requirements
- Node.js > 4.0
- ICU4
- node-canvas


## ICU4C dependency
Google Chart needs full internationalization support whereas it's not built in by default on nodejs. You can either:
- Use [full-icu](https://www.npmjs.com/package/full-icu) npm package which requires running node with a specific environment  variable.
- Or, build Node.js with an embedded icu. [more info](https://github.com/nodejs/node/wiki/Intl#building-node-with-an-embedded-icu)

### How to use
**node-googlecharts** allows you to extrat a chart image both in SVG or PNG(Base64) format. To do so you simply have to call the `render()` function with the `<ChartWrapperOptions>`, `<ExtractFormat>` and `<ForceUncutLine>` as parameters.

| Argument | Type | Description |
| ------ | ------ | ------ |
| `ChartWrapperOptions` | JSON | Uses default [GoogleCharts Options](https://developers.google.com/chart/interactive/docs/) |
| `ExtractFormat` | String | Can either be `svg` or `png` |
| `ForceUncutLine` | Boolean | Forces legends to be single line without being cut off |

### Run binary
```SH
$ node bin/node-googlecharts '<ChartWrapperOptions>'
or
$ npm run bin '<ChartWrapperOptions>'
```
`ChartWrapperOptions` is the serialized JSON options to give to `ChartWrapper`.
```sh
{
   "chartType": "ColumnChart",
   "dataTable": [
      ["", "Germany", "USA", "Brazil", "Canada", "France", "RU"],
      ["", 700, 300, 400, 500, 600, 800]
   ],
   "options": {
      "title": "Countries"
   }
}
```

### Install as node module
If you wish to use this project as a node_module to use in your API or other projects, simple type the following command in your command line:
```sh
$ npm install 3nvy/node-googlecharts --save
```
Then you just need to require the project name and its done.

## FAQ

#### Why jsdom?
Google Charts needs a browser-like environment to run in. Jsdom is a light DOM implementation, much faster than PhantomJS.

#### Why Node.js > 4.0?
This is a requirement of jsdom itself.

#### Why node-canvas
We need a virtual canvas to be able to calculate the currect size of the chart legends, allowing for text wrapping

#### Why does it need ICU4C?
Google Chart needs full internationalization support whereas it's not built in by default on nodejs.


[travis-url]: https://travis-ci.org/zallek/node-googlecharts
[travis-image]: https://travis-ci.org/zallek/node-googlecharts.svg?branch=master