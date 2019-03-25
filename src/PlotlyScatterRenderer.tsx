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
export function makeScatterRenderer(PlotlyComponent) {
  class Renderer extends React.PureComponent<IRendererProps,{}> {
    public static defaultProps = {
      ...PivotDataDefaultProps,
      plotlyOptions: {},
      plotlyConfig: {},
    }
    public render() {
      const pivotData = new PivotData(this.props)
      const rowKeys: any[] = pivotData.getRowKeys()
      const colKeys: any[] = pivotData.getColKeys()
      if (rowKeys.length === 0) {
        rowKeys.push([])
      }
      if (colKeys.length === 0) {
        colKeys.push([])
      }

      const data: any = { x: [], y: [], text: [], type: 'scatter', mode: 'markers' }

      rowKeys.map((rowKey) => {
        colKeys.map((colKey) => {
          const v = pivotData.getAggregator(rowKey, colKey).value()
          if (v !== null) {
            data.x.push(colKey.join('-'))
            data.y.push(rowKey.join('-'))
            data.text.push(v)
          }
        })
      })

      const layout = {
        title: `${this.props.rows!.join('-')} vs ${this.props.cols!.join('-')}`,
        hovermode: 'closest',
        /* eslint-disable no-magic-numbers */
        xaxis: { title: this.props.cols!.join('-'), automargin: true },
        yaxis: { title: this.props.rows!.join('-'), automargin: true },
        width: window.innerWidth / 1.5,
        height: window.innerHeight / 1.4 - 50,
        /* eslint-enable no-magic-numbers */
      }

      return (
        <PlotlyComponent
          data={[data]}
          layout={Object.assign(layout, this.props.plotlyOptions)}
          config={this.props.plotlyConfig}
          onUpdate={this.props.onRendererUpdate}
        />
      )
    }
  }
  return Renderer
}
