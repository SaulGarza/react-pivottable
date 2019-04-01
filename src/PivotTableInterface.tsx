import update from 'immutability-helper'
import * as React from 'react'
import Sortable from 'react-sortablejs'

import DraggableAttribute from './DraggableAttribute'
import Dropdown from './Dropdown'
import {
  IPivotTableProps,
  PivotTable,
} from './PivotTable'
import {
  getSort,
  ObjectOfNumbers,
  OrderEnum,
  PivotData,
  sortAs,
} from './Utilities'

interface IPivotTableUIProps extends IPivotTableProps {
  onChange: (f: any) => any
  hiddenAttributes: string[]
  hiddenFromAggregators: string[]
  hiddenFromDragDrop: string[]
  unusedOrientationCutoff: number
  menuLimit: number
}
interface IState {
  unusedOrder: any[]
  zIndices: ObjectOfNumbers
  maxZIndex: number
  openDropdown: boolean | string
  hideUnusedAttrs: boolean
}
export default class PivotTableInterface extends React.PureComponent<IPivotTableUIProps, IState> {
  private mouseTimer: any = null
  public RenderedTable: any
  public static defaultProps: IPivotTableUIProps = {
    ...PivotTable.defaultProps,
    onChange: () => undefined,
    hiddenAttributes: [],
    hiddenFromAggregators: [],
    hiddenFromDragDrop: [],
    unusedOrientationCutoff: 85,
    menuLimit: 500,
  }
  public state = {
    unusedOrder: [],
    zIndices: {},
    maxZIndex: 1000,
    openDropdown: false,
    hideUnusedAttrs: false,
  }
  public data = []
  public materializedInput: any[]
  public attrValues: any

  public componentWillMount() {
    this.materializeInput(this.props.data)
  }

  public componentWillUpdate(nextProps: IPivotTableUIProps) {
    this.materializeInput(nextProps.data)
  }

  private materializeInput(nextData: any) {
    if (this.data === nextData) {
      return
    }
    this.data = nextData
    const attrValues = {}
    const materializedInput: any[] = []
    let recordsProcessed = 0
    new PivotData().forEachRecord(this.data, this.props.derivedAttributes, (record) => {
      materializedInput.push(record)
      for (const attr of Object.keys(record)) {
        if (!(attr in attrValues)) {
          attrValues[attr] = {}
          if (recordsProcessed > 0) {
            attrValues[attr].null = recordsProcessed
          }
        }
      }
      for (const attr of Object.keys(attrValues)) {
        const value = attr in record ? record[attr] : 'null'
        if (!(value in attrValues[attr])) {
          attrValues[attr][value] = 0
        }
        attrValues[attr][value]++
      }
      recordsProcessed++
    })

    this.materializedInput = materializedInput
    this.attrValues = attrValues
  }

  public sendPropUpdate(command) {
    this.props.onChange(update(this.props, command))
  }

  public propUpdater(key) {
    return value => this.sendPropUpdate({ [key]: { $set: value } })
  }

  public setValuesInFilter(attribute, values) {
    this.sendPropUpdate({
      valueFilter: {
        [attribute]: {
          $set: values.reduce(
            (r, v) => {
              r[v] = true
              return r
            },
            {},
          ),
        },
      },
    })
  }

  public addValuesToFilter(attribute, values) {
    if (attribute in this.props.valueFilter) {
      this.sendPropUpdate({
        valueFilter: {
          [attribute]: values.reduce(
            (r, v) => {
              r[v] = { $set: true }
              return r
            },
            {},
          ),
        },
      })
    } else {
      this.setValuesInFilter(attribute, values)
    }
  }

  public removeValuesFromFilter(attribute, values) {
    this.sendPropUpdate({
      valueFilter: { [attribute]: { $unset: values } },
    })
  }

