const net = require('net')
const stream = require('stream')

const server = net.createServer(function (socket) {

    // socket.setNoDelay(false)
    socket.setKeepAlive(true)

    socket.on('error', function (err) {
        socket.destroy()
        if(err.code !== 'ECONNRESET') {
            console.log('socket error', err)
        }
    })

    // const buffers = []

    const statusCode = 200

    const content = '<h2>it works</h2>'

    socket
    .pipe(new stream.Transform({
        transform: function (data, enc, next) {
            // buffers.push(data)
            if (Buffer.byteLength(data) < socket._readableState.highWaterMark) {
                socket.write([
                    `HTTP/1.1 ${statusCode} OK`,
                    `Content-Length: ${Buffer.byteLength(content)}`,
                    'Connection: keep-alive',
                    'Content-Type: text/html; charset=utf-8',
                    '',
                    content
                ].join('\r\n'))

                next(null)
            }

        }
    }))
    .once('finish', function () {
        socket.end()
    })

})

server.on('server error', (err) => {
    throw err;
})

server.on('close', () => {
    console.log('server close', arguments)
})

// server.on('connection', () => {
//     console.log('connection')
// })

server.on('listening', () => {
    console.log('server listening')
})

server.listen(3000)
