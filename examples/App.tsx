import * as React from 'react'
import tips from './tips'

import * as Papa from 'papaparse'
import Dropzone from 'react-dropzone'

import { PivotState } from '../react-pivottable'
import '../src/pivottable.scss'
import { sortAs } from '../src/Utilities'

import { PivotTableUISmartWrapper } from './SmartWrapper'

interface IState {
  mode: string
  filename: string
  pivotState: PivotState
  textarea: string
}
export default class App extends React.Component<{},IState> {
  public state: IState
  public componentWillMount() {
    this.setState({
      mode: 'demo',
      filename: 'Sample Dataset: Tips',
      pivotState: {
        data: tips,
        rows: ['Payer Gender'],
        cols: ['Party Size'],
        aggregatorName: 'Sum over Sum',
        vals: ['Tip', 'Total Bill'],
        rendererName: 'Grouped Column Chart',
        sorters: {
          Meal: sortAs(['Lunch', 'Dinner']),
          'Day of Week': sortAs([
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
          ]),
        },
        plotlyOptions: {
          width: 900,
          height: 500,
        },
        plotlyConfig: {},
        tableOptions: {
          clickCallback: (e, value, filters, pivotData) => {
            const names: any[] = []
            pivotData.forEachMatchingRecord(
              filters,
              (record) => {
                names.push(record.Meal)
              },
            )
            alert(names.join('\n'))
          },
        },
      },
    })
  }

  public onDrop(files) {
    this.setState(
      {
        mode: 'thinking',
        filename: '(Parsing CSV...)',
        textarea: '',
        pivotState: { data: [] },
      },
      () =>
        Papa.parse(files[0], {
          skipEmptyLines: true,
          error: e => alert(e),
          complete: parsed =>
            this.setState({
              mode: 'file',
              filename: files[0].name,
              pivotState: { data: parsed.data },
            }),
        }),
    )
  }

  public onType(event) {
    Papa.parse(event.target.value, {
      skipEmptyLines: true,
      error: e => alert(e),
      complete: parsed =>
        this.setState({
          mode: 'text',
          filename: 'Data from <textarea>',
          textarea: event.target.value,
          pivotState: { data: parsed.data },
        }),
    })
  }

  public render() {
    return (
      <div>
        <div className="row text-center">
          <div className="col-md-3 col-md-offset-3">
            <p>Try it right now on a file...</p>
            <Dropzone
              onDrop={files => this.onDrop(files)}
              accept="text/csv"
              className="dropzone"
              activeClassName="dropzoneActive"
              rejectClassName="dropzoneReject"
            >
              <p>
                Drop a CSV file here, or click to choose a file
                from your computer.
              </p>
            </Dropzone>
          </div>
          <div className="col-md-3 text-center">
            <p>...or paste some data:</p>
            <textarea
              value={this.state.textarea}
              onChange={e => this.onType(e)}
              placeholder="Paste from a spreadsheet or CSV-like file"
            />
          </div>
        </div>
        <div className="row text-center">
          <p>
            <em>Note: the data never leaves your browser!</em>
          </p>
          <br />
        </div>
        <div className="row">
          <h2 className="text-center">{this.state.filename}</h2>
          <br />

          <PivotTableUISmartWrapper {...this.state.pivotState} />
        </div>
      </div>
    )
  }
}
