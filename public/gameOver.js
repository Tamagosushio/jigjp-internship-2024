
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

document.querySelector("#returnShiritori").onclick = async(event) => {
    window.location.href = "./index.html";
}

const pointResult = document.querySelector("#pointResult");
globalThis.onload = async () => {
    const request = await fetch("/point", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            id: getCookieItem("id")
        })
    });
    pointResult.innerText = `あなたの得点は${await request.text()}点です`;
}
