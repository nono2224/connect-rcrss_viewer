const net = require("net");
const proto = require("./RCRSProto_pb");
const fs = require("fs");

let fileNum = 0;
let buffer = Buffer.alloc(0); // 受信データを蓄積するためのバッファ

// メッセージをシミュレーションサーバに送信
const client = net.connect("27931", "localhost", () => {
    const message = new proto.MessageProto();
    // VKConnect: ビューワからの接続要求に使用するメッセージ
    message.setUrn(0x0100 | 13);

    const map = message.getComponentsMap();
    const requestId = new proto.MessageComponentProto();
    const version = new proto.MessageComponentProto();
    const name = new proto.MessageComponentProto();
    // requestIdはユニークな値にする必要あり
    requestId.setIntvalue(2);
    // versionはサーバ側で使用されている気配はないので適当な値で良い
    version.setIntvalue(1);
    // nameはViewerの名前を設定
    name.setStringvalue("ringo");

    map.set(0x0200 | 1, requestId);
    map.set(0x0200 | 3, version);
    map.set(0x0200 | 4, name);

    send(message);
});

// シミュレーションサーバからのメッセージを受信
client.on("data", (data) => {
    // 受信データをバッファに追加
    buffer = Buffer.concat([buffer, data]);

    // メッセージのサイズが読み取れるか確認 (4バイト以上必要)
    while (buffer.length >= 4) {
        // メッセージのサイズを取得
        const size = (buffer[0] << 24) | (buffer[1] << 16) | (buffer[2] << 8) | buffer[3];

        // メッセージ全体がバッファに到着しているか確認
        if (buffer.length < size + 4) {
            console.log(`Waiting for more data. Expected: ${size + 4}, Received: ${buffer.length}`);
            return; // データが足りない場合は、次の 'data' イベントを待つ
        }

        // メッセージ全体を切り出す
        const messageData = buffer.subarray(4, size + 4);

        // バッファから処理済みのメッセージを削除
        buffer = buffer.subarray(size + 4);

        let res;
        try {
            // メッセージをデシリアライズ
            res = proto.MessageProto.deserializeBinary(messageData);
        } catch (error) {
            console.error("Deserialization error:", error);
            console.error("Received data length:", messageData.length); // 受信データ長
            console.error("Expected size:", size); // 期待されるサイズ
            // 必要に応じて、ここでエラーハンドリングを強化 (例: 接続をリセット)
            return;
        }

        // メッセージをJSON形式で出力
        // シミュレーション中は毎ステップごとにKVTimestepが送られてくる．中身についてはrcrs-serverのrescuecore2.messages.control.KVTimestepを参照．
        // appendFileAsync(JSON.stringify(res.toObject()));
        writeFileAsync(JSON.stringify(res.toObject()));

        // 帰ってきたメッセージのURNがKVConnectOKのとき
        if (res.getUrn() == (0x0100 | 15)) {
            const message = new proto.MessageProto();
            // KVAcknowledge: サーバからの接続許可を受け取ったことをサーバに通知するメッセージ
            message.setUrn(0x0100 | 14);

            const map = message.getComponentsMap();
            const requestId = new proto.MessageComponentProto();
            const viewerId = new proto.MessageComponentProto();
            // requestIdとviewerIdはKVConnectOKのメッセージから取得できる
            requestId.setIntvalue(
                res
                    .getComponentsMap()
                    .get(0x0200 | 1)
                    .getIntvalue()
            );
            viewerId.setIntvalue(
                res
                    .getComponentsMap()
                    .get(0x0200 | 12)
                    .getIntvalue()
            );

            map.set(0x0200 | 1, requestId);
            map.set(0x0200 | 12, viewerId);

            send(message);
        }
    }
});

client.on("error", (err) => {
    //エラーハンドリング
    console.error("Socket error:", err);
    // 接続エラーが発生した場合の処理 (例: リトライ、終了)
});

function send(message) {
    const buffer = message.serializeBinary();
    const sizeBuffer = new Uint8Array([(buffer.length >> 24) & 255, (buffer.length >> 16) & 255, (buffer.length >> 8) & 255, buffer.length & 255]);
    client.write(sizeBuffer);
    client.write(buffer);
}

function appendFileAsync(data) {
    const filePath = "./out/" + fileNum + ".json";

    fs.appendFile(filePath, data, (err) => {
        if (err) {
            console.error("ファイル追記エラー:", err);
            return;
        }
        console.log("ファイルに追記しました:", filePath);
    });

    fileNum++;
}

function writeFileAsync(data) {
    const filePath = "./out/" + fileNum + ".json";

    fs.writeFile(filePath, data, (err) => {
        if (err) {
            console.error("ファイル書き込みエラー:", err);
            return;
        }
        console.log("ファイルに書き込みました:", filePath);
    });

    fileNum++;
}
