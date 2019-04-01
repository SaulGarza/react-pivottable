import * as React from 'react'
import {
  IPivotDataProps,
  PivotData,
  PivotDataDefaultProps,
} from './Utilities'

import * as XLSX from 'xlsx'

// helper function for setting row/col-span in pivotTableRenderer
const spanSize = (arr, i, j) => {
  let x
  if (i !== 0) {
    let asc
    let end
    let noDraw = true
    for (
      x = 0, end = j, asc = end >= 0;
      asc ? x <= end : x >= end;
      asc ? x++ : x--
    ) {
      if (arr[i - 1][x] !== arr[i][x]) {
        noDraw = false
      }
    }
    if (noDraw) {
      return -1
    }
  }
  let len = 0
  while (i + len < arr.length) {
    let asc1
    let end1
    let stop = false
    for (
      x = 0, end1 = j, asc1 = end1 >= 0;
      asc1 ? x <= end1 : x >= end1;
      asc1 ? x++ : x--
    ) {
      if (arr[i][x] !== arr[i + len][x]) {
        stop = true
      }
    }
    if (stop) {
      break
    }
    len++
  }
  return len
}

function redColorScaleGenerator(values: TableCellEntry[]) {
  const min = Math.min.apply(Math, values)
  const max = Math.max.apply(Math, values)
  return (x) => {
    // eslint-disable-next-line no-magic-numbers
    const nonRed = 255 - Math.round(255 * (x - min) / (max - min))
    return { backgroundColor: `rgb(255,${nonRed},${nonRed})` }
  }
}

type TableCellEntry = string | number | Date
type ColorScaleGeneratorReturn = (x: TableCellEntry) => React.CSSProperties | undefined

