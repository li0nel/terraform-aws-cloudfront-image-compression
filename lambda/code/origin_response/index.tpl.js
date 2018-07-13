const querystring = require('querystring')
const http = require('http')
const Sharp = require('sharp')

exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request

    console.log(request.uri)

    if (request.uri === '/favicon.ico') {
        // avoids generating 404 errors when testing image compression in the browser
        callback(null, {
            bodyEncoding: 'base64',
            body: 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQEAYAAABPYyMiAAAABmJLR0T///////8JWPfcAAAACXBIWXMAAABIAAAASABGyWs+AAAAF0lEQVRIx2NgGAWjYBSMglEwCkbBSAcACBAAAeaR9cIAAAAASUVORK5CYII=',
            headers: {
                'content-type': [{
                    key: 'Content-Type',
                    value: 'image/x-icon'
                }]
            },
            status: '200',
            statusDescription: 'OK'
        })
    } else {
        const options = querystring.parse(request.querystring)
        const maxSize = 2000
        const width = Math.min(options.width || maxSize, maxSize)
        const height = Math.min(options.height || maxSize, maxSize)
        const webp = options.webp == 1
        const source_url = 'http://${s3_website_endpoint}' + request.uri

        console.log(source_url)

        // make sure input values are numbers
        if (Number.isNaN(width) || Number.isNaN(height)) {
            callback(null, {
                status: '400',
                statusDescription: 'Invalid input'
            })
        } else {
            // download the file from the origin server
            http.get(source_url, (res) => {
                const statusCode = res.statusCode

                if(statusCode === 200) {
                    var data = []

                    res.on('data', function (chunk) {
                        data.push(chunk)
                    }).on('end', function () {
                        var buffer = Buffer.concat(data)

                        try {
                            if (webp) {
                                Sharp(buffer)
                                    .resize(width, height)
                                    .webp({
                                        quality: 80,
                                        force: true
                                    })
                                    .max().toBuffer()
                                    .then((_data) => {
                                        callback(null, {
                                            bodyEncoding: 'base64',
                                            body: new Buffer(_data, 'binary').toString('base64'),
                                            headers: {
                                            'cache-control': [{
                                                key: 'Cache-Control',
                                                value: 'max-age=100'
                                            }],
                                                'content-type': [{
                                                key: 'Content-Type',
                                                value: 'image/webp'
                                            }]
                                        },
                                        status: '200',
                                        statusDescription: 'OK'
                                    })
                                }).catch((err) => {
                                    console.log(err)
                                    callback(null, {
                                        status: '302',
                                        statusDescription: 'Found',
                                        headers: {
                                            location: [{
                                                key: 'Location',
                                                value: source_url,
                                            }],
                                        },
                                    })
                                })
                            } else {
                                Sharp(buffer)
                                    .resize(width, height)
                                    .jpeg({
                                        quality: 80,
                                        chromaSubsampling: '4:4:4',
                                        force: true,
                                        progressive: true
                                    })
                                    .max().toBuffer()
                                    .then((_data) => {
                                        callback(null, {
                                            bodyEncoding: 'base64',
                                                body: new Buffer(_data, 'binary').toString('base64'),
                                                headers: {
                                                'cache-control': [{
                                                    key: 'Cache-Control',
                                                    value: 'max-age=100'
                                                }],
                                                    'content-type': [{
                                                    key: 'Content-Type',
                                                    value: 'image/jpeg'
                                                }]
                                            },
                                            status: '200',
                                            statusDescription: 'OK'
                                        })
                                    }).catch((err) => {
                                        console.log(err)
                                        callback(null, {
                                            status: '302',
                                            statusDescription: 'Found',
                                            headers: {
                                                location: [{
                                                    key: 'Location',
                                                    value: source_url,
                                                }],
                                            },
                                        })
                                    })
                            }
                        } catch (e) {
                            console.log(e.stderr)
                            callback(null, {
                                status: '500',
                                statusDescription: 'Error resizing image'
                            })
                        }
                    }).on('error', (e) => {
                        console.log(e)
                        callback(null, {
                            status: '302',
                            statusDescription: 'Found',
                            headers: {
                                location: [{
                                    key: 'Location',
                                    value: source_url,
                                }]
                            }
                        })
                    })
                } else {
                    // grap the status code from the origin request
                    // and return to the viewer
                    console.log('statusCode: ', statusCode)
                    callback(null, {
                        status: statusCode.toString(),
                        headers: originHeaders
                    })
                }
            })
        }
    }
}