import { serveDir } from "https://deno.land/std@0.223.0/http/file_server.ts";

let previousWord = "しりとり";

Deno.serve(async (request) => {
    const pathname = new URL(request.url).pathname;
    console.log(`pathname: ${pathname}`);
    if(pathname === "/shiritori"){   
        if(request.method === "GET"){
            return new Response(previousWord);
        }else if(request.method === "POST"){
            const requestJson = await request.json();  // リクエストのペイロードを取得
            const nextWord = requestJson["nextWord"];
            if(previousWord.slice(-1) === nextWord.slice(0,1)){
                previousWord = nextWord;
            }else{
                return new Response(
                    JSON.stringify({
                        "errorMessage": "しりとりが成立していません",
                        "errorCode": "10001"
                    }),{
                        status: 400,
                        headers: {"Content-Type": "application/json; charset=utf-8"}
                    }
                );
            }
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





