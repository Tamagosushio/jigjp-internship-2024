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

const nextWordInput = document.querySelector("#nextWordInput");
nextWordInput.addEventListener("keydown", (e) => {
    if(e.key === "Enter"){
        const nextWordSendButton = document.querySelector("#nextWordSendButton");
        nextWordSendButton.dispatchEvent(new PointerEvent("click"));
        e.preventDefault();
    }
    return false;
});

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
    if(response.status !== 200){
        const errorJson = await response.text();
        const errorObj = JSON.parse(errorJson);
        const errorCode = errorObj["errorCode"];
        alert(errorObj["errorMessage"]);
        if(errorCode === "10002"){  // 最後の文字が"ん"で終わる
            window.location.href = "./gameOver.html";
        }else if(errorCode === "10003"){  // 過去に出てる単語
            window.location.href = "./gameOver.html";
        }
    }
    const previousWord = await response.text();
    setPreviousWord(previousWord);
}
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