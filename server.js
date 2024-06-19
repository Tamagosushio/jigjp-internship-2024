import { serveDir } from "https://deno.land/std@0.223.0/http/file_server.ts";

let previousWord = "しりとり";
const historyWord = new Set();
historyWord.add(previousWord);

function initialize(){
    previousWord = "しりとり"
    historyWord.clear()
    historyWord.add(previousWord);
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
            // 最後と最初の文字が一致していないとき
            if(previousWord.slice(-1) !== nextWord.slice(0,1)){
                return new Response(
                    JSON.stringify({
                        "errorMessage": "しりとりが成立していません",
                        "errorCode": "10001"
                    }),{
                        status: 400,
                        headers: {"Content-Type": "application/json; charset=utf-8"}
                    }
                );
            // 最後の文字が"ん"で終わるとき
            }else if(nextWord.slice(-1) === "ん"){
                return new Response(
                    JSON.stringify({
                        "errorMessage": "最後の文字が\"ん\"で終わっています",
                        "errorCode": "10002"
                    }),{
                        status: 400,
                        headers: {"Content-Type": "application/json; charset=utf-8"}
                    }
                );
            // 過去に出た単語が入力されたとき
            }else if(historyWord.has(nextWord)){
                return new Response(
                    JSON.stringify({
                        "errorMessage": "過去に出ている単語です",
                        "errorCode": "10003"
                    }),{
                        status: 400,
                        headers: {"Content-Type": "application/json; charset=utf-8"}
                    }
                );
            }
            historyWord.add(nextWord);
            previousWord = nextWord;
            return new Response(previousWord);
        }
    }
    return serveDir(
        request, {
            fsRoot: "./public/",  // 公開フォルダを指定
            urlRoot: "",  // フォルダを展開するURLを指定
            enableCors: true,  // CORSの設定を付与するか
        }
    );
})





