import { serveDir } from "https://deno.land/std@0.223.0/http/file_server.ts";

// ひらがなの正規表現
const regexHiragana = new RegExp(/[\u3041-\u3096]/g);
// カタカナのみを含む正規表現
const regexKatakana = new RegExp(/^[\u30A1-\u30FF]+$/);

// 変数定義
const historyWord = {};
const previousWordIdx = {};
const points = {};

// 実在する単語リストを読み込む
const existingWordsText = await Deno.readTextFile("./private/BCCWJ_frequencylist_suw_ver1_1.tsv");
const existingWords = existingWordsText.split("\n").map((line, idx) => {
    line = line.replace("\r", "");
    const ary = line.split("\t");
    if(ary[3] === undefined) return undefined;
    if((ary[3].includes("名詞-普通名詞") || ary[3].includes("名詞-固有名詞-地名")) && regexKatakana.test(ary[1])){
        return [ary[1], ary[2]];
    }else{
        return undefined;
    }
}).filter((ele) => {return ele;}).toSorted();

// 初期化
function initialize(id){
    if(historyWord[id] === undefined) historyWord[id] = new Set();
    else historyWord[id].clear();
    points[id] = 0;
    do {
        setPreviousWordIdx(id, Math.floor(Math.random() * existingWords.length));
    } while (getPreviousWord(id).slice(-1) === "ん" || getPreviousWord(id).slice(-1) === "ン");
    addHistory(id, getPreviousWord(id));
}

// 前の単語を設定
function setPreviousWordIdx(id, num){
    previousWordIdx[id] = num;
}
// 表示用の単語を取得
function getPreviousWordDisplay(id){
    return existingWords[previousWordIdx[id]][1];
}
// 内部用の単語を取得
function getPreviousWord(id){
    return existingWords[previousWordIdx[id]][0];
}

// 入力した単語が存在するかをめぐる式二分探索
function findWordIndex(str){
    str = hiraToKana(str);
    let ng = -1; let ok = existingWords.length;
    while(Math.abs(ok - ng) > 1){
        const mid = Math.floor((ok+ng) / 2);
        // console.log(`existingWords[${mid}]=[${existingWords[mid][0]},${existingWords[mid][1]}]`);
        if(existingWords[mid][0] >= str){
            ok = mid;
        }else{
            ng = mid;
        }
    }
    // console.log(`existingWords[${ok}]=[${existingWords[ok]}]`);
    if(existingWords[ok][0] === str) return ok;
    else return -1;
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
function addHistory(id, str){
    historyWord[id].add(hiraToKana(str));
}
// 履歴に存在するか
function hasHistory(id, str){
    return historyWord[id].has(hiraToKana(str));
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

// しりとりが成立しているかをチェック
function isShiritoriOk(previousWord, nextWord){
    const previousWordTail = previousWord.slice(-1);
    if(previousWordTail === "ー" || previousWordTail === "―"){
        previousWord = previousWord.slice(0, -1);
    }
    return (
        equalCharKanaHira(previousWord.slice(-1), nextWord.slice(0,1))
    );
}

// 得点計算
// 1単語につき追加得点は、単語の長さ×残り時間
// 最初と最後が同文字なら追加得点を2倍
function addPoint(id, word, remainingTime){
    let pointDiff = Math.ceil(word.length * remainingTime);
    if(equalCharKanaHira(word.slice(0,1), word.slice(-1))) pointDiff *= 2;
    points[id] += pointDiff;
}
// 得点取得
function getPoint(id){
    return points[id];
}

// 初期化
initialize()
console.log("Finish initializing");


Deno.serve(async (request) => {
    const pathname = new URL(request.url).pathname;
    console.log(`pathname: ${pathname}`);
    if(pathname === "/shiritori" && request.method === "GET"){
        return new Response(`${getPreviousWordDisplay()}(${getPreviousWord()})`);
    }else if(pathname === "/shiritori" && request.method === "POST"){
        const requestJson = await request.json();  // リクエストのペイロードを取得
        const nextWord = requestJson["nextWord"];
        const id = requestJson["id"];
        // 不正な入力を弾く
        // 最後と最初の文字が一致していないとき
        if(!isShiritoriOk(getPreviousWord(id), nextWord)){
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
        if(hasHistory(id, nextWord)){
            return makeErrorResponse("過去に出ている単語です", "10003");
        }
        setPreviousWordIdx(id, nextWordIndex);
        addPoint(id, nextWord, requestJson["remainingTime"]);
        addHistory(id, getPreviousWord(id));
        return new Response(`${getPreviousWordDisplay(id)}(${getPreviousWord(id)})`);
    }else if(pathname === "/reset" && request.method === "POST"){
        const requestJson = await request.json();
        const id = requestJson["id"];
        initialize(id);
        return new Response(`${getPreviousWordDisplay(id)}(${getPreviousWord(id)})`);   
    }else if(pathname === "/point" && request.method === "POST"){
        const requestJson = await request.json();
        const id = requestJson["id"];
        return new Response(getPoint(id));
    }
    return serveDir(
        request, {
            fsRoot: "./public/",  // 公開フォルダを指定
            urlRoot: "",  // フォルダを展開するURLを指定
            enableCors: true,  // CORSの設定を付与するか
        }
    );
})





