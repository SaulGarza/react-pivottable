import * as React from 'react';

import TableRenderers from './TableRenderers';
import {
  IPivotDataProps,
  PivotDataDefaultProps,
} from './Utilities';

export interface IPivotTableProps extends IPivotDataProps {
  rendererName: string
  renderers: any
}
export class PivotTable extends React.PureComponent<IPivotTableProps,{}> {
  public RenderedTable: any
  public static defaultProps = {
    ...PivotDataDefaultProps,
    rendererName: 'Table',
    renderers: TableRenderers,
  }
  public render() {
    const Renderer = this.props.renderers[this.props.rendererName! in this.props.renderers
      ? this.props.rendererName!
      : Object.keys(this.props.renderers)[0]];
    return <Renderer {...this.props} ref={component => this.RenderedTable = component}/>;
  }
}
