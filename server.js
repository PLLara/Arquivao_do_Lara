const http = require("http")
const fs = require("fs")
var formidable = require('formidable')
console.clear()
Array.prototype.last = function () {
    return this[this.length - 1]
}

function sanitize(string) {
    if (string) {
        let sanitizedString = (string.split('').filter(char => {
            return char.match(/[a-z,' ','ç',0-9]/i)
        })).join("").replace(/ /g, '+')
        return sanitizedString == undefined || sanitizedString == "undefined" ? null : sanitizedString
    }
    return null
}

function handleInitialRequest(req, res) {
    console.log(req.method)
    res.setHeader("Accept","application/json")
    switch (req.method) {
        case 'GET':
            function index(req, res) {
                fs.readFile("./index.html", "utf-8", (err, index) => {
                    fs.readdir("./image", (err, files) => {
                        res.write(index)
                        if (files){
                            files.forEach(file => {
                                res.write(`
                                    <iframe frameborder="0" scrolling="no" onload="resizeIframe(this)" src="./image/${file}">file</iframe>`)
                            })
                        }
                        res.end(`</main>
                        </body>
                        </html>${req.connection.remoteAddress}`)
                    })
                })
            }
            function getImage(req, res) {
                let ext = req.url.split('.')[1];
                let extMime = {
                    "jpg": "image/jpg",
                    "png": "image/png",
                    "gif": "image/gif",
                    "webp": "image/webp",
                    "avi": "video/x-msvideo",
                    "mpeg": "video/mpeg",
                    "webm": "video/webm",
                    "mp3": "audio/mp3",
                    "txt": "text/html",
                    "html": "text/html",
                    "mp4": "video/mp4",
                    'jfif': 'image/png',
                    'jpeg': 'image/jpeg',
                    'pdf': 'application/pdf'
                }
                var path = `.${req.url}`
                fs.lstat(path, (err, stats) => {
                    if (!err) {
                        if (stats.isDirectory()) {
                            res.end("ERROR")
                        } else {
                            let fileStream = fs.createReadStream(path)
                            fileStream.on('open', (err) => {
                                let contentType = extMime[ext] || 'image/png'
                                res.setHeader('Content-Type', contentType)
                                fileStream.pipe(res)
                            })
                        }
                    } else {
                        res.end('error')
                    }
                })
            }
            try {
                let path = req.url.split('/')[1];

                ({
                    '': index,
                    'image': getImage
                })[path](req, res)
            }
            catch (err) {
                res.end("ERROR")
            }
            break;
        case 'POST':
            // As Rotdas do projeto
            try {
                ({
                    '/': addImage,
                })[req.url](req, res)
            }
            catch {
                res.end("ERROR")
            }

            function addImage(req, res) {
                var form = new formidable.IncomingForm();
                form.parse(req, (err, fields, files) => {
                    console.clear()
                    if (err) throw err
                    let nome = sanitize(fields["nome"].split('.')[0])
                    let ext = sanitize(files["image"]["name"].split('.').last())
                    if (!nome || !ext || typeof ext == 'number') {
                        res.writeHead(400)
                        res.end(`BAD NAME and/or FILE EXTENSION`)
                        return
                    }
                    let arquivoFinal = `${nome}.${ext}`
                    let tmpLocation = files["image"]["path"]
                    console.log(`File -> ${arquivoFinal}`)
                    fs.rename(tmpLocation, `./image/${arquivoFinal}`, err => {
                        res.writeHead(400)
                        res.end(err)
                        return
                    })
                    res.writeHead(301, { "Location": "/" })
                    res.end(" asd ")
                })
            }
            break;
    }
}
const server = http.createServer(handleInitialRequest)
const port = process.env.PORT || 8080
console.log(`Servidor rodando: http://localhost:${port}`)
server.listen(port)