// An example of using PCA (Principal Component Analysis).
//
// https://datagrok.ai/help/dialogs/pca

gr.loadDataFrame('/demo/cars.csv')
    .then(t => ml.pca(t, ["wheel.base", "length", "width", "height", "city.mpg", "price"], 2, true, true)
        .then(t => gr.addTableView(t)));