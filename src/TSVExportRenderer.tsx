import * as React from 'react'
import {
  IPivotDataProps,
  PivotData,
  PivotDataDefaultProps,
} from './Utilities'

export class TSVExportRenderer extends React.PureComponent<IPivotDataProps,{}> {
  public static defaultProps = PivotDataDefaultProps
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

    const headerRow = pivotData.props.rows!.map(r => r)
    if (colKeys.length === 1 && colKeys[0].length === 0) {
      headerRow.push(this.props.aggregatorName!)
    } else {
      colKeys.map(c => headerRow.push(c.join('-')))
    }

    const result = rowKeys.map((r) => {
      const row = r.map(x => x)
      colKeys.map((c) => {
        const v = pivotData.getAggregator(r, c).value()
        row.push(v ? v : '')
      })
      return row
    })

    result.unshift(headerRow)

    return (
      <textarea
        value={result.map(r => r.join('\t')).join('\n')}
        style={{ width: window.innerWidth / 2, height: window.innerHeight / 2 }}
        readOnly={true}
      />
    )
  }
}