  public moveFilterBoxToTop(attribute) {
    this.setState(
      update(this.state, {
        maxZIndex: { $set: this.state.maxZIndex + 1 },
        zIndices: { [attribute]: { $set: this.state.maxZIndex + 1 } },
      }),
    )
  }

  public isOpen(dropdown) {
    return this.state.openDropdown === dropdown
  }

  public makeDnDCell(items, onChange, classes) {
    return (
      <Sortable
        options={{
          group: 'shared',
          ghostClass: 'pvtPlaceholder',
          filter: '.pvtFilterBox',
          preventOnFilter: false,
        }}
        tag="td"
        className={classes}
        onChange={onChange}
      >
        {items.map(x => (
          <DraggableAttribute
            name={x}
            key={x}
            attrValues={this.attrValues[x]}
            valueFilter={this.props.valueFilter && this.props.valueFilter[x] ?
              this.props.valueFilter[x] :
              {}
            }
            sorter={getSort(this.props.sorters, x)}
            menuLimit={this.props.menuLimit}
            setValuesInFilter={(attr: any, values: any) => this.setValuesInFilter(attr, values)}
            addValuesToFilter={(attr: any, values: any) => this.addValuesToFilter(attr, values)}
            moveFilterBoxToTop={(attr: any) => this.moveFilterBoxToTop(attr)}
            removeValuesFromFilter={(attr: any, values: any) =>
              this.removeValuesFromFilter(attr, values)}
            zIndex={this.state.zIndices[x] || this.state.maxZIndex}
          />
        ))}
      </Sortable>
    )
  }

  public mouseEnter() {
    this.mouseTimer = window.setTimeout(
      () => {
        this.setState(prevState => ({
          ...prevState,
          hideUnusedAttrs: true,
        }))
      },
      300,
    )
  }
  public mouseLeave() {
    window.clearTimeout(this.mouseTimer)
    this.setState(prevState => ({
      ...prevState,
      hideUnusedAttrs: false,
    }))
  }

