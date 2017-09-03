const net = require('net')
const stream = require('stream')
const httpHeaders = require('http-headers')

const server = net.createServer({
    allowHalfOpen: true
})

server.on('server error', (err) => {
    throw err;
})

server.on('close', () => {
    console.log('server close', arguments)
})

server.on('connection', (socket) => {
    // console.time('end')
    //
    // socket.on('end', function () {
    //     console.timeEnd('end')
    // })
    // socket.once('headers', function () {
    //     console.time('headers')
    // })
    // socket.once('headers_end', function () {
    //     console.timeEnd('headers')
    // })
    // socket.once('body', function () {
    //     console.log('body')
    //     console.time('body')
    // })
    // socket.once('body_end', function () {
    //     console.log('body_end')
    //     console.timeEnd('body')
    // })
    // socket.setNoDelay(false)
    socket.setKeepAlive(true)

    socket.once('timeout', function () {
        socket.destroy()
    })

    socket.once('error', function (err) {
        socket.destroy()
        if(err.code !== 'ECONNRESET') {
            console.log('socket error', err)
        }
    })

    socket.setEncoding('utf-8')

    const statusCode = 200
    const content = '<h2>it works</h2>'
    let headersEnded = false
    let parsedHeaders
    let bodyEnded = false
    let contentLength
    let chunked = false
    let bodyLength = 0
    let headersStr = ''
    let rawHeaders
    let method
    let url
    let body = ''

    socket
    .on('data', function (data) {
        if (!headersEnded) {
            if (data.indexOf('\r\n\r\n') !== -1) {
                headersEnded = true
                const dataParts = data.split('\r\n\r\n')
                socket.emit('headers', dataParts[0])
                socket.emit('headers_end')
                bodyLength += Buffer.byteLength(dataParts[1], 'utf-8')
                socket.emit('body', dataParts[1])
                return
            } else {
                socket.emit('headers', data)
            }
        } else {
            bodyLength += Buffer.byteLength(data, 'utf-8')
            socket.emit('body', data)
        }

    })


    socket.on('headers', headersPart => headersStr += headersPart )
    socket.once('headers_end', function () {
        parsedHeaders = httpHeaders(headersStr)
        // console.log('parsedHeaders', parsedHeaders, bodyLength)
        rawHeaders = parsedHeaders.headers
        method = parsedHeaders.method
        url = parsedHeaders.url
        contentLength = rawHeaders['content-length']
        if (!contentLength || contentLength == bodyLength) {
            socket.emit('body_end')
        }
    })


    socket.on('body', (bodyPart) => {
        body += bodyPart

        if (parsedHeaders && (!contentLength || contentLength == bodyLength)) {
            socket.emit('body_end')
        }
    })
    socket.once('body_end', function () {
        // console.log('body', method, url, body)
        socket.write([
            `HTTP/1.1 ${statusCode} OK`,
            `Content-Length: ${Buffer.byteLength(content)}`,
            'Connection: keep-alive',
            'Content-Type: text/html; charset=utf-8',
            '',
            content
        ].join('\r\n'))
        socket.end()
    })

})

server.on('listening', () => {
    console.log('server listening')
})

server.listen(3000)
