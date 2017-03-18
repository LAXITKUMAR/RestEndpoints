const express = require("express"),
    bodyParser = require('body-parser'),
    fs = require("fs"),
    low = require('lowdb'),
    removeRoute = require('express-remove-route'),
    routePath = "./routers/", //folder path where all routes will be present
    fileAsync = require('lowdb/lib/file-async'),
    app = express(),
    db = low('db.json', {
        storage: fileAsync,
        writeOnChange: false
    }),
    availableEndpoints = db.get('availableEndpoints');


app.use(express.static(__dirname + '/public'));
app.use('/vendor', express.static(__dirname + '/node_modules'));

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({extended: true})); // support encoded bodies
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


// Init
db.defaults({availableEndpoints: []})
    .value();

fs.readdirSync(routePath).forEach(function (file) {
    var route = routePath + file;
    require(route)(app);
});


//--------------------- Application Specific endpoint Reserve Endpoints-------------------------------------------------------------

//Mapping for creating new endpoint
//Note : It is a reserved mapping url
app.post('/ENDPOINTAPP__CREATE__ENDPOINT', function (req, res) {
    console.log("\n\n*********** /ENDPOINTAPP__CREATE__ENDPOINT **********");
    console.log("Request body: ", req.body);
    //Create file content
    var fileContent = "module.exports = function (app) {app." + req.body.method + "('/" + req.body.endpoint + "', function (req, res) { res.send(" + JSON.stringify(req.body.response) + ");});}";
    var filePath = routePath + req.body.endpoint + '_' + req.body.method + '.js';

    fs.writeFile(filePath, fileContent, function (err) {
        if (err) {
            return console.log("Error while writing file: ", err);
        }


        console.log("The " + filePath + " is saved successfully!");

        //remove route cache
        delete require.cache[require.resolve(filePath)];
        try {
            //add file to route list
            require(filePath)(app);
        } catch (err) {
            console.log("error ocuured while requiring enpoint file:", err);
        }

        //Add to available end point list
        availableEndpoints
            .push(req.body)
            .last()
            .value();

        db.write()
            .then(function () {
                res.send(db.get('availableEndpoints'));
            });
        console.log("*****************************************************");
    });

});
//Api for deleting a endpoint
app.post('/ENDPOINTAPP__DELETE__ENDPOINT', function (req, res) {
    console.log("\n\n*********** /ENDPOINTAPP__DELETE__ENDPOINT **********");
    console.log("Request body: ", req.body);
    var path = routePath + req.body.endpoint + '_' + req.body.method + '.js';

    //Delete route mapping from router
    removeRoute(app, "/" + req.body.endpoint);

    //Add to available end point list
    availableEndpoints
        .remove(req.body)
        .value();


    var response = {
        "deletedEndpoint": req.body,
        "availableEndpoints": db.get('availableEndpoints')
    };

    db.write()
        .then(function () {
            res.send(response);
        });

    //Check if path exists if it delete it
    if (fs.existsSync(path)) {
        fs.unlink(path);
    }
    console.log("*****************************************************");
});

app.get('/ENDPOINTAPP__GET__AVAILABLEENDPOINTS', function (req, res) {
    res.send(db.get('availableEndpoints'));
});

app.post('/ENDPOINTAPP__CHECK_IF_AVAILABLE', function (req, res) {
    var isAvailable = db.get('availableEndpoints').find({
        "method": req.body.method,
        "endpoint": req.body.endpoint
    }).value();
    res.send({"isAvailable": !isAvailable});
});

app.get('/', function (req, res) {
    res.sendfile('./public/index.html');
});


app.set('port', process.env.PORT || 3000);
app.listen(app.get('port'), function () {
    console.log('Rest It... Server is listening on port: ' + app.get('port'))
});

