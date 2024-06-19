import { serveDir } from "https://deno.land/std@0.223.0/http/file_server.ts";

let previousWord = "しりとり";

Deno.serve(async (request) => {
    const pathname = new URL(request.url).pathname;
    console.log(`pathname: ${pathname}`);
    return serveDir(
        request, {
            fsRoot: "./public/",  // 公開フォルダを指定
            urlRoot: "",  // フォルダを展開するURLを指定
            enableCors: true,  // CORSの設定を付与するか
        }
    );
})





