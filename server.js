import { serveDir } from "https://deno.land/std@0.223.0/http/file_server.ts";

// 履歴保持
const historyWord = new Set();
// ひらがなのみを含む正規表現
const regexHiragana = new RegExp(/[\u3041-\u3096]/g);
// 実在する単語リストを読み込む
const existingWordsText = await Deno.readTextFile("./private/existingWords.csv");
const existingWords = existingWordsText.split("\n").map((line) => {
    line = line.replace("\r", "");
    return line.split(",");
});
// 変数を定義して初期化
let previousWordIdx;
initialize()

// 初期化
function initialize(){
    historyWord.clear();
    do {
        setPreviousWordIdx(Math.floor(Math.random() * existingWords.length));
    } while (getPreviousWord().slice(-1) === "ん" || getPreviousWord().slice(-1) === "ン");
    addHistory(getPreviousWord());
}

// 前の単語を設定
function setPreviousWordIdx(num){
    previousWordIdx = num;
}
// 表示用の単語を取得
function getPreviousWordDisplay(){
    return existingWords[previousWordIdx][0];
}
// 内部用の単語を取得
function getPreviousWord(){
    return existingWords[previousWordIdx][1];
}

// 入力した単語が存在するか
function findWordIndex(str){
    str = hiraToKana(str);
    return existingWords.findIndex((ary) => {
        return ary[1] === str;
    });
} 

// エラーレスポンス生成
function makeErrorResponse(errorMessage, errorCode){
    return new Response(
        JSON.stringify({
        "errorMessage": errorMessage,
        "errorCode": errorCode
    }),{
        status: 400,
        headers: {"Content-Type": "application/json; charset=utf-8"}
    });
}

// ひらがなをカタカナに変換
function hiraToKana(str){
    return str.replace(regexHiragana, function(match) {
        const char = match.charCodeAt(0) + 0x60;
        return String.fromCharCode(char);
    });
}

// 履歴はカタカナで固定
// 履歴に追加
function addHistory(str){
    historyWord.add(hiraToKana(str));
}
// 履歴に存在するか
function hasHistory(str){
    return historyWord.has(hiraToKana(str));
}


// 拗音の対応付け
const youonDict = {
    "ッ":"ツ", "ャ":"ヤ", "ュ":"ユ", "ョ":"ヨ"
}
// ひらがなとカタカナ、拗音を区別せずに等しいか判定
function equalCharKanaHira(c1, c2){
    if(youonDict[c1] !== undefined) c1 = youonDict[c1];
    if(youonDict[c2] !== undefined) c2 = youonDict[c2];
    c1 = hiraToKana(c1);
    c2 = hiraToKana(c2);
    return c1 === c2;
}

function isShiritoriOk(previousWord, nextWord){
    const previousWordTail = previousWord.slice(-1);
    if(previousWordTail === "ー" || previousWordTail === "―"){
        previousWord = previousWord.slice(0, -1);
    }
    return (
        equalCharKanaHira(previousWord.slice(-1), nextWord.slice(0,1))
    );
}



Deno.serve(async (request) => {
    const pathname = new URL(request.url).pathname;
    console.log(`pathname: ${pathname}`);
    if(pathname === "/shiritori"){   
        if(request.method === "GET"){
            return new Response(`${getPreviousWordDisplay()}(${getPreviousWord()})`);
        }else if(request.method === "POST"){
            const requestJson = await request.json();  // リクエストのペイロードを取得
            const nextWord = requestJson["nextWord"];
            // 不正な入力を弾く
            // 最後と最初の文字が一致していないとき
            if(!isShiritoriOk(getPreviousWord(), nextWord)){
                return makeErrorResponse("しりとりが成立していません", "10001");
            }
            // 存在しない単語が入力されたとき
            const nextWordIndex = findWordIndex(nextWord);
            if(nextWordIndex === -1){
                return makeErrorResponse("存在しない単語です", "10004");
            }
            // 最後の文字が"ん"で終わるとき
            if(nextWord.slice(-1) === "ん" || nextWord.slice(-1) === "ン"){
                return makeErrorResponse("最後の文字が\"ん\"もしくは\"ン\"で終わっています", "10002");
            }
            // 過去に出た単語が入力されたとき
            if(hasHistory(nextWord)){
                return makeErrorResponse("過去に出ている単語です", "10003");
            }
            setPreviousWordIdx(nextWordIndex);
            addHistory(getPreviousWord());
            return new Response(`${getPreviousWordDisplay()}(${getPreviousWord()})`);
        }
    }else if(request.method === "POST" && pathname === "/reset"){
        initialize()
        return new Response(`${getPreviousWordDisplay()}(${getPreviousWord()})`);   
    }
    return serveDir(
        request, {
            fsRoot: "./public/",  // 公開フォルダを指定
            urlRoot: "",  // フォルダを展開するURLを指定
            enableCors: true,  // CORSの設定を付与するか
        }
    );
})





