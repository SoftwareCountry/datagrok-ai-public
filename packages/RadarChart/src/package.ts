/* Do not change these import lines. Datagrok will import API library in exactly the same manner */
import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';

import { RadarViewer } from './radar.grok';


export const _package = new DG.Package;

//name: Radar
//description: Radar chart
//tags: viewer
//output: viewer result
export function radarChart() {
    return new RadarViewer();
}