const querystring = require('querystring')
const http = require('http')
const https = require('https')
const url = require('url')
const Sharp = require('sharp')

// headers that cloudfront does not allow in the http response
const blacklistedHeaders = [
    /^connection$/i,
    /^content-length$/i,
    /^expect$/i,
    /^keep-alive$/i,
    /^proxy-authenticate$/i,
    /^proxy-authorization$/i,
    /^proxy-connection$/i,
    /^trailer$/i,
    /^upgrade$/i,
    /^x-accel-buffering$/i,
    /^x-accel-charset$/i,
    /^x-accel-limit-rate$/i,
    /^x-accel-redirect$/i,
    /^X-Amz-Cf-.*/i,
    /^X-Amzn-.*/i,
    /^X-Cache.*/i,
    /^X-Edge-.*/i,
    /^X-Forwarded-Proto.*/i,
    /^X-Real-IP$/i
];

const domains = [];

exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request
    const origin = url.parse(request.uri.substring(1))

    const getFile = origin.protocol === 'https:' ?
        https.get :
        http.get

    const options = querystring.parse(request.querystring)
    const maxSize = 2000
    const width = Math.min(options.width || maxSize, maxSize)
    const height = Math.min(options.height || maxSize, maxSize)

    // make sure input values are numbers
    if (Number.isNaN(width) || Number.isNaN(height) || origin.protocol === null) {
        console.log('Invalid input')
        context.succeed({
            status: '400',
            statusDescription: 'Invalid input'
        })
    }

    // whitelisting of domains
    if (domains.length && domains.indexOf(origin.host) === -1) {
        console.log('Invalid domain')
        context.succeed({
            status: '403',
            statusDescription: 'Invalid domain'
        })
    }

    // download the file from the origin server
    getFile(origin.href, (res) => {
        const statusCode = res.statusCode
        // grab headers from the origin request and reformat them
        // to match the lambda@edge return format
        const originHeaders = Object.keys(res.headers)
            // some headers we get back from the origin
            // must be filtered out because they are blacklisted by cloudfront
            .filter((header) => blacklistedHeaders.every((blheader) => !blheader.test(header)))
            .reduce((acc, header) => {
                acc[header.toLowerCase()] = [
                    {
                        key: header,
                        value: res.headers[header]
                    }
                ]
                return acc
            }, {})

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
                        .then( (data) =>  {
                            console.log('Sharp finished')
                            context.succeed({
                                bodyEncoding: 'base64',
                                body: new Buffer(data, 'binary').toString('base64'),
                                headers: originHeaders,
                                status: '200',
                                statusDescription: 'OK'
                            })
                        }).catch( (err) =>  {
                            console.log(err)
                            context.succeed({
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
                    context.succeed({
                        status: '500',
                        statusDescription: 'Error resizing image'
                    })
                }
            }).on('error', (e) => {
                console.log(e)
                context.succeed({
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
            context.succeed({
                status: statusCode.toString(),
                headers: originHeaders
            })
        }
    })
}