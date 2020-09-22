const COLUMNS_TO_SHOW_PROPERTY_NAME = 'columnsToShowList'
const ROWS_TO_SHOW_PROPERTY_NAME = 'rowsToShow'
const LEVELS_PROPERTY_NAME = 'levels';

class RadarViewer extends DG.JsViewer {
    constructor() {
        super();

        this.stringList(COLUMNS_TO_SHOW_PROPERTY_NAME, []);
        const colsToShowProperty = this.getProperty(COLUMNS_TO_SHOW_PROPERTY_NAME);
        colsToShowProperty.propertyType = DG.VIEWER_PROPERTY_TYPE.COLUMN_LIST;

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
                top: height * 0.1, bottom: height * 0.1, left: width * 0.15, right: width * 0.15
            },
            levels: this.numberOfLevels
        }
        RadarChart('.radar', this.data, options);
    }

    updateData() {
        const colNames = this.columnsToShow == null || this.columnsToShow.length === 0
            ? this.dataFrame.columns.names()
            : this.columnsToShow;
        const columns = colNames.map(cn => this.dataFrame.getCol(cn));

        const data = [];

        for (const column of columns) {
            const colValues = column.toList();
            const rawValues = column.getRawData();

            for (let r = 0; r < this.numberOfRowsToShow && r < colValues.length; r++) {
                const colName = column.name;
                if (r >= data.length) {
                    data.push({'axes': [], name: (r + 1).toString()});
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

    get columnsToShow() {
        return this.getProperty(COLUMNS_TO_SHOW_PROPERTY_NAME).get();
    }

    get numberOfRowsToShow() {
        return this.getProperty(ROWS_TO_SHOW_PROPERTY_NAME).get() || 3;
    }

    get numberOfLevels() {
        return this.getProperty(LEVELS_PROPERTY_NAME).get() || 3;
    }
}