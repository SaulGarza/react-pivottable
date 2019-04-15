import {
  PivotData,
} from './Utilities'

export default () => {
  self.addEventListener(
    'processData',
    (e: any) => {
      // self.postMessage(e.data,'*')
      const pivotData = new PivotData(this.props)
      const colAttrs = pivotData.props.cols
      const rowAttrs = pivotData.props.rows
      const rowKeys = pivotData.getRowKeys()
      const colKeys = pivotData.getColKeys()
      const grandTotalAggregator = pivotData.getAggregator([], [])
      postMessage({
        pivotData,
        colAttrs,
        rowAttrs,
        rowKeys,
        colKeys,
        grandTotalAggregator,
      },'*')
    },
  )
}