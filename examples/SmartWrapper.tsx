import * as React from 'react'
import { PivotState } from '../react-pivottable'
import PivotTableUI from '../src/PivotTableUI'
import createPlotlyRenderers from '../src/PlotlyRenderers'
import TableRenderers from '../src/TableRenderers'

import createPlotlyComponent from 'react-plotly.js/factory'

const Plot = createPlotlyComponent((window as any).Plotly)

interface ISmartWrapperState {
  pivotState: PivotState
}
export class PivotTableUISmartWrapper extends React.PureComponent<PivotState, ISmartWrapperState> {
  constructor(props: PivotState) {
    super(props)
    this.state = { pivotState: props }
  }

  public componentWillReceiveProps(nextProps: PivotState) {
    this.setState({ pivotState: nextProps })
  }

  public render() {
    return (
      <PivotTableUI
        renderers={Object.assign(
          {},
          TableRenderers,
          createPlotlyRenderers(Plot),
        )}
        {...this.state.pivotState}
        onChange={s => this.setState({ pivotState: s() })}
        unusedOrientationCutoff={Infinity}
      />
    )
  }
}
