import * as DG from 'datagrok-api/dg';
import { RadarChart, RadarChartData } from './radar';

const COLUMNS_TO_SHOW_PROPERTY_NAME = 'columnsToShowList'
const ROWS_TO_SHOW_PROPERTY_NAME = 'rowsToShow'
const LEVELS_PROPERTY_NAME = 'levels';
const TITLE_COLUMN_PROPERTY_NAME = 'titleColumnName';

export class RadarViewer extends DG.JsViewer {
    public data: RadarChartData[] = [];

    constructor() {
        super();

        this.stringList(COLUMNS_TO_SHOW_PROPERTY_NAME, []);
        const colsToShowProperty = this.getProperty(COLUMNS_TO_SHOW_PROPERTY_NAME);
        colsToShowProperty.propertyType = DG.VIEWER_PROPERTY_TYPE.COLUMN_LIST;

        this.string(TITLE_COLUMN_PROPERTY_NAME, '');
        this.int(ROWS_TO_SHOW_PROPERTY_NAME, 3);

        this.int(LEVELS_PROPERTY_NAME, 3);
    }

    init() {
        this.root.className = 'radar';

        this.render();
    }

    onTableAttached() {
        this.init();

        this.subs.push(this.dataFrame.selection.onChanged.subscribe((_) => this.render()));
        this.subs.push(this.dataFrame.filter.onChanged.subscribe((_) => this.render()));
    }

    onPropertyChanged() {
        this.render();
    }

    render() {
        this.updateData();
        this.root.innerHTML = '';

        const width = this.root.clientWidth;
        const height = this.root.clientHeight;
        const options = {
            w: width,
            h: height,
            margin: {
                top: height * 0.05, bottom: height * 0.05, left: width * 0.05, right: width * 0.05
            },
            levels: this.numberOfLevels,
            legend: {
                title: 'Legend',
                translateX: -width * 0.2,
                translateY: 0
            }
        }
        new RadarChart('.radar', this.data, options).draw();
    }

    updateData() {
        const colNames = this.columnsToShow == null || this.columnsToShow.length === 0
            ? this.dataFrame.columns.names()
            : this.columnsToShow;
        const columns = colNames.map(cn => this.dataFrame.getCol(cn));

        const data: RadarChartData[] = [];

        const titleCol = this.dataFrame.columns.toList().find(c => c.name === this.titleColumn);
        const rowsToShow = Math.min(this.numberOfRowsToShow, this.dataFrame.rowCount);
        const titles = Array.from(
            {length: rowsToShow},
            ((_, i) => titleCol ? titleCol.get(i) : (i + 1).toString()));

        for (const column of columns) {
            const colValues = column.toList();
            const rawValues = column.getRawData();

            const colName = column.name;
            for (let r = 0; r < rowsToShow; r++) {
                if (r >= data.length) {
                    data.push({'axes': [], name: titles[r]});
                } 

                const value = colValues[r] === undefined
                    ? undefined
                    : column.type === DG.COLUMN_TYPE.DATE_TIME
                        ? new Date(rawValues[r])
                        : colValues[r]
                data[r].axes.push({axis: colName, value});
            }
        }
        this.data = data;
    }

    get columnsToShow(): string[] {
        return this.getProperty(COLUMNS_TO_SHOW_PROPERTY_NAME).get(null)
    }

    get numberOfRowsToShow() {
        return this.getProperty(ROWS_TO_SHOW_PROPERTY_NAME).get(null) || 3;
    }

    get numberOfLevels() {
        return this.getProperty(LEVELS_PROPERTY_NAME).get(null) || 3;
    }

    get titleColumn() {
        return this.getProperty(TITLE_COLUMN_PROPERTY_NAME).get(null) || '';
    }
}