import PlotlyComponent from 'react-plotly.js'
import { makeRenderer } from './PlotlyRenderer'
import { makeScatterRenderer } from './PlotlyScatterRenderer'

const createPlotlyRenderers = {
  'Grouped Column Chart': makeRenderer(
    PlotlyComponent,
    { type: 'bar' },
    { barmode: 'group' },
  ),
  'Stacked Column Chart': makeRenderer(
    PlotlyComponent,
    { type: 'bar' },
    { barmode: 'relative' },
  ),
  'Grouped Bar Chart': makeRenderer(
    PlotlyComponent,
    { type: 'bar', orientation: 'h' },
    { barmode: 'group' },
    true,
  ),
  'Stacked Bar Chart': makeRenderer(
    PlotlyComponent,
    { type: 'bar', orientation: 'h' },
    { barmode: 'relative' },
    true,
  ),
  'Line Chart': makeRenderer(PlotlyComponent),
  'Dot Chart': makeRenderer(PlotlyComponent, { mode: 'markers' }, {}, true),
  'Area Chart': makeRenderer(PlotlyComponent, { stackgroup: 1 }),
  'Scatter Chart': makeScatterRenderer(PlotlyComponent),
  'Multiple Pie Chart': makeRenderer(
    PlotlyComponent,
    { type: 'pie', scalegroup: 1, hoverinfo: 'label+value', textinfo: 'none' },
    {},
    true,
  ),
}

export default createPlotlyRenderers
