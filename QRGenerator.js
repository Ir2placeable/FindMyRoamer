// const express = require('express');
// const app = express();
const QRCode = require('qrcode');
// const url = require('url');
//
// app.get('/create_pet', (req, res) => {
//     const temp = url.parse(req.url, true).query;
//     const address = temp['address'];
//     QRCode.toDataURL(address, function(err, url) {
//         const data = url.replace(/.*,/, '');
//         const img = new Buffer(data, 'base64');
//         res.writeHead(200 , {'Content-Type':'image/png'});
//         res.end(img);
//     })
// })
//
// app.listen(3000 , function(req, res){
//     console.log('SERVER Start!!!')
// });

module.exports = async function(address) {
    await QRCode.toDataURL(address, function(err, url) {
        const data = url.replace(/.*,/, '');
        const img = new Buffer(data, 'base64');

        return img;
    })
}