interface ITableRendererProps extends IPivotDataProps {
  tableColorScaleGenerator: (values: TableCellEntry[]) => ColorScaleGeneratorReturn
  tableOptions: {
    clickCallback?: Function,
  }
}
interface IState {
  drilldownData: Object[]
  drilldownActive: boolean
}
export function makeRenderer(opts: any = {}) {
  class TableRenderer extends React.PureComponent<ITableRendererProps,IState> {
    public static defaultProps = {
      ...PivotDataDefaultProps,
      tableColorScaleGenerator: redColorScaleGenerator,
      tableOptions: {},
    }
    public state: IState = {
      drilldownData: [],
      drilldownActive: false,
    }
    constructor(props: ITableRendererProps) {
      super(props)
      props.tableOptions.clickCallback = (e, value, filters, pivotData) => {
        let records: Object[] = []
        pivotData.forEachMatchingRecord(
          filters,
          (record: any) => {
            records = records.concat([record])
          },
        )
        this.activateDrilldown(records)
      }
    }
    public activateDrilldown(data: Object[]) {
      console.log('DRILLDOWN DATA:', data)
      this.setState((prevState) => {
        return {
          ...prevState,
          drilldownData: data,
          drilldownActive: true,
        }
      })
    }
    public disableDrilldown() {
      this.setState(
        prevState => ({
          ...prevState,
          drilldownActive: false,
        }),
        () => {
          window.setTimeout(
            () => {
              this.setState(prevState => ({
                ...prevState,
                drilldownData: [],
              }))
            },
            300,
          )
        },
      )
    }

    public export(fileName: string = 'Report Data', type: 'tsv' | 'csv' | 'xlsx') {
      let dataConstruct: any
      const workbook = XLSX.utils.book_new()
      if(this.state.drilldownActive) {
        if(type === 'xlsx') {
          dataConstruct = XLSX.utils.json_to_sheet(this.state.drilldownData)
        } else {
          let headerArray: any[] = []
          for(const key of Object.keys(this.state.drilldownData[0])) {
            headerArray = headerArray.concat([key])
          }
          let dataArray: any[] = [headerArray]
          this.state.drilldownData.forEach((o) => {
            let tempArray: any[] = []
            for(const key of Object.keys(o)) {
              tempArray = tempArray.concat([o[key]])
            }
            dataArray = dataArray.concat([tempArray])
          });
          dataConstruct = dataArray
        }
      } else {
        const pivotData = new PivotData(this.props)
        const rowKeys: any[] = pivotData.getRowKeys()
        const colKeys: any[] = pivotData.getColKeys()
        if (rowKeys.length === 0) {
          rowKeys.push([])
        }
        if (colKeys.length === 0) {
          colKeys.push([])
        }

        const headerRow = pivotData.props.rows.map(r => r)
        if (colKeys.length === 1 && colKeys[0].length === 0) {
          headerRow.push(this.props.aggregatorName)
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
        if(type === 'xlsx') {
          dataConstruct = XLSX.utils.aoa_to_sheet(result)
        } else {
          dataConstruct = result
        }
      }
      if(type === 'xlsx') {
        XLSX.utils.book_append_sheet(workbook, dataConstruct, 'sheet 1')
        XLSX.writeFile(workbook, `${fileName}.xlsx`)
      } else {
        let data: any
        if(type === 'csv') {
          data = dataConstruct.map(r => r.join(',')).join('\n')
        } else {
          data = dataConstruct.map(r => r.join('\t')).join('\n')
        }
        const link = document.createElement('a');
        link.download = `${fileName}.${type}`;
        const blob = new Blob([data], { type: 'text/plain' });
        link.href = window.URL.createObjectURL(blob);
        link.click();
      }
    }

    public render() {
      const pivotData = new PivotData(this.props)
      const colAttrs = pivotData.props.cols
      const rowAttrs = pivotData.props.rows
      const rowKeys = pivotData.getRowKeys()
      const colKeys = pivotData.getColKeys()
      const grandTotalAggregator = pivotData.getAggregator([], [])

      let valueCellColors: ((r: any, c: any, v: any) => React.CSSProperties | undefined) | undefined
      let rowTotalColors: ColorScaleGeneratorReturn | undefined
      let colTotalColors: ColorScaleGeneratorReturn | undefined
      if (opts.heatmapMode) {
        const colorScaleGenerator = this.props.tableColorScaleGenerator
        const rowTotalValues = colKeys.map(x =>
          pivotData.getAggregator([], x).value(),
        )
        rowTotalColors = colorScaleGenerator(rowTotalValues)
        const colTotalValues = rowKeys.map(x =>
          pivotData.getAggregator(x, []).value(),
        )
        colTotalColors = colorScaleGenerator(colTotalValues)

        if (opts.heatmapMode === 'full') {
          const allValues: any[] = []
          rowKeys.map(r =>
            colKeys.map(c =>
              allValues.push(pivotData.getAggregator(r, c).value()),
            ),
          )
          const colorScale = colorScaleGenerator(allValues)
          valueCellColors = (r, c, v) => colorScale(v)
        } else if (opts.heatmapMode === 'row') {
          const rowColorScales: any = {}
          rowKeys.map((r) => {
            const rowValues = colKeys.map(x =>
              pivotData.getAggregator(r, x).value(),
            )
            rowColorScales[r] = colorScaleGenerator(rowValues)
          })
          valueCellColors = (r, c, v) => rowColorScales[r](v)
        } else if (opts.heatmapMode === 'col') {
          const colColorScales = {}
          colKeys.map((c) => {
            const colValues = rowKeys.map(x =>
              pivotData.getAggregator(x, c).value(),
            )
            colColorScales[c] = colorScaleGenerator(colValues)
          })
          valueCellColors = (r, c, v) => colColorScales[c](v)
        }
      }

      const getClickHandler = this.props.tableOptions && this.props.tableOptions.clickCallback
          ? (value, rowValues, colValues) => {
            const filters = {}
            for (const i of Object.keys(colAttrs || {})) {
              const attr = colAttrs![i]
              if (colValues[i] !== null) {
                filters[attr] = colValues[i]
              }
            }
            for (const i of Object.keys(rowAttrs || {})) {
              const attr = rowAttrs![i]
              if (rowValues[i] !== null) {
                filters[attr] = rowValues[i]
              }
            }
            return (e: React.MouseEvent<HTMLTableCellElement, MouseEvent>) =>
              this.props.tableOptions.clickCallback!(
                e,
                value,
                filters,
                pivotData,
              )
          }
          : undefined

      return (
        <table className="pvtTable">
          <thead>
            {colAttrs!.map((c, j) => {
              return (
                <tr key={`colAttr${j}`}>
                  {j === 0 &&
                    rowAttrs!.length !== 0 && (
                      <th colSpan={rowAttrs!.length} rowSpan={colAttrs!.length} />
                    )}
                  <th className="pvtAxisLabel">{c}</th>
                  {colKeys.map((colKey, i) => {
                    const x = spanSize(colKeys, i, j)
                    if (x === -1) {
                      return null
                    }
                    return (
                      <th
                        className="pvtColLabel"
                        key={`colKey${i}`}
                        colSpan={x}
                        rowSpan={
                          j === colAttrs!.length - 1 && rowAttrs!.length !== 0
                            ? 2
                            : 1
                        }
                      >
                        {colKey[j]}
                      </th>
                    )
                  })}

                  {j === 0 && (
                    <th
                      className="pvtTotalLabel"
                      rowSpan={
                        colAttrs!.length + (rowAttrs!.length === 0 ? 0 : 1)
                      }
                    >
                      Totals
                    </th>
                  )}
                </tr>
              )
            })}

            {rowAttrs!.length !== 0 && (
              <tr>
                {rowAttrs!.map((r, i) => {
                  return (
                    <th className="pvtAxisLabel" key={`rowAttr${i}`}>
                      {r}
                    </th>
                  )
                })}
                <th className="pvtTotalLabel">
                  {colAttrs!.length === 0 ? 'Totals' : null}
                </th>
              </tr>
            )}
          </thead>

          <tbody>
            {rowKeys.map((rowKey, i) => {
              const totalAggregator = pivotData.getAggregator(rowKey, [])
              return (
                <tr key={`rowKeyRow${i}`}>
                  {rowKey.map((txt, j) => {
                    const x = spanSize(rowKeys, i, j)
                    if (x === -1) {
                      return null
                    }
                    return (
                      <th
                        key={`rowKeyLabel${i}-${j}`}
                        className="pvtRowLabel"
                        rowSpan={x}
                        colSpan={
                          j === rowAttrs!.length - 1 && colAttrs!.length !== 0
                            ? 2
                            : 1
                        }
                      >
                        {txt}
                      </th>
                    )
                  })}
                  {colKeys.map((colKey, j) => {
                    const aggregator = pivotData.getAggregator(rowKey, colKey)
                    return (
                      <td
                        className="pvtVal"
                        key={`pvtVal${i}-${j}`}
                        onClick={
                          getClickHandler &&
                          getClickHandler(aggregator.value(), rowKey, colKey)
                        }
                        style={valueCellColors ? valueCellColors(
                          rowKey,
                          colKey,
                          aggregator.value(),
                        ) : {}}
                      >
                        {aggregator.format(aggregator.value())}
                      </td>
                    )
                  })}
                  <td
                    className="pvtTotal"
                    onClick={
                      getClickHandler &&
                      getClickHandler(totalAggregator.value(), rowKey, [null])
                    }
                    style={colTotalColors ? colTotalColors(totalAggregator.value()) : {}}
                  >
                    {totalAggregator.format(totalAggregator.value())}
                  </td>
                </tr>
              )
            })}

            <tr>
              <th
                className="pvtTotalLabel"
                colSpan={rowAttrs!.length + (colAttrs!.length === 0 ? 0 : 1)}
              >
                Totals
              </th>

              {colKeys.map((colKey, i) => {
                const totalAggregator = pivotData.getAggregator([], colKey)
                return (
                  <td
                    className="pvtTotal"
                    key={`total${i}`}
                    onClick={
                      getClickHandler &&
                      getClickHandler(totalAggregator.value(), [null], colKey)
                    }
                    style={rowTotalColors ? rowTotalColors(totalAggregator.value()) : {}}
                  >
                    {totalAggregator.format(totalAggregator.value())}
                  </td>
                )
              })}

              <td
                onClick={
                  getClickHandler &&
                  getClickHandler(grandTotalAggregator.value(), [null], [null])
                }
                className="pvtGrandTotal"
              >
                {grandTotalAggregator.format(grandTotalAggregator.value())}
              </td>
            </tr>
          </tbody>
          <div
            className={`pvt__drilldownContainer ${this.state.drilldownActive ? 'active' : ''}`}
            onClick={() => this.disableDrilldown()}
          >
            {(() => {
              if(!this.state.drilldownData.length) {
                return null
              }
              const drilldownKeys = Object.keys(this.state.drilldownData[0])
              return (
                <div className="pvt__tableWrapper">
                  <td className="pvtOutput">
                    <table>
                      <thead>
                        <tr>
                          {drilldownKeys.map((columnKeys, i) => {
                            return (
                              <th key={i}>{columnKeys}</th>
                            )
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {this.state.drilldownData.map((row, i) => {
                          return (
                            <tr key={i}>
                              {drilldownKeys.map((key, k) => {
                                return (
                                  <td key={k}>
                                    {row[key]}
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </td>
                </div>
              )
            })()}
          </div>
        </table>
      )
    }
  }
  return TableRenderer
}
