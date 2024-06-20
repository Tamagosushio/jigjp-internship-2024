import { serveDir } from "https://deno.land/std@0.223.0/http/file_server.ts";

// private内のcsvファイルを読み込む
const csvText = await Deno.readTextFile("./private/initialWords.csv");
const initialWords = csvText.split(",");
// 候補の単語の中からランダムに初期単語をピック
let previousWord = initialWords[Math.floor(Math.random() * initialWords.length)];
const historyWord = new Set();
historyWord.add(previousWord);

// ひらがなのみを含む正規表現
const regexHiragana = new RegExp("[ぁ-ん]+");

// 初期化
function initialize(){
    historyWord.clear()
    previousWord = initialWords[Math.floor(Math.random() * initialWords.length)];
    historyWord.add(previousWord);
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

Deno.serve(async (request) => {
    const pathname = new URL(request.url).pathname;
    console.log(`pathname: ${pathname}`);
    if(pathname === "/shiritori"){   
        if(request.method === "GET"){
            return new Response(previousWord);
        }else if(request.method === "POST"){
            const requestJson = await request.json();  // リクエストのペイロードを取得
            const nextWord = requestJson["nextWord"];
            // 不正な入力を弾く
            // ひらがな以外が入力されたとき
            if(!regexHiragana.test(nextWord)){
                return makeErrorResponse("ひらがな以外が含まれています", "10004")
            // 最後と最初の文字が一致していないとき
            }else if(previousWord.slice(-1) !== nextWord.slice(0,1)){
                return makeErrorResponse("しりとりが成立していません", "10001");
            // 最後の文字が"ん"で終わるとき
            }else if(nextWord.slice(-1) === "ん"){
                return makeErrorResponse("最後の文字が\"ん\"で終わっています", "10002");
            // 過去に出た単語が入力されたとき
            }else if(historyWord.has(nextWord)){
                return makeErrorResponse("過去に出ている単語です", "10003");
            }
            historyWord.add(nextWord);
            previousWord = nextWord;
            return new Response(previousWord);
        }
    }else if(request.method === "POST" && pathname === "/reset"){
        await initialize()
        return new Response(previousWord);
    }
    return serveDir(
        request, {
            fsRoot: "./public/",  // 公開フォルダを指定
            urlRoot: "",  // フォルダを展開するURLを指定
            enableCors: true,  // CORSの設定を付与するか
        }
    );
})





