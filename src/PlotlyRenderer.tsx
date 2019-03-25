import * as React from 'react'
import {
  IPivotDataProps,
  PivotData,
  PivotDataDefaultProps,
} from './Utilities'

interface IRendererProps extends IPivotDataProps {
  plotlyOptions?: any
  plotlyConfig?: any
  onRendererUpdate?: Function
}
export function makeRenderer(
  PlotlyComponent,
  traceOptions: any = {},
  layoutOptions = {},
  transpose = false,
) {
  class Renderer extends React.PureComponent<IRendererProps,{}> {
    public static defaultProps = {
      ...PivotDataDefaultProps,
      plotlyOptions: {},
      plotlyConfig: {},
    }
    public render() {
      const pivotData = new PivotData(this.props)
      const rowKeys = pivotData.getRowKeys()
      const colKeys = pivotData.getColKeys()
      const traceKeys: any[] = transpose ? colKeys : rowKeys
      if (traceKeys.length === 0) {
        traceKeys.push([])
      }
      const datumKeys: any[] = transpose ? rowKeys : colKeys
      if (datumKeys.length === 0) {
        datumKeys.push([])
      }

      let fullAggName = this.props.aggregatorName!
      const numInputs =
        this.props.aggregators![fullAggName]([])().numInputs || 0
      if (numInputs !== 0) {
        fullAggName += ` of ${this.props.vals!.slice(0, numInputs).join(', ')}`
      }

      const data = traceKeys.map((traceKey) => {
        const values: any[] = []
        const labels: any[] = []
        for (const datumKey of datumKeys) {
          const val = parseFloat(
            pivotData
              .getAggregator(
                transpose ? datumKey : traceKey,
                transpose ? traceKey : datumKey,
              )
              .value(),
          )
          values.push(isFinite(val) ? val : null)
          labels.push(datumKey.join('-') || ' ')
        }
        const trace: any = { name: traceKey.join('-') || fullAggName }
        if (traceOptions.type === 'pie') {
          trace.values = values
          trace.labels = labels.length > 1 ? labels : [fullAggName]
        } else {
          trace.x = transpose ? values : labels
          trace.y = transpose ? labels : values
        }
        return Object.assign(trace, traceOptions)
      })

      let titleText = fullAggName
      const hAxisTitle = transpose
        ? this.props.rows!.join('-')
        : this.props.cols!.join('-')
      const groupByTitle = transpose
        ? this.props.cols!.join('-')
        : this.props.rows!.join('-')
      if (hAxisTitle !== '') {
        titleText += ` vs ${hAxisTitle}`
      }
      if (groupByTitle !== '') {
        titleText += ` by ${groupByTitle}`
      }

      const layout: any = {
        title: titleText,
        hovermode: 'closest',
        /* eslint-disable no-magic-numbers */
        width: window.innerWidth / 1.5,
        height: window.innerHeight / 1.4 - 50,
        /* eslint-enable no-magic-numbers */
      }

      if (traceOptions.type === 'pie') {
        const columns = Math.ceil(Math.sqrt(data.length))
        const rows = Math.ceil(data.length / columns)
        layout.grid = { columns, rows }
        data.forEach((d, i) => {
          d.domain = {
            row: Math.floor(i / columns),
            column: i - columns * Math.floor(i / columns),
          }
          if (data.length > 1) {
            d.title = d.name
          }
        })
        if (data[0].labels.length === 1) {
          layout.showlegend = false
        }
      } else {
        layout.xaxis = {
          title: transpose ? fullAggName : null,
          automargin: true,
        }
        layout.yaxis = {
          title: transpose ? null : fullAggName,
          automargin: true,
        }
      }

      return (
        <PlotlyComponent
          data={data}
          layout={Object.assign(
            layout,
            layoutOptions,
            this.props.plotlyOptions,
          )}
          config={this.props.plotlyConfig}
          onUpdate={this.props.onRendererUpdate}
        />
      )
    }
  }

  return Renderer
}
