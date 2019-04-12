import * as React from 'react'
import Draggable from 'react-draggable'
import {
  ObjectOfBooleans,
  ObjectOfNumbers,
} from './Utilities'

import * as ReactDOM from 'react-dom'

import { List } from 'react-virtualized'

import * as moment from 'moment'

interface IProps {
  name: string
  attrValues: ObjectOfNumbers
  moveFilterBoxToTop: Function
  sorter: ((a: string, b: string) => number) | undefined
  addValuesToFilter: (name: string, values: any[]) => any
  removeValuesFromFilter: (name: string, values: any[]) => any
  setValuesInFilter: (name: string, values: any) => any
  valueFilter?: ObjectOfBooleans
  menuLimit?: number
  zIndex?: number
}
interface IState {
  open: boolean
  filterText: string
  x: number
  y: number
  isDates: boolean
}
export default class DraggableAttribute extends React.Component<IProps, IState> {
  public static defaultProps = {
    valueFilter: {},
  }
  public state = {
    open: false,
    filterText: '',
    x: 0,
    y: 0,
    isDates: false,
  }
  constructor(props: IProps) {
    super(props)
    let foundNonDate = false
    for(const k in props.attrValues) {
      if(moment(k).isValid()) {
        continue
      }
      foundNonDate = true
    }
    if(!foundNonDate) {
      this.state.isDates = true
    }
  }

  public toggleValue(value: any) {
    if (value in this.props.valueFilter!) {
      this.props.removeValuesFromFilter(this.props.name, [value])
    } else {
      this.props.addValuesToFilter(this.props.name, [value])
    }
  }

  public matchesFilter(x: any) {
    return x
      .toLowerCase()
      .trim()
      .includes(this.state.filterText.toLowerCase().trim())
  }

  public selectOnly(e: React.MouseEvent<HTMLAnchorElement,MouseEvent>, value: any) {
    e.stopPropagation()
    if(!!this.props.setValuesInFilter) {
      this.props.setValuesInFilter(
        this.props.name,
        Object.keys(this.props.attrValues).filter(y => y !== value),
      )
    }
  }

  public getFilterBox() {
    const values = Object.keys(this.props.attrValues)
    const shown = values
      .filter(this.matchesFilter.bind(this))
      .sort(this.props.sorter)

    const appRoot = document.getElementById('root')

    const rowRenderer = ({
      key,
      index,
      isScrolling,
      isVisible,
      style,
    }) => {
      return (
        <p
          key={index}
          onClick={() => this.toggleValue(shown[index])}
          className={shown[index] in this.props.valueFilter! ? '' : 'selected'}
        >
          <a className="pvtOnly" onClick={e => this.selectOnly(e, shown[index])}>
            only
          </a>
          <a className="pvtOnlySpacer">&nbsp;</a>
          {shown[index] === '' ? <em>null</em> : shown[index]}
        </p>
      )
    }

    return ReactDOM.createPortal(
      (
        <Draggable
          handle=".pvtDragHandle"
          defaultPosition={{ x: this.state.x, y: this.state.y }}
        >
          <div
            className="pvtFilterBox"
            style={{
              display: 'block',
              cursor: 'initial',
              pointerEvents: 'all',
              position: 'fixed',
              top: 0,
              left: 0,
              zIndex: this.props.zIndex,
            }}
            onClick={() => this.props.moveFilterBoxToTop(this.props.name)}
          >
            <a onClick={() => this.setState({ open: false })} className="pvtCloseX">
              ×
            </a>
            <span className="pvtDragHandle">☰</span>
            <h4>{this.props.name}</h4>
              {!this.state.isDates && (
                <p>
                  <input
                    type="text"
                    placeholder="Filter values"
                    className="pvtSearch"
                    value={this.state.filterText}
                    onChange={e =>
                      this.setState({
                        filterText: e.target.value,
                      })
                    }
                  />
                  <br />
                  <a
                    role="button"
                    className="pvtButton"
                    onClick={() =>
                      this.props.removeValuesFromFilter(
                        this.props.name,
                        Object.keys(this.props.attrValues).filter(
                          this.matchesFilter.bind(this),
                        ),
                      )
                    }
                  >
                    Select {values.length === shown.length ? 'All' : shown.length}
                  </a>{' '}
                  <a
                    role="button"
                    className="pvtButton"
                    onClick={() =>
                      this.props.addValuesToFilter(
                        this.props.name,
                        Object.keys(this.props.attrValues).filter(
                          this.matchesFilter.bind(this),
                        ),
                      )
                    }
                  >
                    Deselect {values.length === shown.length ? 'All' : shown.length}
                  </a>
                </p>
              ) || (
                <p>
                  <a
                    role="button"
                    className="pvtButton"
                    onClick={() =>
                      this.props.setValuesInFilter(
                        this.props.name,
                        ['date'],
                      )
                    }
                  >
                   Day
                  </a>
                  <a
                    role="button"
                    className="pvtButton"
                    onClick={() =>
                      this.props.setValuesInFilter(
                        this.props.name,
                        ['week'],
                      )
                    }
                  >
                   Week
                  </a>
                  <a
                    role="button"
                    className="pvtButton"
                    onClick={() =>
                      this.props.setValuesInFilter(
                        this.props.name,
                        ['month'],
                      )
                    }
                  >
                   Month
                  </a>
                  <a
                    role="button"
                    className="pvtButton"
                    onClick={() =>
                      this.props.setValuesInFilter(
                        this.props.name,
                        ['quarter'],
                      )
                    }
                  >
                   Quarter
                  </a>
                  <a
                    role="button"
                    className="pvtButton"
                    onClick={() =>
                      this.props.setValuesInFilter(
                        this.props.name,
                        ['year'],
                      )
                    }
                  >
                   Year
                  </a>
                </p>
              )}
              {!this.state.isDates && (
                <div className="pvtCheckContainer">
                  <List
                    width={298}
                    height={244}
                    rowCount={shown.length}
                    rowHeight={22}
                    rowRenderer={rowRenderer}
                  />
                </div>
              )}
          </div>
        </Draggable>
      ),
      appRoot!,
    )
  }

  public toggleFilterBox(event: React.MouseEvent<HTMLSpanElement, MouseEvent>) {
    event.persist()
    this.setState(prevState => ({
      ...prevState,
      open: !this.state.open,
      x: event.clientX,
      y: event.clientY,
    }))
    this.props.moveFilterBoxToTop(this.props.name)
  }

  public render() {
    const filtered =
      Object.keys(this.props.valueFilter!).length !== 0
        ? 'pvtFilteredAttribute'
        : ''
    return (
      <li data-id={this.props.name}>
        <span className={`pvtAttr ${filtered}`}>
          {this.props.name}
          <span
            className="pvtTriangle"
            onClick={e => this.toggleFilterBox(e)}
          >
            {' '}
            ▾
          </span>
        </span>

        {this.state.open ? this.getFilterBox() : null}
      </li>
    )
  }
}
