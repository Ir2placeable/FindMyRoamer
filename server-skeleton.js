const express = require('express')
const app = express();
const url = require('url');
const QRCode = require('qrcode');
// const server_address = "....."

// 메인 홈 화면 
app.get('/main', (req, res) => {
    // 반려동물 등록 웹페이지로 이동하는 버튼

    // 주변에 집나간 반려동물 목록을 보여주는 웹페이지로 이동하는 버튼
})

// 반려동물 등록 웹페이지
app.get('/register', (req, res) => {
    // 블록체인에서 스마트 계약 발급 후 고유 CA 리턴
    // server_address/pet/?address=CA 형식으로 QR 코드 만들기

    const temp = url.parse(req.url, true).query;
    const address = temp['address'];

    // 제작된 QR 코드 전송하는 코드
    QRCode.toDataURL(address, function(err, url) {
        const data = url.replace(/.*,/, '');
        const img = new Buffer(data, 'base64');
        res.writeHead(200 , {'Content-Type':'image/png'});
        res.end(img);
    })


})

// QR 코드를 찍으면 이동되는 페이지
app.get('/pet', (req, res) => {
    // 주인인 경우 분실 신고 -> /lost

    // 목격자인 경우 반려동물 발견 -> /found

})

// 분실 신고하는 페이지
app.get('/lost', (req, res) => {

})

// 목격자가 반려동물을 발견한 페이지
app.get('/found', (req, res) => {

})

// 주변에 분실된 반려동물을 보여줌
app.get('/browse', (req, res) => {

})

app.listen(8080, () => {
    console.log('server open');
})