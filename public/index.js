// 前の単語を引数に、単語履歴のリストに追加していく
function setPreviousWord(previousWord){
    const paragraphPreviousWord = document.querySelector("#previousWord");
    paragraphPreviousWord.innerHTML = `前の単語: ${previousWord}`;
    nextWordInput.value = "";
    const list = document.getElementById("historyWord");
    const element = document.createElement("li");
    element.innerHTML = `${previousWord}`;
    list.appendChild(element);
}
// Cookie用のランダム文字列を取得
function getRandomString(length){
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let res = "";
    for(let i = 0; i < length; i++){
        res += chars[Math.floor(Math.random() * chars.length)];
    }
    return res;
}
// 引数のCookieの項目を取得
function getCookieItem(key){
    const cookie = document.cookie.split(";");
    let res = undefined;
    cookie.forEach((value) => {
        const content = value.split("=");
        if(content[0] === key) res = content[1];
    });
    return res;
}

// ページのロード時
globalThis.onload = async (event) => {
    if(getCookieItem("id") === undefined){
        document.cookie = `id=${getRandomString(64)};max-age=3600;`;
    }
    const response = await fetch("/reset", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({id: getCookieItem("id")})
    });
    setPreviousWord(await response.text());
}

// 指定時間でタイマー(プログレスバー)を進める
const timeLimit = 10000;
let timeNow = 0; const timeStep = 10;
function getProgressBarColor(){
    if(timeNow > timeLimit*0.8) return "is-danger";
    else if(timeNow > timeLimit*0.6) return "is-warning";
    else return "is-success";
}
const progressBar = document.querySelector("#progressBar");
const progressBarInterval = setInterval(() => {
    timeNow += timeStep;
    progressBar.innerHTML = 
        `<progress class="progress is-large ${getProgressBarColor()}" value="${timeNow}" max="${timeLimit}"></progress>`;
    if(timeNow >= timeLimit){
        clearInterval(progressBarInterval);
        alert("時間切れです");
        window.location.href = "./gameOver.html";
    }
}, timeStep);

// テキスト入力中にEnterで送信できるようにする
const nextWordInput = document.querySelector("#nextWordInput");
nextWordInput.addEventListener("keydown", (e) => {
    if(e.key === "Enter"){
        const nextWordSendButton = document.querySelector("#nextWordSendButton");
        nextWordSendButton.dispatchEvent(new PointerEvent("click"));
        e.preventDefault();
    }
    return false;
});

// 送信ボタンが押された時
const messageBlock = document.querySelector("#messageBlock");
document.querySelector("#nextWordSendButton").onclick = async(event) => {
    const nextWordInput = document.querySelector("#nextWordInput");
    const nextWordInputText = nextWordInput.value;
    const response = await fetch("/shiritori", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            id: getCookieItem("id"),
            nextWord: nextWordInputText
        })
    });
    if(response.status === 200){
        messageBlock.innerHTML = "";
        timeNow = 0;
    }else{
        const errorJson = await response.text();
        const errorObj = JSON.parse(errorJson);
        const errorCode = errorObj["errorCode"];
        const errorMessage = errorObj["errorMessage"];
        // しりとりが成立していない or 存在しない単語
        if(errorCode === "10001" || errorCode === "10004"){  // しりとりが成立していない        
            nextWordInput.value = "";
            messageBlock.innerHTML = errorMessage;
        // 最後が"ん"で終わる or 過去に出ている単語
        }else if(errorCode === "10002" || errorCode === "10003"){  // 最後の文字が"ん"で終わる
            alert(errorMessage);
            window.location.href = "./gameOver.html";
        }
    }
    const previousWord = await response.text();
    setPreviousWord(previousWord);
}

// リセットボタンが押された時
document.querySelector("#resetSendButton").onclick = async(event) => {
    if(!globalThis.confirm("本当にしりとりを仕切り直しますか？")){
        return;
    }
    const response = await fetch("/reset", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({id:getCookieItem("id")})
    });
    const list = document.getElementById("historyWord");
    list.innerHTML = "";
    setPreviousWord(await response.text());
}