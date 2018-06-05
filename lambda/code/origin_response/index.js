const querystring = require('querystring')
const http = require('http')
const https = require('https')
const url = require('url')
const Sharp = require('sharp')

const domains = [];

exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request
    const origin = url.parse(request.uri.substring(1))

    console.log(origin)

    const getFile = origin.protocol === 'https:' ?
        https.get :
        http.get

    const options = querystring.parse(request.querystring)
    const maxSize = 2000
    const width = Math.min(options.width || maxSize, maxSize)
    const height = Math.min(options.height || maxSize, maxSize)

    console.log(width)
    console.log(height)

    // make sure input values are numbers
    if (Number.isNaN(width) || Number.isNaN(height) || origin.protocol === null) {
        console.log('Invalid input')
        callback(null, {
            status: '400',
            statusDescription: 'Invalid input'
        })
    }

    // whitelisting of domains
    if (domains.length && domains.indexOf(origin.host) === -1) {
        console.log('Invalid domain')
        callback(null, {
            status: '403',
            statusDescription: 'Invalid domain'
        })
    }

    // download the file from the origin server
    getFile(origin.href, (res) => {
        const statusCode = res.statusCode

        if (statusCode === 200) {
            var data = []

            res.on('data', function(chunk) {
                data.push(chunk)
            }).on('end', function() {
                var buffer = Buffer.concat(data)

                try {
                    Sharp(buffer)
                        .resize(width, height)
                        .jpeg({
                            quality: 80,
                            chromaSubsampling: '4:4:4',
                            force: true
                        })
                        .max()
                        .toBuffer()
                        .then( (_data) =>  {
                            console.log('Sharp finished')
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
                        }).catch( (err) =>  {
                            console.log(err)
                            callback(null, {
                                status: '302',
                                statusDescription: 'Found',
                                headers: {
                                    location: [{
                                        key: 'Location',
                                        value: origin.href,
                                    }],
                                },
                            })
                        })
                } catch(e) {
                    console.log('Sharp error')
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
                            value: origin.href,
                        }],
                    },
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