  public render() {
    const numValsAllowed = this.props.aggregators[this.props.aggregatorName]([])().numInputs || 0

    const rendererName =
      this.props.rendererName in this.props.renderers
        ? this.props.rendererName
        : Object.keys(this.props.renderers)[0]

    const rendererCell = (
      <td className="pvtRenderers">
        <Dropdown
          current={rendererName}
          values={Object.keys(this.props.renderers)}
          open={this.isOpen('renderer')}
          zIndex={this.isOpen('renderer') ? this.state.maxZIndex + 1 : 1}
          toggle={() =>
            this.setState((prevState: IState): IState => {
              return {
                ...prevState,
                openDropdown: this.isOpen('renderer') ? false : 'renderer',
              }
            })
          }
          setValue={this.propUpdater('rendererName')}
        />
      </td>
    )

    const sortIcons = {
      key_a_to_z: {
        rowSymbol: '↕',
        colSymbol: '↔',
        next: 'value_a_to_z',
      },
      value_a_to_z: {
        rowSymbol: '↓',
        colSymbol: '→',
        next: 'value_z_to_a',
      },
      value_z_to_a: {
        rowSymbol: '↑',
        colSymbol: '←',
        next: 'key_a_to_z',
      },
    }
    const defaultSort = OrderEnum.value_a_to_z

    const aggregatorCell = (
      <td className="pvtVals">
        <div>
          <Dropdown
            current={this.props.aggregatorName}
            values={Object.keys(this.props.aggregators)}
            open={this.isOpen('aggregators')}
            zIndex={this.isOpen('aggregators') ? this.state.maxZIndex + 1 : 1}
            toggle={() =>
              this.setState({
                openDropdown: this.isOpen('aggregators') ? false : 'aggregators',
              })
            }
            setValue={this.propUpdater('aggregatorName')}
          />
          <a
            role="button"
            className="pvtRowOrder"
            onClick={
              () => {
                this.propUpdater('rowOrder')(sortIcons[this.props.rowOrder || defaultSort].next)
              }
            }
          >
            {sortIcons[this.props.rowOrder || defaultSort].rowSymbol}
          </a>
          <a
            role="button"
            className="pvtColOrder"
            onClick={() =>
              this.propUpdater('colOrder')(sortIcons[this.props.colOrder || defaultSort].next)
            }
          >
            {sortIcons[this.props.colOrder || defaultSort].colSymbol}
          </a>
        </div>
        { // Initialize new Array of length[numValsAllowed] with undefined,
          // then immediately map data to it
          // tslint:disable-next-line:prefer-array-literal
          new Array(numValsAllowed).fill(undefined).map((n, i) => [
            <Dropdown
              key={i}
              current={this.props.vals[i]}
              values={Object.keys(this.attrValues).filter(
                e =>
                  !this.props.hiddenAttributes.includes(e) &&
                  !this.props.hiddenFromAggregators.includes(e),
              )}
              open={this.isOpen(`val${i}`)}
              zIndex={this.isOpen(`val${i}`) ? this.state.maxZIndex + 1 : 1}
              toggle={() =>
                this.setState({
                  openDropdown: this.isOpen(`val${i}`) ? false : `val${i}`,
                })
              }
              setValue={value =>
                this.sendPropUpdate({
                  vals: { $splice: [[i, 1, value]] },
                })
              }
            />,
          ])
        }
      </td>
    )

    const unusedAttrs = Object.keys(this.attrValues)
      .filter(
        e =>
          !this.props.rows.includes(e) &&
          !this.props.cols.includes(e) &&
          !this.props.hiddenAttributes.includes(e) &&
          !this.props.hiddenFromDragDrop.includes(e),
      )
      .sort(sortAs(this.state.unusedOrder))

    // const unusedLength = unusedAttrs.reduce((r, e) => r + e.length, 0)
    // const horizUnused = unusedLength < this.props.unusedOrientationCutoff!

    const unusedAttrsCell = this.makeDnDCell(
      unusedAttrs,
      order => this.setState({ unusedOrder: order }),
      'pvtAxisContainer pvtUnused pvtVertList',
    )

    const colAttrs = this.props.cols ? this.props.cols.filter(
      e =>
        !this.props.hiddenAttributes.includes(e) &&
        !this.props.hiddenFromDragDrop.includes(e),
    ) : []

    const colAttrsCell = this.makeDnDCell(
      colAttrs,
      this.propUpdater('cols'),
      'pvtAxisContainer pvtHorizList pvtCols',
    )

    const rowAttrs = this.props.rows ? this.props.rows.filter(
      e =>
        !this.props.hiddenAttributes.includes(e) &&
        !this.props.hiddenFromDragDrop.includes(e),
    ) : []

    const rowAttrsCell = this.makeDnDCell(
      rowAttrs,
      this.propUpdater('rows'),
      'pvtAxisContainer pvtVertList pvtRows',
    )
    const outputCell = (
      <td className="pvtOutput">
        <PivotTable
          {...update(this.props, {
            data: { $set: this.materializedInput },
          })}
          ref={component => this.RenderedTable = component!.RenderedTable}
        />
      </td>
    )

    return (
      <div
        className={`pvtUi ${numValsAllowed ? `pvt__numVals${numValsAllowed}` : ''}`}
        onClick={() => this.setState({ openDropdown: false })}
      >
        <div className={`pvt__left ${this.state.hideUnusedAttrs ? 'hidden' : ''}`}>
          {rendererCell}
          <div>
            {unusedAttrsCell}
          </div>
        </div>
        <div className="pvt__middle">
          {aggregatorCell}
          <div>
            {rowAttrsCell}
          </div>
        </div>
        <div className="pvt__right">
          {colAttrsCell}
          <div
            onMouseEnter={() => this.mouseEnter()}
            onMouseLeave={() => this.mouseLeave()}
          >
            {outputCell}
          </div>
        </div>
      </div>
    )
  }
}
